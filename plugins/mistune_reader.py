# Written by Claude (claude-sonnet-4-6).
"""
Pelican reader plugin that replaces the default Python-Markdown reader with
mistune 3.x, supporting Obsidian syntax:
  - YAML frontmatter (--- delimiters) and Pelican-style Key: Value frontmatter
  - Tables, strikethrough, task lists (built-in mistune plugins)
  - Inline and display math ($...$ / $$...$$) rendered for MathJax
  - Wiki links ([[Page|Display]] and [[Page]])
  - Obsidian callouts (> [!note] Title)
"""

import re

import mistune
import yaml
from pelican import signals
from pelican.readers import BaseReader


# ---------------------------------------------------------------------------
# Callout preprocessor
# ---------------------------------------------------------------------------

# Matches an Obsidian callout block:
#   > [!type] Optional title
#   > content line 1
#   > content line 2
_CALLOUT_RE = re.compile(
    r'^> \[!(\w+)\][ \t]*(.*?)\n((?:>[ \t]?.*\n?)*)',
    re.MULTILINE,
)


def _callout_repl(m: re.Match) -> str:
    kind = m.group(1).lower()
    title = m.group(2).strip()
    body_lines = m.group(3)
    body = re.sub(r'^>[ \t]?', '', body_lines, flags=re.MULTILINE).strip()
    title_html = f'<strong class="callout-title">{title}</strong>\n' if title else ''
    return (
        f'<div class="callout callout-{kind}">\n'
        f'{title_html}'
        f'<p>{body}</p>\n'
        f'</div>\n\n'
    )


def preprocess_callouts(text: str) -> str:
    return _CALLOUT_RE.sub(_callout_repl, text)


# ---------------------------------------------------------------------------
# Wiki link inline plugin
# ---------------------------------------------------------------------------

# No capture groups — mistune merges all patterns into one combined regex,
# so numbered groups don't match what you'd expect.  Extract from group(0).
_WIKI_PATTERN = r'\[\[[^\]|]+?(?:\|[^\]]+?)?\]\]'


def _parse_wiki_link(inline, m, state):
    full = m.group(0)          # e.g. "[[About Me]]" or "[[Projects|Display]]"
    inner = full[2:-2]         # strip [[ and ]]
    if '|' in inner:
        page, display = inner.split('|', 1)
    else:
        page = display = inner
    state.append_token({
        'type': 'wiki_link',
        'raw': display.strip(),
        'attrs': {'page': page.strip()},
    })
    return m.end()


def _wiki_link_plugin(md):
    md.inline.register('wiki_link', _WIKI_PATTERN, _parse_wiki_link, before='link')


# ---------------------------------------------------------------------------
# Custom renderer
# ---------------------------------------------------------------------------

class _ObsidianRenderer(mistune.HTMLRenderer):
    # Allow raw HTML blocks (e.g. callout divs from the preprocessor)
    def __init__(self):
        super().__init__(escape=False)
    """HTMLRenderer extended with wiki links and MathJax-friendly math output."""

    # --- Wiki links ----------------------------------------------------------

    def wiki_link(self, display: str, page: str) -> str:
        slug = page.lower().replace(' ', '-')
        return f'<a href="/{slug}">{display}</a>'

    # --- Math (MathJax delimiters) -------------------------------------------

    def inline_math(self, text: str) -> str:
        return f'\\({text}\\)'

    def block_math(self, text: str) -> str:
        return f'\\[{text}\\]\n'

    # Some mistune versions use 'math' for inline math
    def math(self, text: str) -> str:
        return f'\\({text}\\)'


# ---------------------------------------------------------------------------
# Markdown factory
# ---------------------------------------------------------------------------

def _build_markdown() -> mistune.Markdown:
    renderer = _ObsidianRenderer()
    return mistune.create_markdown(
        renderer=renderer,
        plugins=['strikethrough', 'table', 'task_lists', 'math', _wiki_link_plugin],
    )


# ---------------------------------------------------------------------------
# Frontmatter parser
# ---------------------------------------------------------------------------

def _split_frontmatter(text: str) -> tuple[dict, str]:
    """
    Parse YAML --- frontmatter or Pelican-style Key: Value metadata.

    Returns (metadata_dict, body_string).
    """
    # YAML frontmatter (--- delimited)
    if text.startswith('---'):
        end = text.find('\n---', 3)
        if end != -1:
            yaml_block = text[3:end].strip()
            body = text[end + 4:].lstrip('\n')
            try:
                meta = yaml.safe_load(yaml_block) or {}
                if isinstance(meta, dict):
                    return meta, body
            except yaml.YAMLError:
                pass

    # Pelican-style: "Key: Value" lines until first blank line
    lines = text.split('\n')
    meta: dict = {}
    i = 0
    for i, line in enumerate(lines):
        if not line.strip():
            break
        if ':' in line:
            key, _, val = line.partition(':')
            meta[key.strip().lower()] = val.strip()
    body = '\n'.join(lines[i + 1:])
    return meta, body


# ---------------------------------------------------------------------------
# Reader class
# ---------------------------------------------------------------------------

class MistuneReader(BaseReader):
    enabled = True
    file_extensions = ['md', 'markdown']

    def read(self, filename: str) -> tuple[str, dict]:
        with open(filename, encoding='utf-8') as f:
            raw = f.read()

        meta_raw, body = _split_frontmatter(raw)

        # Process metadata through Pelican's normaliser (handles dates, lists, etc.)
        metadata: dict = {}
        for key, val in meta_raw.items():
            metadata[key] = self.process_metadata(key, str(val))

        # Preprocess Obsidian callouts before markdown parsing
        body = preprocess_callouts(body)

        md = _build_markdown()
        content = md(body)

        return content, metadata


# ---------------------------------------------------------------------------
# Plugin registration
# ---------------------------------------------------------------------------

def _add_reader(readers) -> None:
    readers.reader_classes['md'] = MistuneReader
    readers.reader_classes['markdown'] = MistuneReader


def register() -> None:
    signals.readers_init.connect(_add_reader)

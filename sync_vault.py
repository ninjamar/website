#!/usr/bin/env python3
# Written by Claude (claude-sonnet-4-6).
"""
Obsidian vault sync — copies vault Markdown to the Pelican content tree.

Usage:
    python sync_vault.py            # uses vault.cfg
    python sync_vault.py my.cfg     # uses a custom config file

Configuration: vault.cfg (gitignored)
    [vault]
    path = /path/to/your/vault
    attachment_folder = attachments   # optional, default: attachments

    [mappings]
    Blog = content                   # vault subfolder → pelican dest
    Pages = content/pages

Architecture mirrors obsidian-to-hugo: a filter+processor pipeline.
  Filters  — decide whether a file is synced at all.
  Processors — transform content before writing.

Obsidian syntax (wiki links, math, callouts) is handled at build time by the
mistune_reader Pelican plugin, so processors do minimal transformation.
"""

import configparser
import re
import shutil
import sys
from pathlib import Path

import yaml

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}


class VaultSync:
    def __init__(self, config_path: str = 'vault.cfg') -> None:
        cfg = configparser.ConfigParser()
        if not cfg.read(config_path):
            raise FileNotFoundError(
                f"Config file '{config_path}' not found. "
                "Copy vault.cfg and set your vault path."
            )
        self.vault_path = Path(cfg['vault']['path']).expanduser().resolve()
        self.attachment_folder = cfg.get('vault', 'attachment_folder', fallback='attachments')
        self.mappings: dict[str, str] = dict(cfg['mappings'])

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def run(self) -> None:
        for vault_folder, dest in self.mappings.items():
            src = self.vault_path / vault_folder
            if not src.exists():
                print(f'[skip]  {src} does not exist')
                continue
            for md_file in sorted(src.rglob('*.md')):
                if not self._passes_filters(md_file):
                    continue
                text = md_file.read_text(encoding='utf-8')
                text = self._apply_processors(text, md_file)
                rel = md_file.relative_to(src)
                dest_file = Path(dest) / rel
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_text(text, encoding='utf-8')
                print(f'[sync]  {md_file.name} → {dest_file}')
        self._copy_images()

    # -------------------------------------------------------------------------
    # Filters — return False to skip a file
    # -------------------------------------------------------------------------

    def _passes_filters(self, path: Path) -> bool:
        # Skip Obsidian internals and template folders
        excluded_dirs = {'.obsidian', '_templates'}
        if excluded_dirs.intersection(path.parts):
            return False

        # Skip draft files (draft: true in YAML frontmatter)
        try:
            text = path.read_text(encoding='utf-8')
        except OSError:
            return False

        if self._is_draft(text):
            print(f'[draft] {path.name}')
            return False

        return True

    def _is_draft(self, text: str) -> bool:
        if not text.startswith('---'):
            return False
        end = text.find('\n---', 3)
        if end == -1:
            return False
        try:
            meta = yaml.safe_load(text[3:end]) or {}
            return str(meta.get('draft', '')).lower() in ('true', 'yes', '1')
        except yaml.YAMLError:
            return False

    # -------------------------------------------------------------------------
    # Processors — transform content before writing
    # -------------------------------------------------------------------------

    def _apply_processors(self, text: str, path: Path) -> str:
        text = self._fix_image_embeds(text)
        text = self._ensure_slug(text, path)
        return text

    def _fix_image_embeds(self, text: str) -> str:
        """Convert Obsidian image embeds: ![[img.ext]] → ![img](/static/images/vault/img.ext)"""
        def _repl(m: re.Match) -> str:
            img = m.group(1)
            return f'![{img}](/static/images/vault/{img})'

        return re.sub(
            r'!\[\[([^\]]+\.(?:png|jpe?g|gif|webp|svg))\]\]',
            _repl,
            text,
            flags=re.IGNORECASE,
        )

    def _ensure_slug(self, text: str, path: Path) -> str:
        """Inject a slug into YAML frontmatter if one is not already present."""
        if not text.startswith('---'):
            return text
        end = text.find('\n---', 3)
        if end == -1:
            return text
        yaml_block = text[3:end]
        if 'slug:' in yaml_block:
            return text
        slug = path.stem.lower().replace(' ', '-')
        new_yaml = yaml_block.rstrip() + f'\nslug: {slug}'
        return '---' + new_yaml + text[end:]

    # -------------------------------------------------------------------------
    # Image copy
    # -------------------------------------------------------------------------

    def _copy_images(self) -> None:
        attach_dir = self.vault_path / self.attachment_folder
        dest_dir = Path('theme/static/images/vault')
        if not attach_dir.exists():
            return
        dest_dir.mkdir(parents=True, exist_ok=True)
        for img in attach_dir.rglob('*'):
            if img.suffix.lower() in IMAGE_EXTS:
                shutil.copy2(img, dest_dir / img.name)
                print(f'[image] {img.name} → {dest_dir}')


# ---------------------------------------------------------------------------

if __name__ == '__main__':
    config = sys.argv[1] if len(sys.argv) > 1 else 'vault.cfg'
    VaultSync(config).run()

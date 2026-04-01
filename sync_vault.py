#!/usr/bin/env python3
"""
Obsidian vault sync — copies vault Markdown to the Pelican content tree.

Usage:
    python sync_vault.py            # uses vault.toml
    python sync_vault.py my.toml    # uses a custom config file

Configuration: vault.toml
    [vault]
    path = /path/to/your/vault

    articles = ["blog"]              # folders to sync as articles
    files = ["pages", "projects.toml"] # folders/files to copy as-is

    destinations:
    articles → content/articles/{name}
    files → content/files/{name}

Required frontmatter fields for articles:
    title, date, slug, publish

Fields auto-injected if missing:
    template (defaults to "article")

Files are rejected if:
    - Missing any required field
    - publish is false
"""

import shutil
import sys
import tomllib
from pathlib import Path

import frontmatter
import yaml

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
EXCLUDED_DIRS = {".obsidian", "_templates"}

def process_file(text: str) -> str:
    """
    Parse, validate, transform an article. Returns (output_text, "") on success,
    or (None, reason) on failure.

    Required fields: title, date, slug, publish (all case-insensitive).
    Rejects if: publish is false/no/0 (case-insensitive).
    All keys are normalized to lowercase.
    Image embeds are rewritten from Obsidian to Markdown syntax.
    Template is injected if missing.
    """
    try:
        post = frontmatter.loads(text)
    except yaml.YAMLError as exc:
        return None

    meta = {k.lower(): v for k, v in post.metadata.items()}

    required = {"title", "date", "slug", "publish"}
    missing = sorted(required - set(meta.keys()))
    if missing:
        return None

    if str(meta.get("publish", "")).lower() in ("false", "no", "0"):
        return None

    meta.setdefault("template", "article")
    post.metadata = meta

    return frontmatter.dumps(post)


def sync_markdown(vault_path: Path, src_folder: str, dest: Path) -> None:
    """Sync article markdown files and resource files from vault to Pelican content."""
    src = vault_path / src_folder
    if not src.exists():
        return

    for md_file in sorted(src.rglob("*.md")):
        if EXCLUDED_DIRS.intersection(md_file.relative_to(src).parts):
            continue

        try:
            text = md_file.read_text(encoding="utf-8")
        except OSError as exc:
            continue

        text = process_file(text)
        if text is None:
            continue

        dest_file = dest / md_file.relative_to(src)
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        dest_file.write_text(text, encoding="utf-8")

    for res_file in sorted(src.rglob("*")):
        if not res_file.is_file():
            continue
        if EXCLUDED_DIRS.intersection(res_file.relative_to(src).parts):
            continue
        if res_file.suffix.lower() == ".md":
            continue
        dest_file = dest / res_file.relative_to(src)
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(res_file, dest_file)


def copy(vault_path: Path, src_rel: str, dest: Path) -> None:
    """Copy a file or folder from vault to dest with no processing.

    For folders: recurses, skips excluded dirs, lowercases filenames.
    For files: copies directly to dest path.
    """
    src = vault_path / src_rel

    if src.is_file():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        return

    for src_file in sorted(src.rglob("*")):
        if not src_file.is_file():
            continue
        if EXCLUDED_DIRS.intersection(src_file.relative_to(src).parts):
            continue
        rel = src_file.relative_to(src)
        dest_file = dest / rel.parent / rel.name.lower()
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_file, dest_file)

def main(config_path: str = "vault.toml") -> None:
    """Run the sync: articles, raw copies."""
    with open(config_path, "rb") as f:
        cfg = tomllib.load(f)

    vault_path = Path(cfg["vault"]["path"]).expanduser().resolve()

    for name in cfg.get("articles", []):
        sync_markdown(vault_path, name, Path("content") / "articles" / name)

    for name in cfg.get("files", []):
        copy(vault_path, name, Path("content") / "files" / name)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "vault.toml")

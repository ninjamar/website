#!/usr/bin/env python3
"""
Obsidian vault sync — copies vault Markdown to the Pelican content tree.

Usage:
    python sync_vault.py            # uses vault.cfg
    python sync_vault.py my.cfg     # uses a custom config file

Configuration: vault.cfg (gitignored)
    [vault]
    path = /path/to/your/vault

    [mappings]
    Blog = content                    # articles: validated + transformed

    [copies]
    Pages = content/pages             # raw copy (folder or file), no processing

Required frontmatter fields for articles:
    title, date, slug, publish

Fields auto-injected if missing:
    template (defaults to "article")

Files are rejected if:
    - Missing any required field
    - publish is false
"""

import configparser
import logging
import re
import shutil
import sys
from pathlib import Path

import frontmatter
import yaml

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
EXCLUDED_DIRS = {".obsidian", "_templates"}

_EXT_PAT = "|".join(re.escape(e.lstrip(".")) for e in IMAGE_EXTS)
EMBED_RE = re.compile(rf"!\[\[([^\]]+\.(?:{_EXT_PAT}))\]\]", re.IGNORECASE)


def load_config(config_path: str) -> tuple[Path, dict[str, str], dict[str, str]]:
    """Load vault path, mappings, and copies from config."""
    cfg = configparser.ConfigParser()
    if not cfg.read(config_path):
        raise FileNotFoundError(
            f"Config file '{config_path}' not found. "
            "Copy vault.cfg and set your vault path."
        )
    vault_path = Path(cfg["vault"]["path"]).expanduser().resolve()
    mappings = dict(cfg["mappings"])
    copies = dict(cfg["copies"]) if cfg.has_section("copies") else {}
    return vault_path, mappings, copies


def process_file(text: str) -> tuple[str | None, str]:
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
        return None, f"invalid frontmatter: {exc}"

    meta = {k.lower(): v for k, v in post.metadata.items()}

    required = {"title", "date", "slug", "publish"}
    missing = sorted(required - set(meta.keys()))
    if missing:
        return None, f"missing: {', '.join(missing)}"

    if str(meta.get("publish", "")).lower() in ("false", "no", "0"):
        return None, "publish: false"

    meta.setdefault("template", "article")
    post.metadata = meta
    post.content = EMBED_RE.sub(r"![\1](/static/images/vault/\1)", post.content)

    return frontmatter.dumps(post), ""


def sync_markdown(vault_path: Path, src_folder: str, dest: Path) -> None:
    """Sync article markdown files and resource files from vault to Pelican content."""
    src = vault_path / src_folder
    if not src.exists():
        logging.info(f"[skip]  {src} does not exist")
        return

    for md_file in sorted(src.rglob("*.md")):
        if EXCLUDED_DIRS.intersection(md_file.relative_to(src).parts):
            continue

        try:
            text = md_file.read_text(encoding="utf-8")
        except OSError as exc:
            logging.warning(f"[warn]  {md_file.name} — read error: {exc}")
            continue

        text, reason = process_file(text)
        if text is None:
            logging.info(f"[skip]  {md_file.name} — {reason}")
            continue

        dest_file = dest / md_file.relative_to(src)
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        dest_file.write_text(text, encoding="utf-8")
        logging.info(f"[sync]  {md_file.name} → {dest_file}")

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
        logging.info(f"[copy]  {res_file.name} → {dest_file}")


def copy(vault_path: Path, src_rel: str, dest: Path) -> None:
    """Copy a file or folder from vault to dest with no processing.

    For folders: recurses, skips excluded dirs, lowercases filenames.
    For files: copies directly to dest path.
    """
    src = vault_path / src_rel
    if not src.exists():
        logging.warning(f"[skip]  {src_rel} does not exist in vault")
        return

    if src.is_file():
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        logging.info(f"[copy]  {src.name} → {dest}")
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
        logging.info(f"[copy]  {src_file.name} → {dest_file}")


def copy_assets(vault_path: Path) -> None:
    """Copy all non-markdown files from anywhere in the vault.

    Images go to theme/static/images/vault/. Everything else goes to content/.
    Files are copied flat (no subdirectories preserved).
    """
    image_dest = Path("theme/static/images/vault")
    data_dest = Path("content")
    image_dest.mkdir(parents=True, exist_ok=True)
    data_dest.mkdir(parents=True, exist_ok=True)

    for asset in vault_path.rglob("*"):
        if not asset.is_file():
            continue
        if EXCLUDED_DIRS.intersection(asset.relative_to(vault_path).parts):
            continue
        if asset.suffix.lower() == ".md":
            continue
        if asset.suffix.lower() in IMAGE_EXTS:
            shutil.copy2(asset, image_dest / asset.name)
            logging.info(f"[image] {asset.name} → {image_dest}")
        else:
            shutil.copy2(asset, data_dest / asset.name)
            logging.info(f"[asset] {asset.name} → {data_dest}")


def main(config_path: str = "vault.cfg") -> None:
    """Run the sync: articles, raw copies, images."""
    vault_path, mappings, copies = load_config(config_path)
    for vault_folder, dest in mappings.items():
        sync_markdown(vault_path, vault_folder, Path(dest))
    for src_rel, dest in copies.items():
        copy(vault_path, src_rel, Path(dest))
    copy_assets(vault_path)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    main(sys.argv[1] if len(sys.argv) > 1 else "vault.cfg")

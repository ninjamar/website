#!/usr/bin/env python3
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

Required frontmatter fields:
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

# Build embed regex from IMAGE_EXTS to ensure consistency
_EXT_PAT = "|".join(re.escape(e.lstrip(".")) for e in IMAGE_EXTS)
EMBED_RE = re.compile(rf"!\[\[([^\]]+\.(?:{_EXT_PAT}))\]\]", re.IGNORECASE)


def load_config(config_path: str) -> tuple[Path, str, dict[str, str], dict[str, str]]:
    """Load vault path, attachment folder, mappings, and files from config file."""
    cfg = configparser.ConfigParser()
    if not cfg.read(config_path):
        raise FileNotFoundError(
            f"Config file '{config_path}' not found. "
            "Copy vault.cfg and set your vault path."
        )
    vault_path = Path(cfg["vault"]["path"]).expanduser().resolve()
    attachment_folder = cfg.get("vault", "attachment_folder", fallback="attachments")
    mappings = dict(cfg["mappings"])
    files = dict(cfg["files"]) if cfg.has_section("files") else {}
    return vault_path, attachment_folder, mappings, files


def process_file(text: str) -> tuple[str | None, str]:
    """
    Parse, validate, transform. Returns (output_text, "") on success,
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

    # Normalize keys to lowercase
    meta = {k.lower(): v for k, v in post.metadata.items()}

    # Check required fields
    required = {"title", "date", "slug", "publish"}
    missing = sorted(required - set(meta.keys()))
    if missing:
        return None, f"missing: {', '.join(missing)}"

    # Reject if publish is false
    if str(meta.get("publish", "")).lower() in ("false", "no", "0"):
        return None, "publish: false"

    # Inject template: article if missing
    meta.setdefault("template", "article")

    # Update metadata and transform content
    post.metadata = meta
    post.content = EMBED_RE.sub(r"![\1](/static/images/vault/\1)", post.content)

    return frontmatter.dumps(post), ""


def sync_markdown(vault_path: Path, src_folder: str, dest: Path) -> None:
    """Sync markdown files from vault source to Pelican destination."""
    src = vault_path / src_folder
    if not src.exists():
        logging.info(f"[skip]  {src} does not exist")
        return

    for md_file in sorted(src.rglob("*.md")):
        # Skip Obsidian internals and templates (check only vault-relative path)
        if EXCLUDED_DIRS.intersection(md_file.relative_to(src).parts):
            continue

        try:
            text = md_file.read_text(encoding="utf-8")
        except OSError as exc:
            logging.warning(f"[warn]  {md_file.name} — read error: {exc}")
            continue

        # Parse, validate, and transform
        text, reason = process_file(text)
        if text is None:
            logging.info(f"[skip]  {md_file.name} — {reason}")
            continue

        # Write to destination
        rel = md_file.relative_to(src)
        dest_file = dest / rel
        dest_file.parent.mkdir(parents=True, exist_ok=True)
        dest_file.write_text(text, encoding="utf-8")
        logging.info(f"[sync]  {md_file.name} → {dest_file}")


def copy_images(vault_path: Path, attachment_folder: str) -> None:
    """Copy images from vault attachment folder to theme static directory."""
    attach_dir = vault_path / attachment_folder
    dest_dir = Path("theme/static/images/vault")
    if not attach_dir.exists():
        return

    dest_dir.mkdir(parents=True, exist_ok=True)
    for img in attach_dir.rglob("*"):
        if img.suffix.lower() in IMAGE_EXTS:
            shutil.copy2(img, dest_dir / img.name)
            logging.info(f"[image] {img.name} → {dest_dir}")


def copy_files(vault_path: Path, files: dict[str, str]) -> None:
    """Copy raw files from vault root to content/ (no frontmatter processing)."""
    for src_rel, dest_rel in files.items():
        src = vault_path / src_rel
        dest = Path(dest_rel)
        if not src.exists():
            logging.warning(f"[skip]  {src_rel} does not exist in vault")
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        logging.info(f"[file]  {src_rel} → {dest_rel}")


def main(config_path: str = "vault.cfg") -> None:
    """Run the sync: load config, sync folders, copy raw files, copy images."""
    vault_path, attachment_folder, mappings, files = load_config(config_path)
    for vault_folder, dest in mappings.items():
        sync_markdown(vault_path, vault_folder, Path(dest))
    copy_files(vault_path, files)
    copy_images(vault_path, attachment_folder)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    main(sys.argv[1] if len(sys.argv) > 1 else "vault.cfg")

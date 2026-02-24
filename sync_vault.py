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

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
EXCLUDED_DIRS = {".obsidian", "_templates"}


class VaultSync:
    def __init__(self, config_path: str = "vault.cfg") -> None:
        cfg = configparser.ConfigParser()
        if not cfg.read(config_path):
            raise FileNotFoundError(
                f"Config file '{config_path}' not found. "
                "Copy vault.cfg and set your vault path."
            )
        self.vault_path = Path(cfg["vault"]["path"]).expanduser().resolve()
        self.attachment_folder = cfg.get(
            "vault", "attachment_folder", fallback="attachments"
        )
        self.mappings: dict[str, str] = dict(cfg["mappings"])

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def run(self) -> None:
        for vault_folder, dest in self.mappings.items():
            src = self.vault_path / vault_folder
            if not src.exists():
                print(f"[skip]  {src} does not exist")
                continue
            for md_file in sorted(src.rglob("*.md")):
                # Skip Obsidian internals and templates
                if EXCLUDED_DIRS.intersection(md_file.parts):
                    continue

                try:
                    text = md_file.read_text(encoding="utf-8")
                except OSError:
                    continue

                # Skip drafts
                if self._is_draft(text):
                    print(f"[draft] {md_file.name}")
                    continue

                text = self._apply_processors(text, md_file)
                rel = md_file.relative_to(src)
                dest_file = Path(dest) / rel
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                dest_file.write_text(text, encoding="utf-8")
                print(f"[sync]  {md_file.name} → {dest_file}")
        self._copy_images()

    # -------------------------------------------------------------------------
    # Processors — transform content before writing
    # -------------------------------------------------------------------------

    def _is_draft(self, text: str) -> bool:
        """Check if YAML frontmatter has draft: true."""
        if not text.startswith("---"):
            return False
        end = text.find("\n---", 3)
        if end == -1:
            return False
        try:
            meta = yaml.safe_load(text[3:end]) or {}
            return str(meta.get("draft", "")).lower() in ("true", "yes", "1")
        except yaml.YAMLError:
            return False

    def _apply_processors(self, text: str, path: Path) -> str:
        text = self._lowercase_frontmatter(text)
        text = self._fix_image_embeds(text)
        text = self._ensure_slug(text, path)
        return text

    def _lowercase_frontmatter(self, text: str) -> str:
        """Lowercase all YAML frontmatter keys for consistency."""
        if not text.startswith("---"):
            return text
        end = text.find("\n---", 3)
        if end == -1:
            return text
        yaml_block = text[3:end]
        # Replace each key: with key: (lowercased)
        lowercased = re.sub(
            r"^(\w+):",
            lambda m: m.group(1).lower() + ":",
            yaml_block,
            flags=re.MULTILINE,
        )
        return "---" + lowercased + text[end:]

    def _fix_image_embeds(self, text: str) -> str:
        """Convert Obsidian image embeds: ![[img.ext]] → ![img](/static/images/vault/img.ext)"""
        return re.sub(
            r"!\[\[([^\]]+\.(?:png|jpe?g|gif|webp|svg))\]\]",
            r"![\1](/static/images/vault/\1)",
            text,
            flags=re.IGNORECASE,
        )

    def _ensure_slug(self, text: str, path: Path) -> str:
        """Inject a slug into YAML frontmatter if one is not already present."""
        if not text.startswith("---"):
            return text
        end = text.find("\n---", 3)
        if end == -1:
            return text
        yaml_block = text[3:end]
        if "slug:" in yaml_block:
            return text
        # Sanitize slug: lowercase, replace spaces, strip non-URL-safe chars
        slug = path.stem.lower()
        slug = slug.replace(" ", "-")
        slug = re.sub(r"[^a-z0-9-]", "", slug)  # remove non-alphanumeric except hyphens
        slug = re.sub(r"-{2,}", "-", slug)  # collapse consecutive hyphens
        slug = slug.strip("-")  # strip leading/trailing hyphens
        new_yaml = yaml_block.rstrip() + f"\nslug: {slug}"
        return "---" + new_yaml + text[end:]

    # -------------------------------------------------------------------------
    # Image copy
    # -------------------------------------------------------------------------

    def _copy_images(self) -> None:
        attach_dir = self.vault_path / self.attachment_folder
        dest_dir = Path("theme/static/images/vault")
        if not attach_dir.exists():
            return
        dest_dir.mkdir(parents=True, exist_ok=True)
        for img in attach_dir.rglob("*"):
            if img.suffix.lower() in IMAGE_EXTS:
                shutil.copy2(img, dest_dir / img.name)
                print(f"[image] {img.name} → {dest_dir}")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    config = sys.argv[1] if len(sys.argv) > 1 else "vault.cfg"
    VaultSync(config).run()

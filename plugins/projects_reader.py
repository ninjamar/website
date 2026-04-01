"""Plugin to read projects from TOML file and inject as Jinja2 global."""

import os
import tomllib

from pelican import signals


def read_projects(projects_dir):
    """Read all projects from content/files/projects.toml"""
    path = os.path.join(projects_dir, "files", "projects.toml")
    if not os.path.exists(path):
        return []

    with open(path, "rb") as f:
        data = tomllib.load(f)
    return data.get("projects", [])


def inject_projects(generator):
    """Inject projects list into Jinja2 globals."""
    projects = read_projects(generator.path)
    generator.env.globals["projects"] = projects


def register():
    """Register the plugin with Pelican."""
    signals.generator_init.connect(inject_projects)

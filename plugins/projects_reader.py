"""Plugin to read projects from YAML file and inject as Jinja2 global."""

import os

import yaml
from pelican import signals


def read_projects(projects_dir):
    """Read all projects from content/projects.yml"""
    path = os.path.join(projects_dir, "projects.yml")
    if not os.path.exists(path):
        return []

    with open(path) as f:
        return yaml.safe_load(f) or []


def inject_projects(generator):
    """Inject projects list into Jinja2 globals."""
    projects = read_projects(generator.path)
    generator.env.globals["projects"] = projects


def register():
    """Register the plugin with Pelican."""
    signals.generator_init.connect(inject_projects)

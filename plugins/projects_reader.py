"""Plugin to read projects from markdown files and inject as Jinja2 global."""

import os

from pelican import signals


def read_projects(projects_dir):
    """Read all projects from content/projects.md"""
    projects = []

    if not os.path.exists(projects_dir):
        return projects

    path = os.path.join(projects_dir, "projects.md")
    if not os.path.exists(path):
        return projects

    with open(path) as f:
        lines = f.readlines()

    project = {}
    for line in lines:
        line = line.strip()

        if not line:
            continue

        if line == "---":
            projects.append(project)
            project = {}

            continue

        if ":" in line:
            key, value = line.split(":", 1)
            key = key.lower()
            project[key.strip()] = value.strip()

    # Append the last one
    if project:
        projects.append(project)
    return projects


def inject_projects(generator):
    """Inject projects list into Jinja2 globals."""
    projects = read_projects(generator.path)
    generator.env.globals["projects"] = projects


def register():
    """Register the plugin with Pelican."""
    signals.generator_init.connect(inject_projects)

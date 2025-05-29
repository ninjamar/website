# ZBUILD

# TODO: Fix this whole script
# The worst build script known to mankind

import os
import json
import re
import sys
import subprocess
from pathlib import Path
from staticjinja import Site
from latex2mathml.converter import convert as latex2mathml

OUTPUT_PREFIX = "./dist"
RSYNC_COMMAND = "rsync -av {0} {1} {2}"


# watchman-make -p 'static/**' --run '/opt/homebrew/bin/python3.11 build.py static'
# watchman-make -p 'templates/**' --run 'python3.11 build.py template'
# http-server dist
def unpack_submodules():
    # get all submodules
    modules = [
        x
        for x in subprocess.run(
            "grep path .gitmodules | sed 's/.*= //'", shell=True, stdout=subprocess.PIPE
        )
        .stdout.decode("utf-8")
        .split("\n")
        if x
    ]
    for path in modules:
        # for every submodule copy it into OUTPUT_PREFIX, excluding exclude key in json
        with open(path + "/.build") as f:
            data = json.load(f)
            os.system(
                RSYNC_COMMAND.format(
                    " ".join([f"--exclude='{e}'" for e in data["exclude"]]),
                    path,
                    OUTPUT_PREFIX + "/" + data["to"],
                )
            )


RE_DISPLAY = re.compile(r"\$\$(?P<body>.+?)\$\$", re.DOTALL)  # capture group body
RE_DISPLAY_BRACKETS = re.compile(r"\\\[(?P<body>.+?)\\\]", re.DOTALL)
RE_INLINE_PARENS = re.compile(r'\\\((?P<body>.+?)\\\)')
RE_INLINE = re.compile(r"(?<!\$)\$(?P<body>[^$\n]+?)\$(?!\$)")


def apply_mathml(file):
    with open(file, "r") as f:
        data = f.read()

    block_fn = lambda m: f"<div class=\"math-block\">{latex2mathml(m.group('body').strip())}</div>"
    # data = RE_DISPLAY.sub(block_fn, data)
    data = RE_DISPLAY_BRACKETS.sub(block_fn, data)
    
    # data = RE_INLINE.sub(lambda m: latex2mathml(m.group("body").strip()), data)
    data = RE_INLINE_PARENS.sub(lambda m: latex2mathml(m.group("body").strip()), data)

    with open(file, "w") as f:
        f.write(data)


def template():
    # Load the data directory into env
    data = {}
    # for file in os.listdir("data"):
    #     path = os.path.join("data", file)
    #     if os.path.isfile(path):
    #         with open(path) as f:
    #             data[Path(path).stem] = json.load(f)

    site = Site.make_site(
        searchpath="templates", outpath=OUTPUT_PREFIX, env_globals=data
    )

    site.render(use_reloader=False)

    for file in Path(OUTPUT_PREFIX).rglob("*.html"):
        apply_mathml(file)


def static():
    os.system(f"cp -r static {OUTPUT_PREFIX}")
    os.system(f"mv {OUTPUT_PREFIX}/static/favicon.ico {OUTPUT_PREFIX}")


if __name__ == "__main__":

    print("Executing build script")

    # create directory dist
    # assert submodules
    os.system(f"mkdir -p {OUTPUT_PREFIX}")

    if "template" in sys.argv:
        print("Templating")
        template()
    elif "static" in sys.argv:
        print("Copying static")
        static()

    elif "production" in sys.argv:
        print("Production")
        template()
        static()

        print("Updating submodules")
        os.system("git submodule update --init --recursive")
        os.system("git submodule update --remote --merge")
        print("Submodules updated")

        unpack_submodules()

    else:
        raise Exception("Invalid option")

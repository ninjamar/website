import os
import json
import sys
from staticjinja import Site
from pathlib import Path

#  watchman-make -p 'templates/**' --run 'python3 build.py templates'
#  watchman-make -p 'static/**' --run 'python3 build.py static'


def chunkify(arr, n):
    return [arr[i : i + n] for i in range(0, len(arr), n)]


def templates(is_dev=True):
    # Load the data directory into env
    data = {}
    for file in os.listdir("data"):
        path = os.path.join("data", file)
        if os.path.isfile(path):
            with open(path) as f:
                data[Path(path).stem] = json.load(f)

    # Post-process data
    # data["projects"] = chunkify(data["projects"], 2)

    site = Site.make_site(outpath="./dist", env_globals=data)
    site.render(use_reloader=is_dev)

def copy():
    os.system("cp -r static dist")
    os.system("mv dist/static/favicon.ico dist")

if __name__ == "__main__":
    print("Executing build script")

    # os.chdir("..")

    if "templates" in sys.argv:
        print("Templating")
        templates(True if "dev" in sys.argv else False)
    else:
        print("Copying static")
        copy()
import os
import json
import sys
from staticjinja import Site
from pathlib import Path


def chunkify(arr, n):
    return [arr[i : i + n] for i in range(0, len(arr), n)]


def main(is_dev=True):
    # Load the data directory into env
    data = {}
    for file in os.listdir("data"):
        path = os.path.join("data", file)
        if os.path.isfile(path):
            with open(path) as f:
                data[Path(path).stem] = json.load(f)

    # Post-process data
    data["projects"] = chunkify(data["projects"], 2)

    site = Site.make_site(outpath="./dist", env_globals=data)
    site.render(use_reloader=is_dev)


if __name__ == "__main__":
    main(True if "dev" in sys.argv else False)

import json
with open("./data/colors.json") as f:
    d = json.load(f)

print(list(d.keys()))
with open("./data/colors.json", "w") as f:
    json.dump(list(d.keys()), f)
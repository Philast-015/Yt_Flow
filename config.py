import json
import os

CONFIG_DIR = os.path.expanduser("~/.yt-flow")
CONFIG_PATH = os.path.join(CONFIG_DIR, "config.json")

DEFAULT = {
    "cache_dir": "~/.yt-flow/cache",
    "download_dir": "~/.yt-flow/downloads",
    "open": True,
    "port": 8000,
}


def load():
    os.makedirs(CONFIG_DIR, exist_ok=True)
    try:
        with open(CONFIG_PATH) as f:
            cfg = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        cfg = {}
    merged = {**DEFAULT, **cfg}
    for k in ("cache_dir", "download_dir"):
        merged[k] = os.path.expanduser(merged[k])
    return merged


def save(updates):
    os.makedirs(CONFIG_DIR, exist_ok=True)
    try:
        with open(CONFIG_PATH) as f:
            cfg = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        cfg = {}
    cfg.update(updates)
    with open(CONFIG_PATH, "w") as f:
        json.dump(cfg, f, indent=2)


def __getattr__(name):
    d = load()
    if name in d:
        return d[name]
    raise AttributeError(f"module 'config' has no attribute '{name}'")

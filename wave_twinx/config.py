import json
import os

DEFAULT_DIR = os.path.expanduser("~/.Wave")

DEFAULT = {
    "download_dir": "~/.Wave/downloads",
    "settings_dir": "~/.Wave/settings",
    "open": True,
    "port": 8000,
}

debug = False


def load():
    os.makedirs(DEFAULT_DIR, exist_ok=True)
    try:
        with open(os.path.join(DEFAULT_DIR, "settings", "config.json")) as f:
            cfg = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        cfg = {}
    merged = {**DEFAULT, **cfg}
    for k in ("download_dir", "settings_dir"):
        merged[k] = os.path.expanduser(merged[k])
    return merged


def __getattr__(name):
    d = load()
    if name in d:
        return d[name]
    raise AttributeError(f"module 'config' has no attribute '{name}'")

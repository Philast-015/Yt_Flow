import json
import os
import re
from flask import Flask, jsonify, request, send_from_directory, redirect, abort
from flask_cors import CORS
import yt_dlp
from wave_twinx.youtube import app as api_app
from wave_twinx import config


COMMON_TAGS = {
    "popular", "video", "youtube", "trending", "viral", "shorts",
    "subscribe", "like", "comment", "share", "funny", "music",
    "news", "live", "new", "watch", "short", "reels", "tik tok",
}


def extract_tags_from_video(channel, description):
    tags = {}
    if channel:
        ct = re.sub(r'[^a-z0-9]', '', channel.lower())
        if len(ct) > 4 and not ct.isdigit() and ct not in COMMON_TAGS:
            tags[ct] = tags.get(ct, 0) + 1
    if description:
        for m in re.finditer(r'#(\w+)', description):
            tag = m.group(1).lower()
            if len(tag) > 4 and not tag.isdigit() and tag not in COMMON_TAGS:
                tags[tag] = tags.get(tag, 0) + 1
    return tags

WEB_DIR = os.path.join(os.path.dirname(__file__), "Web")


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app, origins=["http://localhost:5500"])

    @app.route("/")
    def index():
        return send_from_directory(WEB_DIR, "index.html")

    @app.route("/v/<video_id>")
    def video_page(video_id):
        return send_from_directory(WEB_DIR, "index.html")

    @app.route("/<path:filename>")
    def static_files(filename):
        return send_from_directory(WEB_DIR, filename)

    @app.route("/api/download")
    def download():
        video_id = request.args.get("video_id")
        if not video_id:
            abort(400, description="Missing 'video_id'")
        url = f"https://www.youtube.com/watch?v={video_id}"
        DOWNLOAD_OPTS = {
            "quiet": True,
            "no_warnings": True,
            "format": "best[height<=1080]",
            "skip_download": True,
        }
        try:
            with yt_dlp.YoutubeDL(DOWNLOAD_OPTS) as ydl:
                info = ydl.extract_info(url, download=False)
                dl_url = info.get("url")
                if not dl_url:
                    abort(500, description="Could not extract download URL")
            return redirect(dl_url)
        except Exception as ex:
            abort(500, description=str(ex))

    UI_SETTINGS = os.path.join(config.settings_dir, "ui-settings.json")

    @app.route("/api/settings", methods=["POST"])
    def save_settings():
        data = request.get_json()
        os.makedirs(config.settings_dir, exist_ok=True)
        with open(UI_SETTINGS, "w") as f:
            json.dump(data, f, indent=2)
        return jsonify(data), 200

    @app.route("/api/settings", methods=["GET"])
    def load_settings():
        try:
            with open(UI_SETTINGS) as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = {}
        return jsonify(data), 200

    @app.route("/api/data/<name>", methods=["GET", "POST"])
    def user_data(name):
        filepath = os.path.join(config.settings_dir, f"{name}.json")
        if request.method == "POST":
            os.makedirs(config.settings_dir, exist_ok=True)
            data = request.get_json()
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
            return jsonify(data), 200
        try:
            with open(filepath) as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            data = [] if name in ("history", "bookmarks", "likes") else {}
        return jsonify(data), 200

    @app.route("/api/learn", methods=["POST"])
    def learn():
        data = request.get_json()
        channel = data.get("channel", "")
        description = data.get("description", "")

        recs_file = os.path.join(config.settings_dir, "recommendations.json")
        try:
            with open(recs_file) as f:
                recs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            recs = {"tags": {}}

        extracted = extract_tags_from_video(channel, description)
        for tag, count in extracted.items():
            recs["tags"][tag] = recs["tags"].get(tag, 0) + count

        os.makedirs(config.settings_dir, exist_ok=True)
        with open(recs_file, "w") as f:
            json.dump(recs, f, indent=2)

        return jsonify(recs), 200

    @app.route("/api/recommendations", methods=["GET"])
    def get_recommendations():
        recs_file = os.path.join(config.settings_dir, "recommendations.json")
        try:
            with open(recs_file) as f:
                recs = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            recs = {"tags": {}}
        return jsonify(recs), 200

    for rule in list(api_app.url_map.iter_rules()):
        if rule.rule.startswith("/api"):
            view_func = api_app.view_functions[rule.endpoint]
            app.add_url_rule(
                rule.rule,
                endpoint=rule.endpoint,
                view_func=view_func,
                methods=list(rule.methods - {"HEAD", "OPTIONS"}),
            )

    return app

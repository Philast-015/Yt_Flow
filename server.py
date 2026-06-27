import os
from flask import Flask, request, send_from_directory, redirect, abort
from flask_cors import CORS
import yt_dlp
from youtube import app as api_app
import config

WEB_DIR = os.path.join(os.path.dirname(__file__), "Web")


def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

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

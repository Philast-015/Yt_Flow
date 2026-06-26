from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp

app = FastAPI(title="Yt_Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SEARCH_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "extract_flat": "in_playlist",
    "skip_download": True,
}

INFO_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "format": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
    "skip_download": True,
}


def format_duration(seconds: int | None) -> str | None:
    if seconds is None:
        return None
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


@app.get("/api/search")
def search(q: str = Query(..., min_length=1)):
    try:
        with yt_dlp.YoutubeDL(SEARCH_OPTS) as ydl:
            result = ydl.extract_info(f"ytsearch10:{q}", download=False)
            if not result or "entries" not in result:
                return {"results": []}

            entries = []
            for e in result["entries"]:
                if not e.get("id"):
                    continue
                entries.append(
                    {
                        "id": e["id"],
                        "title": e.get("title"),
                        "channel": e.get("channel") or e.get("uploader"),
                        "views": e.get("view_count"),
                        "duration": format_duration(e.get("duration")),
                        "thumbnail": f"https://i.ytimg.com/vi/{e['id']}/mqdefault.jpg",
                    }
                )
            return {"results": entries}
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))


@app.get("/api/info")
def info(video_id: str = Query(..., min_length=1)):
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        with yt_dlp.YoutubeDL(INFO_OPTS) as ydl:
            info = ydl.extract_info(url, download=False)

        formats = info.get("requested_formats", [])
        video_url = ""
        audio_url = ""
        for f in formats:
            if f.get("vcodec") and f["vcodec"] != "none":
                video_url = f.get("url", "")
            elif f.get("acodec") and f["acodec"] != "none":
                audio_url = f.get("url", "")

        if not video_url or not audio_url:
            raise HTTPException(
                status_code=500,
                detail="Could not extract video/audio streams",
            )

        return {
            "title": info.get("title"),
            "description": info.get("description"),
            "views": info.get("view_count"),
            "channel": info.get("channel") or info.get("uploader"),
            "thumbnail": info.get(
                "thumbnail", f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
            ),
            "video_url": video_url,
            "audio_url": audio_url,
        }
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(status_code=500, detail=str(ex))

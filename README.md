# Yt_Flow

YouTube wrapper client with FastAPI backend and vanilla JS frontend.

## Structure

```
Yt_Flow/
├── Api/
│   └── main.py       # FastAPI server
├── Web/
│   ├── index.html    # Frontend structure
│   ├── style.css     # Dark theme styles
│   └── script.js     # Search + synced player
└── README.md
```

## Run

**Terminal 1 — API (port 8000):**
```bash
uvicorn Api.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd Web && python3 -m http.server 3000
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/search?q=QUERY` | `[{id, title, channel, views, duration, thumbnail}]` |
| `GET /api/info?video_id=ID` | `{title, description, views, channel, thumbnail, video_url, audio_url}` |

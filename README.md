# Wave

A terminal + web-based YouTube client with ad-free playback and extensive customization.

## Features

- **Ad-free playback** — uses `yt-dlp` to extract direct video/audio streams, served through a synced custom HTML5 player
- **Search & trending** — search YouTube, browse trending by country or tags (games, music, tech, education, etc.)
- **Custom video player** — play/pause, seek, volume, buffer indicator, fullscreen, miniplayer (PiP), keyboard shortcuts
- **Personal library** — bookmarks, likes, watch history, search history — all stored locally
- **UI customization** — dark/light theme, accent colors, card/grid styles, animations, and more
- **Recommendations** — tag-based and auto-learned from hashtags in videos you watch
- **Download** — download videos up to 1080p directly from the player
- **Responsive** — works on desktop and mobile

## Installation

```bash
pip install wave-twinx
```

Or from source:

```bash
git clone https://github.com/philast-015/Wave
cd Wave
pip install .
```

Requires Python 3.10+.

## Usage

```bash
wave
```

Opens the web UI at `http://localhost:8000`. Use a custom port:

```bash
wave 8080
```

## Tech Stack

**Backend:** Python + Flask, `yt-dlp` for YouTube data extraction
**Frontend:** Vanilla HTML, CSS, JavaScript (no framework)
**Storage:** Local JSON files in `~/.Wave/settings/`

## Configuration

Settings are managed through the UI sidebar. Persistent data lives in `~/.Wave/`:
- `settings/config.json` — server configuration
- `settings/ui-settings.json` — UI preferences
- `settings/*.json` — watch history, bookmarks, likes, search history

## License

MIT

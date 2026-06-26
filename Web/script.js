const API_BASE = "http://localhost:8000";

// DOM refs
const searchView = document.getElementById("searchView");
const playerView = document.getElementById("playerView");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const backBtn = document.getElementById("backBtn");
const videoPlayer = document.getElementById("videoPlayer");
const audioPlayer = document.getElementById("audioPlayer");
const playerTitle = document.getElementById("playerTitle");
const metaChannel = document.getElementById("metaChannel");
const metaViews = document.getElementById("metaViews");
const metaDescription = document.getElementById("metaDescription");

let isPlaying = false;

// --- Sync logic ---
function syncAudio() {
  if (!isPlaying) return;
  const diff = Math.abs(videoPlayer.currentTime - audioPlayer.currentTime);
  if (diff > 0.3) {
    audioPlayer.currentTime = videoPlayer.currentTime;
  }
}

function setupPlayer() {
  videoPlayer.addEventListener("play", () => {
    audioPlayer.play().catch(() => {});
    isPlaying = true;
  });

  videoPlayer.addEventListener("pause", () => {
    audioPlayer.pause();
    isPlaying = false;
  });

  videoPlayer.addEventListener("seeking", () => {
    audioPlayer.currentTime = videoPlayer.currentTime;
  });

  videoPlayer.addEventListener("timeupdate", syncAudio);

  videoPlayer.addEventListener("ended", () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
  });

  videoPlayer.addEventListener("waiting", () => {
    if (!audioPlayer.paused) audioPlayer.pause();
  });

  videoPlayer.addEventListener("playing", () => {
    if (audioPlayer.paused && videoPlayer.currentTime > 0) {
      audioPlayer.currentTime = videoPlayer.currentTime;
      audioPlayer.play().catch(() => {});
    }
  });
}

function loadPlayer(videoUrl, audioUrl, title, channel, views, description) {
  videoPlayer.src = videoUrl;
  audioPlayer.src = audioUrl;
  videoPlayer.muted = true;

  playerTitle.textContent = title;
  metaChannel.textContent = channel;
  metaViews.textContent = views != null ? `${views.toLocaleString()} views` : "";
  metaDescription.textContent = description || "";

  searchView.hidden = true;
  playerView.hidden = false;
}

// --- Search ---
async function doSearch(query) {
  resultsEl.innerHTML = '<div class="loading">Searching...</div>';
  try {
    const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Search failed");
    }
    const data = await res.json();
    renderResults(data.results);
  } catch (e) {
    resultsEl.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

function renderResults(results) {
  if (!results || results.length === 0) {
    resultsEl.innerHTML = '<div class="error">No results found.</div>';
    return;
  }
  resultsEl.innerHTML = "";
  for (const r of results) {
    const card = document.createElement("div");
    card.className = "card";
    card.addEventListener("click", () => openVideo(r.id));

    card.innerHTML = `
      <img src="${r.thumbnail}" alt="${escapeHtml(r.title || "")}" loading="lazy">
      <div class="card-body">
        <h3>${escapeHtml(r.title || "")}</h3>
        <div class="channel">${escapeHtml(r.channel || "")}</div>
        <div class="meta-row">
          <span>${r.views != null ? `${r.views.toLocaleString()} views` : ""}</span>
          <span>${r.duration || ""}</span>
        </div>
      </div>
    `;
    resultsEl.appendChild(card);
  }
}

// --- Video open ---
async function openVideo(videoId) {
  playerView.hidden = false;
  searchView.hidden = true;
  playerTitle.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/info?video_id=${encodeURIComponent(videoId)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to load video");
    }
    const data = await res.json();
    loadPlayer(
      data.video_url,
      data.audio_url,
      data.title,
      data.channel,
      data.views,
      data.description
    );
  } catch (e) {
    playerTitle.textContent = e.message;
  }
}

// --- Navigation ---
backBtn.addEventListener("click", () => {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  videoPlayer.load();
  audioPlayer.load();
  isPlaying = false;
  playerView.hidden = true;
  searchView.hidden = false;
  searchInput.focus();
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) doSearch(q);
});

// --- Helpers ---
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Init ---
setupPlayer();

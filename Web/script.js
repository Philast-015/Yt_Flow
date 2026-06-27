const API_BASE = "";

// DOM refs
const searchView = document.getElementById("searchView");
const playerView = document.getElementById("playerView");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsEl = document.getElementById("results");
const videoPlayer = document.getElementById("videoPlayer");
const audioPlayer = document.getElementById("audioPlayer");
const metaChannel = document.getElementById("metaChannel");
const metaViews = document.getElementById("metaViews");
const metaDescription = document.getElementById("metaDescription");

// Custom player refs
const playerControls = document.getElementById("playerControls");
const playBtn = document.getElementById("playBtn");
const bigPlayBtn = document.getElementById("bigPlayBtn");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const progressBar = document.getElementById("progressBar");
const progressPlayed = document.getElementById("progressPlayed");
const progressBuffer = document.getElementById("progressBuffer");
const progressThumb = document.getElementById("progressThumb");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const miniplayerBtn = document.getElementById("miniplayerBtn");
const playerTitle = document.getElementById("playerTitle");
const playerContainer = document.querySelector(".player-container");

let isPlaying = false;
let currentVideoId = null;
let controlsTimeout = null;

// --- Sync logic ---
function syncAudio() {
  if (!isPlaying) return;
  const diff = Math.abs(videoPlayer.currentTime - audioPlayer.currentTime);
  if (diff > 0.3) {
    audioPlayer.currentTime = videoPlayer.currentTime;
  }
}

function formatTime(s) {
  if (isNaN(s) || s === Infinity) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateProgress() {
  const pct = videoPlayer.duration ? (videoPlayer.currentTime / videoPlayer.duration) * 100 : 0;
  progressPlayed.style.width = `${pct}%`;
  progressThumb.style.left = `${pct}%`;
  currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
}

function updateBuffer() {
  if (videoPlayer.buffered.length > 0) {
    const end = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
    const pct = videoPlayer.duration ? (end / videoPlayer.duration) * 100 : 0;
    progressBuffer.style.width = `${pct}%`;
  }
}

function togglePlay() {
  if (videoPlayer.paused) {
    videoPlayer.play();
  } else {
    videoPlayer.pause();
  }
}

function updatePlayButton() {
  const icon = videoPlayer.paused ? "bi-play-fill" : "bi-pause-fill";
  playBtn.innerHTML = `<i class="bi ${icon}"></i>`;
  bigPlayBtn.innerHTML = `<i class="bi ${icon}"></i>`;
}

function showControls() {
  playerControls.classList.add("visible");
  clearTimeout(controlsTimeout);
  if (!videoPlayer.paused) {
    controlsTimeout = setTimeout(() => {
      playerControls.classList.remove("visible");
    }, 2000);
  }
}

function seekFromEvent(e) {
  const rect = progressBar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  videoPlayer.currentTime = pct * videoPlayer.duration;
  audioPlayer.currentTime = videoPlayer.currentTime;
  updateProgress();
}

function setupPlayer() {
  videoPlayer.addEventListener("play", () => {
    audioPlayer.play().catch(() => {});
    isPlaying = true;
    updatePlayButton();
    showControls();
  });

  videoPlayer.addEventListener("pause", () => {
    audioPlayer.pause();
    isPlaying = false;
    updatePlayButton();
    playerControls.classList.add("visible");
    clearTimeout(controlsTimeout);
  });

  videoPlayer.addEventListener("seeking", () => {
    audioPlayer.currentTime = videoPlayer.currentTime;
  });

  videoPlayer.addEventListener("timeupdate", () => {
    syncAudio();
    updateProgress();
  });

  videoPlayer.addEventListener("ended", () => {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
    updatePlayButton();
    playerControls.classList.add("visible");
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

  videoPlayer.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(videoPlayer.duration);
  });

  videoPlayer.addEventListener("progress", updateBuffer);

  // Custom controls
  playBtn.addEventListener("click", togglePlay);
  bigPlayBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
  videoPlayer.addEventListener("click", togglePlay);

  // Progress bar
  progressBar.addEventListener("click", seekFromEvent);

  let isDragging = false;
  progressThumb.addEventListener("mousedown", (e) => { isDragging = true; e.preventDefault(); });
  document.addEventListener("mousemove", (e) => { if (isDragging) seekFromEvent(e); });
  document.addEventListener("mouseup", () => { isDragging = false; });

  // Fullscreen
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenBtn.innerHTML = document.fullscreenElement
      ? '<i class="bi bi-fullscreen-exit"></i>'
      : '<i class="bi bi-fullscreen"></i>';
  });

  // Miniplayer
  miniplayerBtn.addEventListener("click", () => {
    document.body.classList.toggle("miniplayer");
  });

  // Controls visibility
  playerContainer.addEventListener("mousemove", showControls);
  playerControls.addEventListener("mouseenter", () => {
    clearTimeout(controlsTimeout);
    playerControls.classList.add("visible");
  });
  playerControls.addEventListener("mouseleave", showControls);

  // Volume
  muteBtn.addEventListener("click", () => {
    videoPlayer.muted = !videoPlayer.muted;
    audioPlayer.muted = videoPlayer.muted;
    muteBtn.innerHTML = videoPlayer.muted
      ? '<i class="bi bi-volume-mute-fill"></i>'
      : '<i class="bi bi-volume-up-fill"></i>';
    volumeSlider.value = videoPlayer.muted ? 0 : videoPlayer.volume;
  });

  volumeSlider.addEventListener("input", () => {
    videoPlayer.volume = parseFloat(volumeSlider.value);
    audioPlayer.volume = videoPlayer.volume;
    videoPlayer.muted = false;
    audioPlayer.muted = false;
    muteBtn.innerHTML = volumeSlider.value == 0
      ? '<i class="bi bi-volume-mute-fill"></i>'
      : '<i class="bi bi-volume-up-fill"></i>';
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (playerView.hidden) return;
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "f":
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); fullscreenBtn.click(); }
        break;
      case "ArrowLeft":
        e.preventDefault();
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
        audioPlayer.currentTime = videoPlayer.currentTime;
        updateProgress();
        showControls();
        break;
      case "ArrowRight":
        e.preventDefault();
        videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
        audioPlayer.currentTime = videoPlayer.currentTime;
        updateProgress();
        showControls();
        break;
    }
  });
}

function loadPlayer(videoUrl, audioUrl, title, channel, views, description) {
  videoPlayer.src = videoUrl;
  audioPlayer.src = audioUrl;
  videoPlayer.muted = true;
  audioPlayer.muted = false;

  playerTitle.textContent = title || "";
  metaChannel.textContent = channel;
  metaViews.textContent = views != null ? `${views.toLocaleString()} views` : "";
  metaDescription.textContent = description || "";

  playerView.hidden = false;
  playerControls.classList.add("visible");
  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(() => {
    playerControls.classList.remove("visible");
  }, 2000);

  durationEl.textContent = "0:00";
  currentTimeEl.textContent = "0:00";
  progressPlayed.style.width = "0%";
  progressThumb.style.left = "0%";
  progressBuffer.style.width = "0%";
  updatePlayButton();
}

// --- Search ---
async function doSearch(query) {
  resultsEl.innerHTML = '<div class="loading"></div>';
  history.pushState({ view: "search", query }, "", `/?q=${encodeURIComponent(query)}`);
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
  currentVideoId = videoId;
  playerView.hidden = false;
  document.body.classList.remove("miniplayer");

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
    console.error(e);
  }
}
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) doSearch(q);
});

// --- URL routing on load ---
function handleRoute() {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  const vMatch = path.match(/^\/v\/(.+)/);
  if (vMatch) {
    openVideo(vMatch[1]);
  } else if (q) {
    searchInput.value = q;
    doSearch(q);
  }
}

window.addEventListener("popstate", () => {
  location.reload();
});

// --- Settings menu ---
const settingsBtn = document.getElementById("settings");
const settingsMenu = document.getElementById("settingsMenu");

const RADIUS_MAP = { none: "0", small: "4px", medium: "10px", full: "999px" };
const ACCENT_MAP = {
  red:    { base: "#ff0033", hover: "#cc0029" },
  blue:   { base: "#0066ff", hover: "#0052cc" },
  green:  { base: "#00aa44", hover: "#008836" },
  purple: { base: "#8833ff", hover: "#6b29cc" },
  orange: { base: "#ff6600", hover: "#cc5200" },
};
const GRID_MIN = { auto: "280px", 2: "500px", 3: "320px", 4: "240px" };

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("ytflow_settings")) || {};
  } catch {
    return {};
  }
}

function saveSettings(s) {
  localStorage.setItem("ytflow_settings", JSON.stringify(s));
}

function applySettings() {
  const s = loadSettings();
  const theme = s.theme || "dark";
  const sRad = s.searchRadius || "medium";
  const cRad = s.cardRadius || "small";
  const accent = s.accent || "red";
  const grid = s.gridCols || "auto";
  const anim = s.animations || "on";

  document.body.classList.toggle("light", theme === "light");

  const inp = searchInput;
  const btn = searchForm.querySelector("button");
  const sr = RADIUS_MAP[sRad] || "10px";
  inp.style.borderRadius = `${sr} 0 0 ${sr}`;
  btn.style.borderRadius = `0 ${sr} ${sr} 0`;

  document.documentElement.style.setProperty("--card-radius", RADIUS_MAP[cRad] || "12px");

  const ac = ACCENT_MAP[accent] || ACCENT_MAP.red;
  document.documentElement.style.setProperty("--accent", ac.base);
  document.documentElement.style.setProperty("--accent-hover", ac.hover);

  document.documentElement.style.setProperty("--grid-min", GRID_MIN[grid] || "280px");

  document.body.classList.toggle("anim-off", anim !== "on");

  // Update active buttons
  document.querySelectorAll(".menu-group").forEach(g => {
    const setting = g.dataset.setting;
    const val = s[setting] || g.querySelector(".active")?.dataset.value;
    g.querySelectorAll("button").forEach(b => {
      b.classList.toggle("active", b.dataset.value === val);
    });
  });
}

settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsMenu.hidden = !settingsMenu.hidden;
});

document.addEventListener("click", (e) => {
  if (!settingsMenu.hidden && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
    settingsMenu.hidden = true;
  }
});

document.querySelectorAll(".menu-group").forEach(group => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const setting = group.dataset.setting;
    const s = loadSettings();
    s[setting] = btn.dataset.value;
    saveSettings(s);
    applySettings();
  });
});

// --- Helpers ---
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// --- Miniplayer ---
document.addEventListener("keydown", (e) => {
  if (e.key === "i" && !e.ctrlKey && !e.metaKey && !e.target.matches("input, textarea, [contenteditable]")) {
    e.preventDefault();
    document.body.classList.toggle("miniplayer");
  }
});

// --- Init ---
setupPlayer();
handleRoute();
applySettings();

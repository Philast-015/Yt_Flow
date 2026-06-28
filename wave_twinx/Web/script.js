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
const metaTitle = document.getElementById("metaTitle");
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

  playBtn.addEventListener("click", togglePlay);
  bigPlayBtn.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
  videoPlayer.addEventListener("click", togglePlay);

  progressBar.addEventListener("click", seekFromEvent);

  let isDragging = false;
  progressThumb.addEventListener("mousedown", (e) => { isDragging = true; e.preventDefault(); });
  document.addEventListener("mousemove", (e) => { if (isDragging) seekFromEvent(e); });
  document.addEventListener("mouseup", () => { isDragging = false; });

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

  miniplayerBtn.addEventListener("click", () => {
    document.body.classList.toggle("miniplayer");
  });

  playerContainer.addEventListener("mousemove", showControls);
  playerControls.addEventListener("mouseenter", () => {
    clearTimeout(controlsTimeout);
    playerControls.classList.add("visible");
  });
  playerControls.addEventListener("mouseleave", showControls);

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

function formatViews(views) {
  if (views >= 1_000_000_000) {
    return (views / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (views >= 1_000_000) {
    return (views / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (views >= 1_000) {
    return (views / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return views.toString();
}

let currentVideoInfo = null;

function loadPlayer(videoUrl, audioUrl, title, channel, views, description) {
  videoPlayer.src = videoUrl;
  audioPlayer.src = audioUrl;
  videoPlayer.muted = true;
  audioPlayer.muted = false;

  playerTitle.textContent = title || "Error fetching";
  metaTitle.innerText = title || "Error fetching";
  metaChannel.textContent = channel;
  metaDescription.textContent = description || "Error fetching";

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

// --- Sidebar ---
const collapsedSidebar = document.getElementById("collapsed-sidebar");
const sidebar = document.getElementById("sidebar");
const sidebarIcons = document.querySelectorAll(".sidebar-icon");
const historyList = document.getElementById("historyList");
const bookmarksList = document.getElementById("bookmarksList");
const likesList = document.getElementById("likesList");
const searchHistoryDropdown = document.getElementById("searchHistoryDropdown");
const searchHistoryList = document.getElementById("searchHistoryList");
const resetDataBtn = document.getElementById("resetDataBtn");

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarIcons.forEach(icon => icon.classList.remove("active"));
}

sidebarIcons.forEach(icon => {
  icon.addEventListener("click", () => {
    const tab = icon.dataset.tab;

    if (tab === "home") {
      closeSidebar();
      icon.classList.add("active");
      if (!playerView.hidden) {
        playerView.hidden = true;
        videoPlayer.pause();
        audioPlayer.pause();
      }
      history.pushState({ view: "home" }, "", "/");
      loadTrending();
      return;
    }

    if (tab === "trending") {
      closeSidebar();
      icon.classList.add("active");
      if (!playerView.hidden) {
        playerView.hidden = true;
        videoPlayer.pause();
        audioPlayer.pause();
      }
      resultsEl.innerHTML = '<div class="loading"></div>';
      const s = loadSettings();
      let url = `${API_BASE}/api/trending`;
      if (s.countryMode === "on" && s.country) {
        url += `?country=${encodeURIComponent(s.country)}`;
      }
      fetch(url)
        .then(r => r.json())
        .then(d => renderResults(d.results))
        .catch(() => { resultsEl.innerHTML = '<div class="error">Failed to load trending</div>'; });
      return;
    }

    const isOpen = sidebar.classList.contains("open");
    const activePanel = document.querySelector(".tab-panel.active");
    const isSameTab = activePanel && activePanel.id === `tab-${tab}`;

    if (isOpen && isSameTab) {
      closeSidebar();
    } else {
      sidebarIcons.forEach(b => b.classList.remove("active"));
      icon.classList.add("active");
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      const panel = document.getElementById(`tab-${tab}`);
      if (panel) panel.classList.add("active");
      sidebar.classList.add("open");
      if (tab === "history") renderHistory();
      if (tab === "bookmarks") renderBookmarks();
      if (tab === "likes") renderLikes();
    }
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sidebar.classList.contains("open")) closeSidebar();
});

document.addEventListener("click", (e) => {
  if (sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      !collapsedSidebar.contains(e.target)) {
    closeSidebar();
  }
});

// --- Data API ---
async function fetchData(name) {
  try {
    const res = await fetch(`${API_BASE}/api/data/${name}`);
    if (!res.ok) return name === "history" ? [] : [];
    return await res.json();
  } catch {
    return name === "history" ? [] : [];
  }
}

async function saveData(name, data) {
  try {
    await fetch(`${API_BASE}/api/data/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {}
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
    addToHistory(query);
  } catch (e) {
    resultsEl.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function addToHistory(query) {
  const history = await fetchData("history");
  const idx = history.indexOf(query);
  if (idx > -1) history.splice(idx, 1);
  history.unshift(query);
  if (history.length > 15) history.pop();
  await saveData("history", history);
}

async function addToWatchHistory(id, title, channel, thumbnail) {
  const wh = await fetchData("watch-history") || [];
  const idx = wh.findIndex(v => v.id === id);
  if (idx > -1) wh.splice(idx, 1);
  wh.unshift({ id, title, channel, thumbnail });
  await saveData("watch-history", wh);
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

// --- Player actions ---
const likeBtn = document.getElementById("likeBtn");
const bookmarkBtn = document.getElementById("bookmarkBtn");
const downloadBtn = document.getElementById("downloadBtn");
const openYtBtn = document.getElementById("openYtBtn");

async function updatePlayerActions(videoId, title, channel, thumbnail) {
  currentVideoInfo = { id: videoId, title, channel, thumbnail };

  const likes = await fetchData("likes") || [];
  const isLiked = likes.some(v => v.id === videoId);
  likeBtn.classList.toggle("active", isLiked);
  likeBtn.querySelector("i").className = isLiked ? "bi bi-heart-fill" : "bi bi-heart";

  const bookmarks = await fetchData("bookmarks") || [];
  const isSaved = bookmarks.some(v => v.id === videoId);
  bookmarkBtn.classList.toggle("active", isSaved);
  bookmarkBtn.querySelector("i").className = isSaved ? "bi bi-bookmark-fill" : "bi bi-bookmark";

  downloadBtn.onclick = () => {
    window.open(`${API_BASE}/api/download?video_id=${videoId}`, "_blank");
  };

  openYtBtn.onclick = () => {
    window.open(`https://youtube.com/watch?v=${videoId}`, "_blank");
  };
}

likeBtn.addEventListener("click", async () => {
  if (!currentVideoInfo) return;
  const { id, title, channel, thumbnail } = currentVideoInfo;
  let likes = await fetchData("likes") || [];
  const idx = likes.findIndex(v => v.id === id);
  if (idx > -1) {
    likes.splice(idx, 1);
  } else {
    likes.unshift({ id, title, channel, thumbnail });
  }
  await saveData("likes", likes);
  await updatePlayerActions(id, title, channel, thumbnail);
});

bookmarkBtn.addEventListener("click", async () => {
  if (!currentVideoInfo) return;
  const { id, title, channel, thumbnail } = currentVideoInfo;
  let bookmarks = await fetchData("bookmarks") || [];
  const idx = bookmarks.findIndex(v => v.id === id);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
  } else {
    bookmarks.unshift({ id, title, channel, thumbnail });
  }
  await saveData("bookmarks", bookmarks);
  await updatePlayerActions(id, title, channel, thumbnail);
});

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
    updatePlayerActions(
      videoId,
      data.title || "Unknown",
      data.channel || "Unknown",
      `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    );
    addToWatchHistory(videoId, data.title || "Unknown", data.channel || "Unknown", `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`);
    learnFromVideo(data.channel || "", data.description || "");
  } catch (e) {
    console.error(e);
  }
}

async function learnFromVideo(channel, description) {
  try {
    await fetch(`${API_BASE}/api/learn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, description }),
    });
  } catch {}
}
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (q) doSearch(q);
});

async function loadTrending() {
  const s = loadSettings();
  if (s.recommendations === "off") {
    resultsEl.innerHTML = '<div class="error">Recommendations are disabled. Enable them in Settings to see videos.</div>';
    return;
  }
  resultsEl.innerHTML = '<div class="loading"></div>';
  try {
    const tags = s.tags || [];
    let url;
    if (tags.length > 0) {
      const tagStr = tags.map(t => `#${t}`).join(" ");
      url = `${API_BASE}/api/search?q=${encodeURIComponent(tagStr)}`;
    } else {
      url = `${API_BASE}/api/trending`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load recommendations");
    const data = await res.json();
    renderResults(data.results);
  } catch (e) {
    resultsEl.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

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
    sidebarIcons.forEach(icon => icon.classList.remove("active"));
    doSearch(q);
  } else {
    sidebarIcons.forEach(icon => icon.classList.remove("active"));
    const homeIcon = document.querySelector('.sidebar-icon[data-tab="home"]');
    if (homeIcon) homeIcon.classList.add("active");
    loadTrending();
  }
}

window.addEventListener("popstate", () => {
  location.reload();
});

// --- Settings ---
const RADIUS_MAP = { none: "0", small: "4px", medium: "10px", full: "999px" };
const ACCENT_MAP = {
  red:    { base: "#ff0033", hover: "#cc0029" },
  blue:   { base: "#0066ff", hover: "#0052cc" },
  green:  { base: "#00aa44", hover: "#008836" },
  purple: { base: "#8833ff", hover: "#6b29cc" },
  orange: { base: "#ff6600", hover: "#cc5200" },
  yellow: { base: "#d1a100", hover: "#CF9F00" },
  neon: { base: "#7dd100", hover: "#72BF00" },
};
const GRID_MIN = { auto: "280px", 2: "500px", 3: "320px", 4: "240px" };

const PREDEFINED_TAGS = ["games", "movies", "music", "sports", "tech", "news", "education", "comedy"];

function setCookie(name, value, hours) {
  const d = new Date();
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const c of cookies) {
    const [key, ...rest] = c.split("=");
    if (decodeURIComponent(key) === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function loadSettings() {
  const raw = getCookie("settings");
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return { tags: ["games", "music"], recommendations: "on", countryMode: "off", country: "" };
    }
  }
  return { tags: ["games", "music"], recommendations: "on", countryMode: "off", country: "" };
}

function saveSettings(s) {
  const json = JSON.stringify(s);
  setCookie("settings", json, 2);
  fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
  }).catch(() => {});
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

  const cm = s.countryMode || "off";
  const ci = document.getElementById("countryInput");
  if (ci) {
    ci.value = s.country || "";
    ci.disabled = cm !== "on";
    ci.style.opacity = cm === "on" ? "1" : "0.4";
  }

  // Update active buttons
  document.querySelectorAll(".menu-group").forEach(g => {
    const setting = g.dataset.setting;
    if (setting === "tags") {
      const tags = s.tags || ["games", "music"];
      g.querySelectorAll("button").forEach(b => {
        b.classList.toggle("active", tags.includes(b.dataset.value));
      });
    } else {
      const val = s[setting] || g.querySelector(".active")?.dataset.value;
      g.querySelectorAll("button").forEach(b => {
        b.classList.toggle("active", b.dataset.value === val);
      });
    }
  });
}

document.querySelectorAll(".menu-group").forEach(group => {
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const setting = group.dataset.setting;
    const s = loadSettings();

    if (setting === "tags") {
      const tags = s.tags || [];
      const val = btn.dataset.value;
      const idx = tags.indexOf(val);
      if (idx > -1) {
        tags.splice(idx, 1);
      } else {
        tags.push(val);
      }
      s.tags = tags;
    } else {
      s[setting] = btn.dataset.value;
    }

    if (setting === "countryMode" && btn.dataset.value === "on" && !s.country) {
      detectCountry();
    }

    saveSettings(s);
    applySettings();
  });
});

// --- Custom tags ---
const customTagInput = document.getElementById("customTagInput");
const addCustomTagBtn = document.getElementById("addCustomTag");
const tagsGroup = document.getElementById("tagsGroup");

function addCustomTagToUI(val) {
  const existing = tagsGroup.querySelector(`[data-value="${CSS.escape(val)}"]`);
  if (existing) return;
  const btn = document.createElement("button");
  btn.dataset.value = val;
  btn.textContent = `#${val}`;
  tagsGroup.appendChild(btn);
}

function handleAddCustomTag() {
  const val = customTagInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!val) return;
  const s = loadSettings();
  const tags = s.tags || [];
  if (!tags.includes(val)) {
    tags.push(val);
    s.tags = tags;
    saveSettings(s);
    applySettings();
  }
  addCustomTagToUI(val);
  customTagInput.value = "";
}

addCustomTagBtn.addEventListener("click", handleAddCustomTag);
customTagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAddCustomTag();
});

// --- Country ---
const countryInput = document.getElementById("countryInput");

async function detectCountry() {
  try {
    const res = await fetch(`${API_BASE}/api/country`);
    const data = await res.json();
    if (data.country) {
      const s = loadSettings();
      s.country = data.country;
      countryInput.value = data.country;
      saveSettings(s);
    }
  } catch {}
}

countryInput.addEventListener("input", () => {
  const val = countryInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  countryInput.value = val;
  const s = loadSettings();
  s.country = val;
  saveSettings(s);
});

// --- Watch History ---
async function renderHistory() {
  const wh = await fetchData("watch-history") || [];
  if (wh.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No watch history</div>';
    return;
  }
  historyList.innerHTML = wh.map(v => `
    <div class="saved-item" data-id="${v.id}">
      <img src="${v.thumbnail}" alt="" loading="lazy">
      <div class="saved-info">
        <h4>${escapeHtml(v.title || "")}</h4>
        <span>${escapeHtml(v.channel || "")}</span>
      </div>
      <button class="saved-remove" data-id="${v.id}"><i class="bi bi-trash"></i></button>
    </div>
  `).join("");
  historyList.querySelectorAll(".saved-item").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".saved-remove")) return;
      openVideo(el.dataset.id);
      closeSidebar();
    });
  });
  historyList.querySelectorAll(".saved-remove").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      let wh = await fetchData("watch-history") || [];
      wh = wh.filter(v => v.id !== id);
      await saveData("watch-history", wh);
      renderHistory();
    });
  });
}

// --- Search history dropdown ---
let searchHistoryHideTimeout = null;

async function renderSearchHistory() {
  const history = await fetchData("history") || [];
  if (history.length === 0) {
    searchHistoryList.innerHTML = '<div class="dropdown-empty">No recent searches</div>';
    return;
  }
  searchHistoryList.innerHTML = history.map(q => `
    <div class="dropdown-item" data-q="${escapeHtml(q)}">
      <i class="bi bi-clock-history"></i>
      <span>${escapeHtml(q)}</span>
    </div>
  `).join("");
  searchHistoryList.querySelectorAll(".dropdown-item").forEach(el => {
    el.addEventListener("click", () => {
      const q = el.dataset.q;
      searchInput.value = q;
      doSearch(q);
      searchHistoryDropdown.hidden = true;
    });
  });
}

searchInput.addEventListener("focus", () => {
  clearTimeout(searchHistoryHideTimeout);
  renderSearchHistory();
  searchHistoryDropdown.hidden = false;
});

searchInput.addEventListener("blur", () => {
  searchHistoryHideTimeout = setTimeout(() => {
    searchHistoryDropdown.hidden = true;
  }, 200);
});

searchInput.addEventListener("input", () => {
  searchHistoryDropdown.hidden = true;
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#searchForm")) {
    searchHistoryDropdown.hidden = true;
  }
});

// --- Reset ---
async function resetAllData() {
  if (!confirm("Reset all data? This will clear watch history, search history, bookmarks, likes, and settings.")) return;
  const defaults = { tags: ["games", "music"], recommendations: "on", countryMode: "off", country: "" };
  await Promise.all([
    saveData("watch-history", []),
    saveData("history", []),
    saveData("bookmarks", []),
    saveData("likes", []),
    fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(defaults),
    }).catch(() => {}),
  ]);
  setCookie("settings", "", 0);
  document.cookie = "settings=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  if (currentVideoInfo) {
    await updatePlayerActions(currentVideoInfo.id, currentVideoInfo.title, currentVideoInfo.channel, currentVideoInfo.thumbnail);
  }
  if (sidebar.classList.contains("open")) {
    const activePanel = document.querySelector(".tab-panel.active");
    if (activePanel) {
      const tabId = activePanel.id.replace("tab-", "");
      if (tabId === "history") renderHistory();
      if (tabId === "bookmarks") renderBookmarks();
      if (tabId === "likes") renderLikes();
    }
  }
  applySettings();
}

resetDataBtn.addEventListener("click", resetAllData);

// --- Bookmarks ---
async function renderBookmarks() {
  const bookmarks = await fetchData("bookmarks") || [];
  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = '<div class="history-empty">No saved videos</div>';
    return;
  }
  bookmarksList.innerHTML = bookmarks.map(v => `
    <div class="saved-item" data-id="${v.id}">
      <img src="${v.thumbnail}" alt="" loading="lazy">
      <div class="saved-info">
        <h4>${escapeHtml(v.title || "")}</h4>
        <span>${escapeHtml(v.channel || "")}</span>
      </div>
      <button class="saved-remove" data-id="${v.id}"><i class="bi bi-trash"></i></button>
    </div>
  `).join("");
  bookmarksList.querySelectorAll(".saved-item").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".saved-remove")) return;
      openVideo(el.dataset.id);
      closeSidebar();
    });
  });
  bookmarksList.querySelectorAll(".saved-remove").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      let bookmarks = await fetchData("bookmarks") || [];
      bookmarks = bookmarks.filter(v => v.id !== id);
      await saveData("bookmarks", bookmarks);
      renderBookmarks();
      if (currentVideoInfo && currentVideoInfo.id === id) {
        await updatePlayerActions(currentVideoInfo.id, currentVideoInfo.title, currentVideoInfo.channel, currentVideoInfo.thumbnail);
      }
    });
  });
}

// --- Likes ---
async function renderLikes() {
  const likes = await fetchData("likes") || [];
  if (likes.length === 0) {
    likesList.innerHTML = '<div class="history-empty">No liked videos</div>';
    return;
  }
  likesList.innerHTML = likes.map(v => `
    <div class="saved-item" data-id="${v.id}">
      <img src="${v.thumbnail}" alt="" loading="lazy">
      <div class="saved-info">
        <h4>${escapeHtml(v.title || "")}</h4>
        <span>${escapeHtml(v.channel || "")}</span>
      </div>
      <button class="saved-remove" data-id="${v.id}"><i class="bi bi-trash"></i></button>
    </div>
  `).join("");
  likesList.querySelectorAll(".saved-item").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".saved-remove")) return;
      openVideo(el.dataset.id);
      closeSidebar();
    });
  });
  likesList.querySelectorAll(".saved-remove").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      let likes = await fetchData("likes") || [];
      likes = likes.filter(v => v.id !== id);
      await saveData("likes", likes);
      renderLikes();
      if (currentVideoInfo && currentVideoInfo.id === id) {
        await updatePlayerActions(currentVideoInfo.id, currentVideoInfo.title, currentVideoInfo.channel, currentVideoInfo.thumbnail);
      }
    });
  });
}

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

async function initSettings() {
  const raw = getCookie("settings");
  if (!raw) {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      const s = await res.json();
      if (!s.tags) s.tags = ["games", "music"];
      if (!s.recommendations) s.recommendations = "on";
      if (!s.countryMode) s.countryMode = "off";
      if (!s.country) s.country = "";
      if (Object.keys(s).length > 0) {
        setCookie("settings", JSON.stringify(s), 2);
        applySettings();
      }
    } catch {
      // Backend unavailable, use defaults
    }
  }
}

// --- Init ---
setupPlayer();
handleRoute();
applySettings();
initSettings();
if (loadSettings().countryMode === "on" && !loadSettings().country) detectCountry();

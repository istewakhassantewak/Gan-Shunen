import { initializeAppState, saveAppState } from "./storage.js";
import { signup, login, logout, getCurrentUser } from "./auth.js";
import {
  getActivePlaylist,
  ensureActivePlaylist,
  setActivePlaylist,
  createPlaylist,
  deletePlaylist,
  deleteSongFromPlaylist,
  findSongById,
  getPlayableSongs
} from "./playlist.js";
import { filterSongs } from "./search.js";
import { AudioPlayer } from "./player.js";
import { renderPlaylists, renderSongs, setAuthButtons, setFeedback, setPlaybackUI, setVolumeIcon } from "./ui.js";

let state;
try {
  state = await initializeAppState();
} catch {
  state = {
    playlists: [],
    activePlaylistId: null,
    searchQuery: "",
    player: {
      currentSongId: null,
      shuffle: false,
      repeat: "off",
      volume: 0.8
    }
  };
}
ensureActivePlaylist(state);
const session = { user: getCurrentUser() };

const elements = {
  feedback: document.getElementById("player-feedback"),
  cardContainer: document.querySelector(".cardcontainer"),
  songList: document.querySelector(".songlist ul"),
  homeBtn: document.getElementById("home-btn"),
  focusSearchBtn: document.getElementById("focus-search-btn"),
  searchInput: document.getElementById("search-input"),
  searchBtn: document.getElementById("search-btn"),
  addMusicBtn: document.getElementById("add-music-btn"),
  addPlaylistBtn: document.getElementById("add-playlist-btn"),
  signupBtn: document.querySelector(".signupbtn"),
  loginBtn: document.querySelector(".loginbtn"),
  playBtn: document.getElementById("play"),
  previousBtn: document.getElementById("previous"),
  nextBtn: document.getElementById("next"),
  seekbar: document.querySelector(".seekbar"),
  circle: document.querySelector(".circle"),
  songInfo: document.querySelector(".songinfo"),
  songTime: document.querySelector(".songtime"),
  volumeSlider: document.getElementById("volume-control"),
  volumeIcon: document.querySelector(".volume img"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  repeatBtn: document.getElementById("repeat-btn"),
  appShell: document.getElementById("app-shell"),
  authGate: document.getElementById("auth-gate"),
  authForm: document.getElementById("auth-form"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authName: document.getElementById("auth-name"),
  authNameLabel: document.getElementById("auth-name-label"),
  authError: document.getElementById("auth-error"),
  authSubmit: document.getElementById("auth-submit"),
  authSwitch: document.getElementById("auth-switch"),
  playlistModal: document.getElementById("playlist-modal"),
  playlistForm: document.getElementById("playlist-form"),
  playlistName: document.getElementById("playlist-name"),
  playlistDescription: document.getElementById("playlist-description"),
  playlistCover: document.getElementById("playlist-cover"),
  playlistCoverPreview: document.getElementById("playlist-cover-preview"),
  playlistError: document.getElementById("playlist-error"),
  playlistCancel: document.getElementById("playlist-cancel"),
  musicModal: document.getElementById("music-modal"),
  musicForm: document.getElementById("music-form"),
  musicTitle: document.getElementById("music-title"),
  musicArtist: document.getElementById("music-artist"),
  musicFile: document.getElementById("music-file"),
  musicError: document.getElementById("music-error"),
  musicCancel: document.getElementById("music-cancel")
};

const player = new AudioPlayer(elements);
let authMode = "login";
let currentSearchResults = [];
let eventsWired = false;

function canInitialize() {
  return Boolean(
    elements.appShell &&
    elements.authGate &&
    elements.cardContainer &&
    elements.songList &&
    elements.playlistForm &&
    elements.authForm
  );
}

function ensureAddPlaylistButton() {
  const playlistHost = document.querySelector(".spotifyplaylist");
  if (!playlistHost) return null;
  const topControls = playlistHost.querySelector(".top-controls");

  let actionWrap = topControls?.querySelector(".playlist-actions") || playlistHost.querySelector(".playlist-actions");
  if (!actionWrap) {
    actionWrap = document.createElement("div");
    actionWrap.className = "playlist-actions";
    if (topControls) {
      topControls.appendChild(actionWrap);
    } else {
      playlistHost.appendChild(actionWrap);
    }
  } else if (topControls && actionWrap.parentElement !== topControls) {
    topControls.appendChild(actionWrap);
  }

  let button = actionWrap.querySelector("#add-playlist-btn");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.id = "add-playlist-btn";
    button.className = "actionbtn";
    button.textContent = "+ Add Playlist";
    actionWrap.appendChild(button);
  }

  button.classList.remove("hidden");
  button.style.display = "inline-flex";
  button.style.visibility = "visible";
  button.style.zIndex = "2";

  if (!elements.addPlaylistBtn) {
    elements.addPlaylistBtn = button;
  }

  return button;
}

function persist() {
  saveAppState(state);
}

function getCurrentSongs() {
  return getActivePlaylist(state)?.songs || [];
}

function getSongById(songId) {
  const result = findSongById(state, songId);
  return result?.song || null;
}

function syncCurrentSongState() {
  if (state.player.currentSongId && !getSongById(state.player.currentSongId)) {
    state.player.currentSongId = null;
    player.pause();
  }
}

function updateAuthModeUI() {
  const signupMode = authMode === "signup";
  elements.authSubmit.textContent = signupMode ? "Create Account" : "Login";
  elements.authSwitch.textContent = signupMode ? "Switch to Login" : "Switch to Sign Up";
  elements.authName.classList.toggle("hidden", !signupMode);
  elements.authNameLabel.classList.toggle("hidden", !signupMode);
  elements.authName.required = signupMode;
}

function showAuthGate(mode = "login") {
  authMode = mode;
  updateAuthModeUI();
  elements.authError.textContent = "";
  elements.authForm.reset();
  elements.authGate.classList.remove("hidden");
  elements.authGate.setAttribute("aria-hidden", "false");
  elements.appShell.classList.add("hidden");
  elements.appShell.setAttribute("aria-hidden", "true");
}

function hideAuthGate() {
  elements.authGate.classList.add("hidden");
  elements.authGate.setAttribute("aria-hidden", "true");
  elements.appShell.classList.remove("hidden");
  elements.appShell.setAttribute("aria-hidden", "false");
}

function openPlaylistModal() {
  elements.playlistError.textContent = "";
  elements.playlistForm.reset();
  if (elements.playlistCoverPreview) {
    elements.playlistCoverPreview.src = "images/music.svg";
  }
  elements.playlistModal.classList.remove("hidden");
  elements.playlistModal.setAttribute("aria-hidden", "false");
  elements.playlistName.focus();
}

function closePlaylistModal() {
  elements.playlistModal.classList.add("hidden");
  elements.playlistModal.setAttribute("aria-hidden", "true");
}

function openMusicModal() {
  elements.musicError.textContent = "";
  elements.musicForm.reset();
  const activePlaylist = getActivePlaylist(state);
  if (!activePlaylist) {
    setFeedback(elements.feedback, "Select or create a playlist before adding music.", "error");
    return;
  }
  elements.musicModal.classList.remove("hidden");
  elements.musicModal.setAttribute("aria-hidden", "false");
  elements.musicTitle.focus();
}

function closeMusicModal() {
  elements.musicModal.classList.add("hidden");
  elements.musicModal.setAttribute("aria-hidden", "true");
}

function render() {
  const activePlaylist = getActivePlaylist(state);
  syncCurrentSongState();
  renderPlaylists({
    root: elements.cardContainer,
    playlists: state.playlists,
    activePlaylistId: state.activePlaylistId,
    onSelect: (playlistId) => {
      setActivePlaylist(state, playlistId);
      state.searchQuery = "";
      currentSearchResults = [];
      elements.searchInput.value = "";
      persist();
      render();
    },
    onDelete: (playlistId) => {
      const removed = deletePlaylist(state, playlistId);
      if (!removed) return;
      if (state.player.currentSongId && !getSongById(state.player.currentSongId)) {
        state.player.currentSongId = null;
        player.pause();
      }
      persist();
      render();
    }
  });

  const songsToRender = state.searchQuery ? currentSearchResults : activePlaylist?.songs || [];
  renderSongs({
    root: elements.songList,
    songs: songsToRender,
    currentSongId: state.player.currentSongId,
    onPlaySong: async (songId) => {
      const song = getSongById(songId);
      if (!song) return;
      state.player.currentSongId = song.id;
      player.setQueue(getPlayableSongs(state));
      player.setPlaybackModes({ shuffle: state.player.shuffle, repeat: state.player.repeat });
      try {
        await player.play(song);
      } catch {
        setFeedback(elements.feedback, "Audio playback failed for this track.", "error");
      }
      persist();
      renderPlaybackState();
      render();
    },
    onDeleteSong: (songId) => {
      const targetPlaylistId = state.searchQuery
        ? currentSearchResults.find((item) => item.id === songId)?.playlistId
        : state.activePlaylistId;
      if (!targetPlaylistId) return;
      const removed = deleteSongFromPlaylist(state, targetPlaylistId, songId);
      if (!removed) return;

      if (state.player.currentSongId === songId) {
        player.pause();
        state.player.currentSongId = null;
      }
      currentSearchResults = filterSongs(state.playlists, state.searchQuery);
      persist();
      render();
    }
  });

  if (!activePlaylist) {
    setFeedback(elements.feedback, "No playlist available. Add a new one.", "info");
  } else if (!state.searchQuery) {
    setFeedback(elements.feedback, `Showing playlist: ${activePlaylist.title}`, "info");
  }
}

function renderPlaybackState() {
  const song = getSongById(state.player.currentSongId);
  setPlaybackUI({
    playButton: elements.playBtn,
    songInfo: elements.songInfo,
    songTime: elements.songTime,
    song,
    playing: !player.audio.paused
  });

  elements.shuffleBtn.classList.toggle("active", state.player.shuffle);
  elements.repeatBtn.textContent = `Repeat: ${state.player.repeat}`;
  elements.volumeSlider.value = String(Math.round(player.getVolume() * 100));
  setVolumeIcon(elements.volumeIcon, player.getVolume());
}

function wireEvents() {
  if (eventsWired) return;
  eventsWired = true;

  if (!elements.searchBtn || !elements.searchInput || !elements.homeBtn || !elements.focusSearchBtn) {
    return;
  }

  elements.searchBtn.addEventListener("click", () => {
    state.searchQuery = elements.searchInput.value.trim();
    currentSearchResults = filterSongs(state.playlists, state.searchQuery);
    setFeedback(elements.feedback, `Found ${currentSearchResults.length} song(s).`);
    persist();
    render();
  });

  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      elements.searchBtn.click();
    }
  });

  elements.homeBtn.addEventListener("click", () => {
    state.searchQuery = "";
    currentSearchResults = [];
    elements.searchInput.value = "";
    ensureActivePlaylist(state);
    persist();
    render();
  });

  elements.focusSearchBtn.addEventListener("click", () => {
    elements.searchInput.focus();
  });

  elements.addMusicBtn?.addEventListener("click", openMusicModal);
  ensureAddPlaylistButton();
  elements.addPlaylistBtn?.addEventListener("click", openPlaylistModal);

  const resetToHome = () => {
    state.searchQuery = "";
    currentSearchResults = [];
    if (elements.searchInput) {
      elements.searchInput.value = "";
    }
    ensureActivePlaylist(state);
    persist();
    render();
    renderPlaybackState();
  };

  const brandHome = document.getElementById("brand-home");
  const brandTitle = document.getElementById("brand-title");
  const brandLogo = document.getElementById("brand-logo");

  brandHome?.addEventListener("click", resetToHome);
  brandTitle?.addEventListener("click", resetToHome);
  brandLogo?.addEventListener("click", resetToHome);
  brandHome?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      resetToHome();
    }
  });

  elements.playBtn.addEventListener("click", async () => {
    try {
      if (!state.player.currentSongId) {
        const firstSong = getCurrentSongs()[0];
        if (firstSong) {
          state.player.currentSongId = firstSong.id;
          await player.play(firstSong);
        }
      } else {
        await player.togglePlayPause();
      }
      persist();
      renderPlaybackState();
      render();
    } catch {
      setFeedback(elements.feedback, "Playback could not start.", "error");
    }
  });

  elements.nextBtn.addEventListener("click", async () => {
    try {
      player.setQueue(getPlayableSongs(state));
      player.setPlaybackModes({ shuffle: state.player.shuffle, repeat: state.player.repeat });
      const nextSong = player.getNextSong();
      if (!nextSong) return;
      state.player.currentSongId = nextSong.id;
      await player.play(nextSong);
      persist();
      render();
      renderPlaybackState();
    } catch {
      setFeedback(elements.feedback, "Could not play next track.", "error");
    }
  });

  elements.previousBtn.addEventListener("click", async () => {
    try {
      player.setQueue(getPlayableSongs(state));
      const previousSong = player.getPreviousSong();
      if (!previousSong) return;
      state.player.currentSongId = previousSong.id;
      await player.play(previousSong);
      persist();
      render();
      renderPlaybackState();
    } catch {
      setFeedback(elements.feedback, "Could not play previous track.", "error");
    }
  });

  elements.seekbar.addEventListener("click", (event) => {
    const bounds = elements.seekbar.getBoundingClientRect();
    const percentage = ((event.clientX - bounds.left) / bounds.width) * 100;
    player.seekByPercent(percentage);
  });

  elements.volumeSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value) / 100;
    state.player.volume = player.setVolume(value);
    setVolumeIcon(elements.volumeIcon, state.player.volume);
    persist();
  });

  elements.volumeIcon.addEventListener("click", () => {
    if (player.getVolume() > 0) {
      state.player.volume = 0;
    } else {
      state.player.volume = 0.8;
    }
    player.setVolume(state.player.volume);
    persist();
    renderPlaybackState();
  });

  elements.shuffleBtn.addEventListener("click", () => {
    state.player.shuffle = !state.player.shuffle;
    persist();
    renderPlaybackState();
  });

  elements.repeatBtn.addEventListener("click", () => {
    const order = ["off", "all", "one"];
    const nextIndex = (order.indexOf(state.player.repeat) + 1) % order.length;
    state.player.repeat = order[nextIndex];
    persist();
    renderPlaybackState();
  });

  elements.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.authError.textContent = "";
    try {
      if (authMode === "signup") {
        session.user = signup({
          email: elements.authEmail.value,
          password: elements.authPassword.value,
          name: elements.authName.value
        });
      } else {
        session.user = login({
          email: elements.authEmail.value,
          password: elements.authPassword.value
        });
      }
      refreshAuthButtons();
      hideAuthGate();
      render();
      renderPlaybackState();
    } catch (error) {
      elements.authError.textContent = error.message;
    }
  });

  elements.authSwitch.addEventListener("click", () => {
    authMode = authMode === "signup" ? "login" : "signup";
    updateAuthModeUI();
  });

  elements.playlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.playlistName.value.trim();
    const description = elements.playlistDescription?.value.trim() || "";
    const cover = elements.playlistCoverPreview?.src || "";

    if (!title) {
      elements.playlistError.textContent = "Playlist name is required.";
      return;
    }
    try {
      createPlaylist(state, { title, description, cover });
      persist();
      closePlaylistModal();
      render();
    } catch (error) {
      elements.playlistError.textContent = error.message;
    }
  });

  elements.playlistCancel.addEventListener("click", closePlaylistModal);
  elements.playlistModal.addEventListener("click", (event) => {
    if (event.target === elements.playlistModal) {
      closePlaylistModal();
    }
  });

  elements.playlistCover?.addEventListener("change", () => {
    const file = elements.playlistCover.files?.[0];
    if (!file) {
      if (elements.playlistCoverPreview) {
        elements.playlistCoverPreview.src = "images/music.svg";
      }
      return;
    }

    if (!file.type.startsWith("image/")) {
      elements.playlistError.textContent = "Please upload a valid image file.";
      elements.playlistCover.value = "";
      if (elements.playlistCoverPreview) {
        elements.playlistCoverPreview.src = "images/music.svg";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (elements.playlistCoverPreview && typeof reader.result === "string") {
        elements.playlistCoverPreview.src = reader.result;
      }
      elements.playlistError.textContent = "";
    };
    reader.onerror = () => {
      elements.playlistError.textContent = "Could not read selected image.";
      if (elements.playlistCoverPreview) {
        elements.playlistCoverPreview.src = "images/music.svg";
      }
    };
    reader.readAsDataURL(file);
  });

  elements.musicForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.musicTitle.value.trim();
    const artist = elements.musicArtist.value.trim();
    const file = elements.musicFile.files?.[0];

    if (!title || !artist || !file) {
      elements.musicError.textContent = "Please provide title, artist, and audio file.";
      return;
    }
    if (!file.type.startsWith("audio/")) {
      elements.musicError.textContent = "Please upload a valid audio file.";
      return;
    }

    const activePlaylist = getActivePlaylist(state);
    if (!activePlaylist) {
      elements.musicError.textContent = "No playlist selected. Select a playlist first.";
      return;
    }

    const song = {
      id: `local_${Date.now()}`,
      title,
      artist,
      src: URL.createObjectURL(file)
    };

    activePlaylist.songs.push(song);
    persist();
    closeMusicModal();
    render();
    setFeedback(elements.feedback, `Added "${title}" to ${activePlaylist.title}.`, "info");
  });

  elements.musicCancel?.addEventListener("click", closeMusicModal);
  elements.musicModal?.addEventListener("click", (event) => {
    if (event.target === elements.musicModal) {
      closeMusicModal();
    }
  });
}

function refreshAuthButtons() {
  setAuthButtons({
    signupButton: elements.signupBtn,
    loginButton: elements.loginBtn,
    user: session.user,
    onShowLogin: () => showAuthGate("login"),
    onShowSignup: () => showAuthGate("signup"),
    onLogout: () => {
      logout();
      session.user = null;
      player.pause();
      showAuthGate("login");
      refreshAuthButtons();
    }
  });
}

player.setCallbacks({
  onPlaybackState: ({ playing }) => {
    setPlaybackUI({
      playButton: elements.playBtn,
      songInfo: elements.songInfo,
      songTime: elements.songTime,
      song: getSongById(state.player.currentSongId),
      playing
    });
  },
  onTimeUpdate: ({ progress, label }) => {
    elements.circle.style.left = `${progress}%`;
    elements.songTime.textContent = label;
  },
  onSongEnded: async () => {
    try {
      player.setQueue(getPlayableSongs(state));
      player.setPlaybackModes({ shuffle: state.player.shuffle, repeat: state.player.repeat });
      const nextSong = player.getNextSong();
      if (!nextSong) {
        player.pause();
        return;
      }
      state.player.currentSongId = nextSong.id;
      await player.play(nextSong);
      persist();
      render();
      renderPlaybackState();
    } catch {
      setFeedback(elements.feedback, "Could not continue autoplay.", "error");
    }
  }
});

player.setVolume(state.player.volume);
player.setPlaybackModes({ shuffle: state.player.shuffle, repeat: state.player.repeat });
function startApp() {
  if (!canInitialize()) return;
  ensureAddPlaylistButton();
  wireEvents();
  refreshAuthButtons();
  if (session.user) {
    hideAuthGate();
    render();
    renderPlaybackState();
  } else {
    showAuthGate("login");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}

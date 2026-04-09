const APP_STORAGE_KEY = "ganshunen.appState.v1";

const DEFAULT_STATE = {
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

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return fallback;
  }
}

function normalizeTrack(folder, trackName, index) {
  const normalizedName = String(trackName || "").trim();
  const folderPath = encodeURIComponent(folder);
  const filePath = encodeURIComponent(normalizedName);
  const title = normalizedName.replace(/\.mp3$/i, "") || `Track ${index + 1}`;

  return {
    id: `${folder}::${normalizedName}`,
    title,
    artist: "Unknown Artist",
    src: `Songs/${folderPath}/${filePath}`
  };
}

function normalizePlaylist(album) {
  const folder = String(album?.folder || "default");
  const title = String(album?.title || folder);
  const description = String(album?.description || "");
  const cover = album?.cover ? `Songs/${encodeURIComponent(folder)}/${encodeURIComponent(album.cover)}` : "images/music.svg";
  const tracks = Array.isArray(album?.tracks) ? album.tracks : [];

  return {
    id: folder,
    title,
    description,
    cover,
    songs: tracks.map((track, index) => normalizeTrack(folder, track, index))
  };
}

function sanitizeSong(song) {
  const title = String(song?.title || "Untitled");
  const artist = String(song?.artist || "Unknown Artist");
  const src = String(song?.src || "");
  const id = String(song?.id || `${Date.now()}_${title}`);
  return { id, title, artist, src };
}

function sanitizePlaylist(playlist) {
  const id = String(playlist?.id || `pl_${Date.now()}`);
  const title = String(playlist?.title || "Untitled Playlist");
  const description = String(playlist?.description || "");
  const cover = String(playlist?.cover || "images/music.svg");
  const songs = Array.isArray(playlist?.songs) ? playlist.songs.map(sanitizeSong).filter((song) => song.src) : [];
  return { id, title, description, cover, songs };
}

export async function fetchDefaultPlaylists() {
  const response = await fetch("songs.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load songs manifest");
  }

  const manifest = await response.json();
  const albums = Array.isArray(manifest?.albums) ? manifest.albums : [];
  return albums.map(normalizePlaylist);
}

export function loadAppState() {
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) {
    return structuredClone(DEFAULT_STATE);
  }
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== "object") {
    return structuredClone(DEFAULT_STATE);
  }

  return {
    playlists: Array.isArray(parsed.playlists) ? parsed.playlists.map(sanitizePlaylist) : [],
    activePlaylistId: parsed.activePlaylistId ?? null,
    searchQuery: typeof parsed.searchQuery === "string" ? parsed.searchQuery : "",
    player: {
      currentSongId: parsed.player?.currentSongId ?? null,
      shuffle: Boolean(parsed.player?.shuffle),
      repeat: ["off", "one", "all"].includes(parsed.player?.repeat) ? parsed.player.repeat : "off",
      volume: typeof parsed.player?.volume === "number" ? parsed.player.volume : 0.8
    }
  };
}

export function saveAppState(state) {
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

export async function initializeAppState() {
  const state = loadAppState();
  if (state.playlists.length > 0) {
    return state;
  }

  const defaultPlaylists = await fetchDefaultPlaylists();
  state.playlists = defaultPlaylists;
  state.activePlaylistId = defaultPlaylists[0]?.id ?? null;
  saveAppState(state);
  return state;
}

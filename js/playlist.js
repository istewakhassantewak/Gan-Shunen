export function getActivePlaylist(state) {
  return state.playlists.find((playlist) => playlist.id === state.activePlaylistId) || state.playlists[0] || null;
}

export function ensureActivePlaylist(state) {
  if (!state.playlists.length) {
    state.activePlaylistId = null;
    return;
  }
  if (!state.playlists.some((playlist) => playlist.id === state.activePlaylistId)) {
    state.activePlaylistId = state.playlists[0].id;
  }
}

export function setActivePlaylist(state, playlistId) {
  if (state.playlists.some((playlist) => playlist.id === playlistId)) {
    state.activePlaylistId = playlistId;
  }
}

export function createPlaylist(state, payload) {
  const rawTitle = typeof payload === "string" ? payload : payload?.title;
  const rawDescription = typeof payload === "string" ? "" : payload?.description;
  const rawCover = typeof payload === "string" ? "" : payload?.cover;
  const title = String(rawTitle || "").trim();
  const description = String(rawDescription || "").trim();
  const cover = String(rawCover || "").trim();
  if (!title) {
    throw new Error("Playlist name is required.");
  }
  const playlist = {
    id: `pl_${Date.now()}`,
    title,
    description: description || "Custom playlist",
    cover: cover || "images/music.svg",
    songs: []
  };
  state.playlists.push(playlist);
  state.activePlaylistId = playlist.id;
  return playlist;
}

export function deletePlaylist(state, playlistId) {
  const initialLength = state.playlists.length;
  state.playlists = state.playlists.filter((playlist) => playlist.id !== playlistId);
  const changed = state.playlists.length !== initialLength;
  if (changed) {
    ensureActivePlaylist(state);
  }
  return changed;
}

export function deleteSongFromPlaylist(state, playlistId, songId) {
  const playlist = state.playlists.find((item) => item.id === playlistId);
  if (!playlist) return false;
  const initialLength = playlist.songs.length;
  playlist.songs = playlist.songs.filter((song) => song.id !== songId);
  return playlist.songs.length !== initialLength;
}

export function findSongById(state, songId) {
  for (const playlist of state.playlists) {
    const song = playlist.songs.find((item) => item.id === songId);
    if (song) {
      return { playlist, song };
    }
  }
  return null;
}

export function getPlayableSongs(state) {
  return state.playlists.flatMap((playlist) =>
    playlist.songs.map((song) => ({
      ...song,
      playlistId: playlist.id
    }))
  );
}

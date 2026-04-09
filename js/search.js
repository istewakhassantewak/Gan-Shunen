export function normalizeQuery(query) {
  return String(query || "").trim().toLowerCase();
}

export function filterSongs(playlists, query) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const results = [];
  for (const playlist of playlists) {
    for (const song of playlist.songs) {
      const titleMatch = song.title.toLowerCase().includes(normalized);
      const artistMatch = song.artist.toLowerCase().includes(normalized);
      if (titleMatch || artistMatch) {
        results.push({
          ...song,
          playlistId: playlist.id,
          playlistTitle: playlist.title
        });
      }
    }
  }

  return results;
}

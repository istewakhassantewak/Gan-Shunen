export function renderPlaylists({ root, playlists, activePlaylistId, onSelect, onDelete }) {
  root.innerHTML = "";

  playlists.forEach((playlist) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.playlistId = playlist.id;

    card.innerHTML = `
      <div class="play">▶</div>
      <img src="${playlist.cover}" alt="${playlist.title}" loading="lazy">
      <h2>${playlist.title}</h2>
      <p>${playlist.description || "No description"}</p>
      <div class="card-actions">
        <button type="button" class="actionbtn small" data-action="open">Open</button>
        <button type="button" class="actionbtn small danger" data-action="delete">Delete</button>
      </div>
    `;

    if (playlist.id === activePlaylistId) {
      card.classList.add("active-playlist");
    }

    const coverImage = card.querySelector("img");
    if (coverImage) {
      coverImage.addEventListener("error", () => {
        coverImage.src = "images/music.svg";
      }, { once: true });
    }

    card.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      if (action === "delete") {
        event.stopPropagation();
        onDelete(playlist.id);
        return;
      }
      onSelect(playlist.id);
    });

    root.appendChild(card);
  });
}

export function renderSongs({ root, songs, currentSongId, onPlaySong, onDeleteSong }) {
  root.innerHTML = "";

  songs.forEach((song) => {
    const item = document.createElement("li");
    item.className = song.id === currentSongId ? "active" : "";
    item.innerHTML = `
      <div class="info">
        <div>${song.title}</div>
        <div>${song.artist}</div>
      </div>
      <div class="list-actions">
        <button type="button" class="actionbtn small" data-action="play">Play</button>
        <button type="button" class="actionbtn small danger" data-action="delete">Delete</button>
      </div>
    `;

    item.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      if (action === "delete") {
        event.stopPropagation();
        onDeleteSong(song.id);
        return;
      }
      onPlaySong(song.id);
    });

    root.appendChild(item);
  });
}

export function setFeedback(element, text, type = "info") {
  element.textContent = text || "";
  element.classList.remove("error", "loading");
  if (type === "error") {
    element.classList.add("error");
  } else if (type === "loading") {
    element.classList.add("loading");
  }
}

export function setAuthButtons({ signupButton, loginButton, user, onLogout, onShowLogin, onShowSignup }) {
  if (user) {
    signupButton.textContent = user.name;
    loginButton.textContent = "Log Out";
    signupButton.onclick = null;
    loginButton.onclick = onLogout;
  } else {
    signupButton.textContent = "Sign Up";
    loginButton.textContent = "Log In";
    signupButton.onclick = onShowSignup;
    loginButton.onclick = onShowLogin;
  }
}

export function setPlaybackUI({ playButton, songInfo, songTime, song, playing }) {
  playButton.src = playing ? "images/pause.svg" : "images/play.svg";
  songInfo.textContent = song ? `${song.title} - ${song.artist}` : "No track selected";
  if (!song) {
    songTime.textContent = "00:00 / 00:00";
  }
}

export function setVolumeIcon(icon, volume) {
  icon.src = volume <= 0 ? "images/mute.svg" : "images/volume.svg";
}

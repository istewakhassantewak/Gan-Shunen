function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export class AudioPlayer {
  constructor(elements) {
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.elements = elements;
    this.state = {
      queue: [],
      currentSongId: null,
      shuffle: false,
      repeat: "off"
    };
    this.events = {
      onSongEnded: null,
      onSongChanged: null,
      onPlaybackState: null,
      onTimeUpdate: null
    };

    this.attachAudioEvents();
  }

  attachAudioEvents() {
    this.audio.addEventListener("timeupdate", () => {
      this.events.onTimeUpdate?.({
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        progress: this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0,
        label: `${formatTime(this.audio.currentTime)} / ${formatTime(this.audio.duration)}`
      });
    });

    this.audio.addEventListener("play", () => {
      this.events.onPlaybackState?.({ playing: true });
    });

    this.audio.addEventListener("pause", () => {
      this.events.onPlaybackState?.({ playing: false });
    });

    this.audio.addEventListener("ended", () => {
      this.events.onSongEnded?.();
    });
  }

  setCallbacks(callbacks) {
    this.events = { ...this.events, ...callbacks };
  }

  setVolume(value) {
    const normalized = Math.max(0, Math.min(1, Number(value)));
    this.audio.volume = normalized;
    return normalized;
  }

  getVolume() {
    return this.audio.volume;
  }

  setQueue(songs) {
    this.state.queue = Array.isArray(songs) ? songs : [];
  }

  setPlaybackModes({ shuffle, repeat }) {
    this.state.shuffle = Boolean(shuffle);
    this.state.repeat = repeat;
  }

  setCurrentSong(song) {
    if (!song) return;
    this.state.currentSongId = song.id;
    this.audio.src = song.src;
    this.events.onSongChanged?.(song);
  }

  async play(song = null) {
    if (song) {
      this.setCurrentSong(song);
    }
    if (!this.audio.src) return;
    await this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  togglePlayPause() {
    if (this.audio.paused) {
      return this.play();
    }
    this.pause();
    return Promise.resolve();
  }

  seekByPercent(percent) {
    if (!this.audio.duration) return;
    const clamped = Math.max(0, Math.min(100, percent));
    this.audio.currentTime = (clamped / 100) * this.audio.duration;
  }

  getCurrentSong(queue) {
    const items = queue || this.state.queue;
    return items.find((song) => song.id === this.state.currentSongId) || null;
  }

  getNextSong() {
    const queue = this.state.queue;
    if (!queue.length) return null;
    const currentIndex = queue.findIndex((song) => song.id === this.state.currentSongId);

    if (this.state.repeat === "one" && currentIndex >= 0) {
      return queue[currentIndex];
    }

    if (this.state.shuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      return queue[randomIndex];
    }

    if (currentIndex < 0) return queue[0];
    if (currentIndex === queue.length - 1) {
      return this.state.repeat === "all" ? queue[0] : null;
    }

    return queue[currentIndex + 1];
  }

  getPreviousSong() {
    const queue = this.state.queue;
    if (!queue.length) return null;
    const currentIndex = queue.findIndex((song) => song.id === this.state.currentSongId);
    if (currentIndex <= 0) return queue[0];
    return queue[currentIndex - 1];
  }
}

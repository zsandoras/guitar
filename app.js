(function () {
  const fileInput = document.getElementById('gp-file');
  const fileStatus = document.getElementById('file-status');
  const messages = document.getElementById('messages');
  const playButton = document.getElementById('play');
  const stopButton = document.getElementById('stop');
  const tempoSlider = document.getElementById('tempo');
  const tempoValue = document.getElementById('tempo-value');
  const trackList = document.getElementById('track-list');
  const alphaTabElement = document.getElementById('alpha-tab');

  if (!window.alphaTab || !alphaTabElement) {
    console.error('AlphaTab is not available.');
    return;
  }

  const api = new alphaTab.AlphaTabApi(alphaTabElement, {
    player: {
      enablePlayer: true,
      enableCursor: true,
      soundFont: {
        url: 'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.5.0/dist/soundfont/'
      }
    },
    display: {
      staveProfile: 'score'
    }
  });

  let currentTracks = [];

  function setMessage(text, type = 'info') {
    messages.textContent = text;
    messages.dataset.type = type;
  }

  function clearMessage() {
    setMessage('');
  }

  function updateTempoLabel(value) {
    const speed = Number(value) / 120;
    tempoValue.textContent = `${Math.round(speed * 100)}%`;
  }

  function renderTrackList(tracks) {
    trackList.innerHTML = '';
    const normalizedTracks = Array.isArray(tracks)
      ? tracks
      : Array.from(tracks || []);
    currentTracks = normalizedTracks;

    if (!normalizedTracks || normalizedTracks.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No tracks found in this file.';
      trackList.appendChild(empty);
      return;
    }

    normalizedTracks.forEach((track, index) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'track-chip';
      chip.textContent = track.name || `Track ${index + 1}`;
      chip.addEventListener('click', () => {
        selectTrack(index);
      });
      trackList.appendChild(chip);
    });

    selectTrack(0);
  }

  function selectTrack(index) {
    const chips = trackList.querySelectorAll('.track-chip');
    chips.forEach((chip, i) => {
      chip.classList.toggle('selected', i === index);
    });

    const track = currentTracks[index];
    if (track) {
      api.renderTracks([track]);
    }
  }

  function enableControls(enabled) {
    playButton.disabled = !enabled;
    stopButton.disabled = !enabled;
    tempoSlider.disabled = !enabled;
  }

  enableControls(false);

  tempoSlider.addEventListener('input', (event) => {
    const { value } = event.target;
    const speed = Number(value) / 120;
    api.playbackSpeed = speed;
    updateTempoLabel(value);
  });

  playButton.addEventListener('click', () => {
    api.playPause();
  });

  stopButton.addEventListener('click', () => {
    api.stop();
  });

  fileInput.addEventListener('change', async (event) => {
    const [file] = event.target.files;
    if (!file) {
      fileStatus.textContent = 'No file selected';
      enableControls(false);
      return;
    }

    fileStatus.textContent = file.name;
    enableControls(false);
    setMessage('Loading file, please wait…');

    try {
      const buffer = await file.arrayBuffer();
      await api.load(buffer);
      enableControls(true);
      if (api.score && api.score.tracks) {
        const tracks = Array.isArray(api.score.tracks)
          ? api.score.tracks
          : Array.from(api.score.tracks);
        renderTrackList(tracks);
      }
      clearMessage();
    } catch (error) {
      console.error(error);
      setMessage('Failed to load the selected file.', 'error');
    }
  });

  if (api.scoreLoaded && typeof api.scoreLoaded.on === 'function') {
    api.scoreLoaded.on((score) => {
      enableControls(true);
      renderTrackList(score.tracks || []);
    });
  }

  if (api.playerStateChanged && typeof api.playerStateChanged.on === 'function') {
    api.playerStateChanged.on((state) => {
      if (!state) {
        return;
      }

      const playing = state === alphaTab.synth.PlayerState.Playing;
      playButton.textContent = playing ? 'Pause' : 'Play';
    });
  }

  updateTempoLabel(tempoSlider.value);
})();

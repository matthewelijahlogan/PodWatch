// frontend/js/indexLoader.js

const PODCASTS_PER_PAGE = 20;
let currentPage = 1;
let totalPodcasts = 0;
let podcastsData = [];

const container = document.querySelector('.podcast-grid');
let paginationControls;
let playerModal;
let playerIframe;

function cleanEpisodeTitle(rawTitle, podcastName) {
  if (!rawTitle || !podcastName) return rawTitle;

  const normalizedTitle = rawTitle.toLowerCase();
  const normalizedPodcast = podcastName.toLowerCase();

  const index = normalizedTitle.indexOf(normalizedPodcast);
  if (index === 0) {
    return rawTitle.substring(podcastName.length).replace(/^[:\-\u2013\s]+/, '').trim();
  }

  return rawTitle.trim();
}

function toEmbedUrl(rawUrl) {
  if (!rawUrl) return '';

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtube.com') && url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim();
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (host.includes('youtube.com') && url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2];
      if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }
  } catch (_) {
    return rawUrl;
  }

  return rawUrl;
}

function ensurePlayerModal() {
  if (playerModal) return;

  playerModal = document.createElement('div');
  playerModal.className = 'player-modal hidden';
  playerModal.innerHTML = `
    <div class="player-modal-backdrop"></div>
    <div class="player-modal-content">
      <button class="player-close" type="button" aria-label="Close player">Close</button>
      <div class="video-frame-shell">
        <iframe
          class="video-frame-embed"
          title="PodWatch Video Player"
          frameborder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
          referrerpolicy="origin-when-cross-origin"
        ></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(playerModal);
  playerIframe = playerModal.querySelector('.video-frame-embed');

  const closeModal = () => {
    playerModal.classList.add('hidden');
    playerIframe.src = '';
  };

  playerModal.querySelector('.player-close').addEventListener('click', closeModal);
  playerModal.querySelector('.player-modal-backdrop').addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !playerModal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

function openPlayerModal(rawUrl) {
  const embedUrl = toEmbedUrl(rawUrl);
  if (!embedUrl) return;

  ensurePlayerModal();
  playerIframe.src = embedUrl;
  playerModal.classList.remove('hidden');
}

function renderPodcasts(podcasts) {
  container.innerHTML = '';

  podcasts.forEach((pod) => {
    const row = document.createElement('div');
    row.classList.add('podcast-row');

    const logoImg = document.createElement('img');
    logoImg.classList.add('podcast-logo');
    logoImg.src = pod.image && pod.image.length > 0
      ? pod.image
      : (pod.latest_episodes?.[0]?.thumbnail || '/assets/img/logo/logo.png');
    logoImg.alt = `${pod.title || 'Podcast'} logo`;

    const titleText = document.createElement('div');
    titleText.classList.add('podcast-title');
    titleText.textContent = pod.title || 'Untitled Podcast';

    row.appendChild(logoImg);
    row.appendChild(titleText);

    const episodeContainer = document.createElement('div');
    episodeContainer.classList.add('episode-container');
    row.appendChild(episodeContainer);

    const episodes = Array.isArray(pod.latest_episodes) ? pod.latest_episodes : [];
    episodes.forEach((ep) => {
      const cleanedTitle = cleanEpisodeTitle(ep.title, pod.title);
      const epSlot = document.createElement('div');
      epSlot.classList.add('episode-slot');

      const scrollText = document.createElement('span');
      scrollText.classList.add('scroll-text');
      scrollText.textContent = cleanedTitle;

      epSlot.appendChild(scrollText);
      epSlot.title = cleanedTitle;

      epSlot.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlayerModal(ep.embed_url || ep.url);
      });
      episodeContainer.appendChild(epSlot);
    });

    row.addEventListener('click', () => {
      if (pod.link) window.open(pod.link, '_blank');
    });

    container.appendChild(row);
  });
}

function renderPagination() {
  if (paginationControls) paginationControls.remove();

  paginationControls = document.createElement('div');
  paginationControls.classList.add('pagination-controls');

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateDisplay();
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage * PODCASTS_PER_PAGE >= totalPodcasts;
  nextBtn.addEventListener('click', () => {
    if (currentPage * PODCASTS_PER_PAGE < totalPodcasts) {
      currentPage++;
      updateDisplay();
    }
  });

  paginationControls.appendChild(prevBtn);
  paginationControls.appendChild(document.createTextNode(` Page ${currentPage} `));
  paginationControls.appendChild(nextBtn);

  container.after(paginationControls);
}

function updateDisplay() {
  const start = (currentPage - 1) * PODCASTS_PER_PAGE;
  const end = start + PODCASTS_PER_PAGE;
  const pageData = podcastsData.slice(start, end);

  renderPodcasts(pageData);
  renderPagination();
}

export async function loadPodcastGuide() {
  if (!container) {
    console.error('.podcast-grid not found');
    return;
  }

  ensurePlayerModal();
  container.innerHTML = '<p>Loading the PodWatch guide...</p>';

  try {
    const res = await fetch('/api/v1/guide?episodes_per_show=5');
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);

    const data = await res.json();

    podcastsData = Array.isArray(data.channels)
      ? data.channels.map((channel) => ({
          ...channel.show,
          image: channel.episodes?.[0]?.thumbnail || '',
          latest_episodes: channel.episodes || [],
        }))
      : [];

    podcastsData = podcastsData.slice(0, 50);
    totalPodcasts = podcastsData.length;
    currentPage = 1;

    updateDisplay();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

// frontend/js/indexLoader.js

const PODCASTS_PER_PAGE = 20;
let currentPage = 1;
let totalPodcasts = 0;
let podcastsData = [];

const container = document.querySelector('.podcast-grid');
let paginationControls;

function cleanEpisodeTitle(rawTitle, podcastName) {
  if (!rawTitle || !podcastName) return rawTitle;

  const normalizedTitle = rawTitle.toLowerCase();
  const normalizedPodcast = podcastName.toLowerCase();

  const index = normalizedTitle.indexOf(normalizedPodcast);
  if (index === 0) {
    return rawTitle.substring(podcastName.length).replace(/^[:\-–\s]+/, '').trim();
  }

  return rawTitle.trim();
}


function renderPodcasts(podcasts) {
  container.innerHTML = '';

  podcasts.forEach(pod => {
    const row = document.createElement('div');
    row.classList.add('podcast-row');

    const logoImg = document.createElement('img');
    logoImg.classList.add('podcast-logo');
    logoImg.src = pod.image && pod.image.length > 0 ? `/${pod.image}` : 'https://via.placeholder.com/60x60?text=🎧';
    logoImg.alt = `${pod.title || 'Podcast'} logo`;

    const titleText = document.createElement('div');
    titleText.classList.add('podcast-title');
    titleText.textContent = pod.title || 'Untitled Podcast';

    row.appendChild(logoImg);
    row.appendChild(titleText);

    const episodeContainer = document.createElement('div');
    episodeContainer.classList.add('episode-container');
    row.appendChild(episodeContainer);

    fetch(`/api/youtube/latest?q=${encodeURIComponent(pod.title || '')}`)
      .then(res => res.json())
      .then(episodes => {
        if (Array.isArray(episodes)) {
          episodes.forEach(ep => {
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
              window.open(ep.url, '_blank');
            });

            episodeContainer.appendChild(epSlot);
          });
        }
      })
      .catch(err => {
        console.error(`❌ Error loading episodes for ${pod.title}:`, err);
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
    console.error('❌ .podcast-grid not found');
    return;
  }

  container.innerHTML = '<p>Loading top podcasts...</p>';

  try {
    const res = await fetch('/api/podcasts');
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`);

    const data = await res.json();

    podcastsData = Array.isArray(data)
      ? data
      : Array.isArray(data.podcasts)
        ? data.podcasts
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

const viewContainer = document.getElementById('viewContainer');
const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');
const toolbar = document.getElementById('toolbar');
const searchInput = document.getElementById('searchInput');
const categorySelect = document.getElementById('categorySelect');
const refreshButton = document.getElementById('refreshButton');
const serviceStatus = document.getElementById('serviceStatus');
const playerDialog = document.getElementById('playerDialog');
const playerFrame = document.getElementById('playerFrame');
const playerTitle = document.getElementById('playerTitle');
const youtubeLink = document.getElementById('youtubeLink');

const state = {
  view: 'guide',
  query: '',
  category: 'all',
  guide: [],
  podcasts: [],
  categories: [],
  picks: [],
};

const viewCopy = {
  guide: ['The podcast guide', 'Full episodes from official channels, arranged like the TV guide you already know.'],
  discover: ['Discover podcasts', 'Browse the current podcast charts and find something new.'],
  categories: ['Browse by category', 'Jump directly into the corner of podcasting that fits your mood.'],
  picks: ['Editor’s picks', 'A shorter list for the days when infinite choice is the problem.'],
  about: ['Podcasting, made watchable', 'PodWatch connects discovery to official video and audio sources.'],
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function fetchJson(path) {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`PodWatch returned ${response.status}`);
  }
  return response.json();
}

function setServiceStatus(ok, label) {
  serviceStatus.classList.toggle('online', ok);
  serviceStatus.classList.toggle('offline', !ok);
  serviceStatus.lastElementChild.textContent = label;
}

function setLoading(message = 'Loading PodWatch…') {
  viewContainer.setAttribute('aria-busy', 'true');
  viewContainer.replaceChildren();
  const card = element('div', 'loading-card');
  card.append(element('span', 'spinner'), element('p', '', message));
  viewContainer.append(card);
}

function showError(error) {
  viewContainer.setAttribute('aria-busy', 'false');
  const card = element('div', 'empty-state');
  card.append(
    element('p', 'eyebrow', 'Connection problem'),
    element('h2', '', 'The guide could not load'),
    element('p', '', error?.message || 'Please try again.'),
  );
  const retry = element('button', 'refresh-button', 'Try again');
  retry.type = 'button';
  retry.addEventListener('click', () => loadView(state.view, true));
  card.append(retry);
  viewContainer.replaceChildren(card);
}

function formatDate(value) {
  if (!value) return 'Recent episode';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Recent episode';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(parsed);
}

function openPlayer(episode) {
  if (!episode?.video_id) return;
  playerTitle.textContent = episode.title || 'Episode';
  playerFrame.src = `${episode.embed_url || `https://www.youtube-nocookie.com/embed/${episode.video_id}`}?autoplay=1&rel=0`;
  youtubeLink.href = episode.url || `https://www.youtube.com/watch?v=${episode.video_id}`;
  if (typeof playerDialog.showModal === 'function') {
    playerDialog.showModal();
  } else {
    playerDialog.setAttribute('open', '');
  }
}

function closePlayer() {
  playerFrame.src = '';
  if (typeof playerDialog.close === 'function' && playerDialog.open) {
    playerDialog.close();
  } else {
    playerDialog.removeAttribute('open');
  }
}

function episodeButton(episode) {
  const button = element('button', 'episode-button');
  button.type = 'button';

  const image = element('img', 'episode-art');
  image.src = episode.thumbnail || '/assets/img/logo/logo.png';
  image.alt = '';
  image.loading = 'lazy';

  const copy = element('span', 'episode-copy');
  copy.append(
    element('strong', '', episode.title || 'Untitled episode'),
    element('small', '', `${formatDate(episode.published_at)} · Play episode`),
  );
  button.append(image, copy, element('span', 'play-icon', '▶'));
  button.addEventListener('click', () => openPlayer(episode));
  return button;
}

function guideCard(channel) {
  const show = channel.show || {};
  const episodes = Array.isArray(channel.episodes) ? channel.episodes : [];
  const card = element('article', 'channel-card');

  const header = element('div', 'channel-header');
  const identity = element('div', 'channel-identity');
  identity.append(
    element('p', 'channel-number', String(show.short_title || show.title || 'PW').slice(0, 3).toUpperCase()),
    element('div', 'channel-title'),
  );
  identity.lastElementChild.append(
    element('h2', '', show.title || 'Untitled show'),
    element('p', '', show.host || 'PodWatch'),
  );

  const badge = element('span', 'category-badge', show.category || 'Podcast');
  header.append(identity, badge);
  card.append(header);

  const list = element('div', 'episode-list');
  if (episodes.length) {
    episodes.forEach((episode) => list.append(episodeButton(episode)));
  } else {
    list.append(element('p', 'no-episodes', 'No full episodes are available right now.'));
  }
  card.append(list);
  return card;
}

function renderGuide() {
  const query = state.query.toLowerCase();
  const channels = state.guide.filter((channel) => {
    const show = channel.show || {};
    const haystack = [
      show.title,
      show.host,
      ...(channel.episodes || []).map((episode) => episode.title),
    ].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });

  const grid = element('div', 'guide-grid');
  channels.forEach((channel) => grid.append(guideCard(channel)));
  viewContainer.replaceChildren(
    channels.length ? grid : emptyState('No guide matches', 'Try a different show, host, or episode.'),
  );
  viewContainer.setAttribute('aria-busy', 'false');
}

function podcastCard(podcast) {
  const card = element('article', 'podcast-card');
  const rank = element('span', 'rank-badge', podcast.rank ? `#${podcast.rank}` : 'PW');
  const image = element('img', 'podcast-art');
  image.src = podcast.image || '/assets/img/logo/logo.png';
  image.alt = '';
  image.loading = 'lazy';
  const copy = element('div', 'podcast-copy');
  copy.append(
    element('h2', '', podcast.title || 'Untitled podcast'),
    element('p', '', podcast.author || 'Unknown creator'),
    element('small', '', podcast.category || 'Podcast'),
  );
  card.append(rank, image, copy);
  if (podcast.url) {
    const link = element('a', 'secondary-button', 'View podcast');
    link.href = podcast.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.append(link);
  }
  return card;
}

function renderDiscover() {
  const query = state.query.toLowerCase();
  const podcasts = state.podcasts.filter((podcast) => (
    !query || `${podcast.title || ''} ${podcast.author || ''}`.toLowerCase().includes(query)
  ));
  const grid = element('div', 'podcast-list');
  podcasts.forEach((podcast) => grid.append(podcastCard(podcast)));
  viewContainer.replaceChildren(
    podcasts.length ? grid : emptyState('No podcasts match', 'Try another title or creator.'),
  );
  viewContainer.setAttribute('aria-busy', 'false');
}

function categoryCard(category) {
  const button = element('button', 'category-card');
  button.type = 'button';
  button.append(
    element('span', 'category-monogram', (category.name || 'P').slice(0, 2).toUpperCase()),
    element('strong', '', category.name || 'Podcast'),
    element('small', '', 'Open guide'),
  );
  button.addEventListener('click', () => {
    state.category = category.id || 'all';
    categorySelect.value = state.category;
    navigate('guide');
  });
  return button;
}

function renderCategories() {
  const grid = element('div', 'category-grid');
  state.categories.forEach((category) => grid.append(categoryCard(category)));
  viewContainer.replaceChildren(grid);
  viewContainer.setAttribute('aria-busy', 'false');
}

function renderPicks() {
  const grid = element('div', 'podcast-list');
  state.picks.forEach((pick, index) => grid.append(podcastCard({ ...pick, rank: index + 1 })));
  viewContainer.replaceChildren(
    state.picks.length ? grid : emptyState('No picks yet', 'Check back for the next editorial list.'),
  );
  viewContainer.setAttribute('aria-busy', 'false');
}

function emptyState(title, message) {
  const card = element('div', 'empty-state');
  card.append(element('h2', '', title), element('p', '', message));
  return card;
}

function renderAbout() {
  const about = element('div', 'about-grid');
  [
    ['One guide', 'Web, Android, and Roku read from the same PodWatch service.'],
    ['Official sources', 'Episode metadata comes from official channel feeds and podcast RSS.'],
    ['Playback you can trust', 'Video opens through YouTube embeds or official watch links.'],
  ].forEach(([title, body]) => {
    const card = element('article', 'about-card');
    card.append(element('h2', '', title), element('p', '', body));
    about.append(card);
  });
  viewContainer.replaceChildren(about);
  viewContainer.setAttribute('aria-busy', 'false');
}

async function loadView(view, force = false) {
  setLoading();
  try {
    if (view === 'guide') {
      if (force || !state.guide.length) {
        const data = await fetchJson(`/api/v1/guide?category=${encodeURIComponent(state.category)}&episodes_per_show=5`);
        state.guide = Array.isArray(data.channels) ? data.channels : [];
      }
      renderGuide();
    } else if (view === 'discover') {
      if (force || !state.podcasts.length) {
        const data = await fetchJson('/api/podcasts?page=1&per_page=30');
        state.podcasts = Array.isArray(data.podcasts) ? data.podcasts : [];
      }
      renderDiscover();
    } else if (view === 'categories') {
      if (force || !state.categories.length) {
        state.categories = await fetchJson('/api/categories');
      }
      renderCategories();
    } else if (view === 'picks') {
      if (force || !state.picks.length) {
        state.picks = await fetchJson('/api/editors-picks');
      }
      renderPicks();
    } else {
      renderAbout();
    }
    setServiceStatus(true, 'Service online');
  } catch (error) {
    setServiceStatus(false, 'Service unavailable');
    showError(error);
  }
}

function navigate(view, replaceHash = false) {
  state.view = viewCopy[view] ? view : 'guide';
  const [title, description] = viewCopy[state.view];
  pageTitle.textContent = title;
  pageDescription.textContent = description;
  toolbar.hidden = !['guide', 'discover'].includes(state.view);

  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === state.view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });

  const nextHash = `#${state.view}`;
  if (window.location.hash !== nextHash) {
    if (replaceHash) history.replaceState(null, '', nextHash);
    else history.pushState(null, '', nextHash);
  }
  loadView(state.view);
}

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => navigate(button.dataset.view));
});

document.querySelectorAll('[data-view-link]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(link.dataset.viewLink);
  });
});

searchInput.addEventListener('input', () => {
  state.query = searchInput.value.trim();
  if (state.view === 'guide') renderGuide();
  if (state.view === 'discover') renderDiscover();
});

categorySelect.addEventListener('change', () => {
  state.category = categorySelect.value;
  state.guide = [];
  loadView('guide', true);
});

refreshButton.addEventListener('click', () => loadView(state.view, true));
document.getElementById('closePlayerButton').addEventListener('click', closePlayer);
document.getElementById('dialogCloseButton').addEventListener('click', closePlayer);
playerDialog.addEventListener('click', (event) => {
  if (event.target === playerDialog) closePlayer();
});
playerDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closePlayer();
});
window.addEventListener('popstate', () => navigate(window.location.hash.slice(1) || 'guide', true));

fetchJson('/api/v1/health')
  .then(() => setServiceStatus(true, 'Service online'))
  .catch(() => setServiceStatus(false, 'Service unavailable'));

navigate(window.location.hash.slice(1) || 'guide', true);

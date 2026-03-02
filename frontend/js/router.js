// frontend/js/router.js
import { loadHome } from './indexLoader.js';
import { loadCategories } from './categories.js';
import { loadNewEpisodes } from './new-episodes.js';

const routes = {
  '': loadHome,
  '#categories': loadCategories,
  '#new-episodes': loadNewEpisodes,
  // etc.
};

function router() {
  const hash = window.location.hash;
  if (routes[hash]) {
    routes[hash]();
  } else {
    loadNotFound();
  }
}

// Example view loader functions
function loadNotFound() {
  document.getElementById('main-content').textContent = 'Page not found.';
}

// Listen for hash changes
window.addEventListener('hashchange', router);

// Initial load
window.addEventListener('DOMContentLoaded', router);
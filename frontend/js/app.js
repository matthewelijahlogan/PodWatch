// frontend/js/app.js

import { fetchPodcastData } from './dataLoader.js';

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('.podcast-grid');

  try {
    const podcasts = await fetchPodcastData();

    podcasts.forEach(podcast => {
      const card = document.createElement('div');
      card.classList.add('podcast-card');

      // Example logo placeholder; we can update this with YouTube channel logos later
      const logo = document.createElement('img');
      logo.src = podcast.logo || 'https://via.placeholder.com/300x300?text=No+Image';
      logo.alt = `${podcast.title} logo`;

      const title = document.createElement('div');
      title.classList.add('podcast-title');
      title.textContent = podcast.title;

      const author = document.createElement('div');
      author.classList.add('podcast-author');
      author.textContent = podcast.author;

      card.appendChild(logo);
      card.appendChild(title);
      card.appendChild(author);

      // Optional: click to open detail page or external link
      card.addEventListener('click', () => {
        window.open(podcast.link, '_blank');
      });

      grid.appendChild(card);
    });

  } catch (error) {
    grid.innerHTML = `<p style="color: red;">Failed to load podcasts: ${error.message}</p>`;
    console.error('Error loading podcast data:', error);
  }
});

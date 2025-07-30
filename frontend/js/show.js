// frontend/js/show.js

// Extract query param (?id=xyz)
function getQueryParam(name) {
  const url = new URL(window.location.href)
  return url.searchParams.get(name)
}

import { fetchPodcastData } from './dataLoader.js'

document.addEventListener('DOMContentLoaded', async () => {
  const id = getQueryParam('id')
  if (!id) {
    document.body.innerHTML = '<p style="color:red;">Podcast ID missing in URL.</p>'
    return
  }

  const podcasts = await fetchPodcastData()
  const show = podcasts.find(p => p.title.toLowerCase().replace(/\s+/g, '-') === id)

  if (!show) {
    document.body.innerHTML = '<p style="color:red;">Podcast not found.</p>'
    return
  }

  document.getElementById('show-title').textContent = show.title
  document.getElementById('show-author').textContent = `By ${show.author}`
  document.getElementById('show-description').textContent = show.description || 'No description available.'

  // Placeholder for future YouTube embeds
})

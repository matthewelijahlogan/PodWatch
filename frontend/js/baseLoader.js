// frontend/js/baseLoader.js - helper to populate any list of cards dynamically

export async function loadCards({ url, containerId, cardBuilder }) {
  const container = document.getElementById(containerId)
  if (!container) return

  try {
    const res = await fetch(url)
    const items = await res.json()

    items.forEach(item => {
      const card = cardBuilder(item)
      container.appendChild(card)
    })
  } catch (err) {
    console.error('❌ Failed to load data:', err)
    container.innerHTML = '<p style="color: red;">Failed to load content.</p>'
  }
}

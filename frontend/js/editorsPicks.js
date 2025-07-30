// frontend/js/editorsPicks.js

// editorsPicks.js

import { loadCards } from './baseLoader.js'

function createEditorCard(pick) {
  const card = document.createElement('div')
  card.className = 'card'

  const title = document.createElement('h2')
  title.textContent = pick.title

  const author = document.createElement('p')
  author.textContent = `By ${pick.author}`

  const desc = document.createElement('p')
  desc.textContent = pick.description

  card.append(title, author, desc)
  return card
}

document.addEventListener('DOMContentLoaded', () => {
  loadCards({
    url: '../backend/data/editors_picks.json',
    containerId: 'editors-list',
    cardBuilder: createEditorCard
  })
})

export function loadNewEpisodes() {
  const main = document.getElementById('main-content');
  main.textContent = 'Loading new episodes...';

  fetch('/api/podcasts') // Adjust endpoint if needed
    .then(response => response.json())
    .then(episodes => {
      main.innerHTML = '<h2>New Episodes</h2>';
      if (!episodes.length) {
        main.innerHTML += '<p>No new episodes found.</p>';
        return;
      }
      const ul = document.createElement('ul');
      episodes.forEach(ep => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${ep.title}</strong> by ${ep.podcast} <br><em>${ep.date}</em>`;
        ul.appendChild(li);
      });
      main.appendChild(ul);
    })
    .catch(() => {
      main.textContent = 'Failed to load new episodes.';
    });
}
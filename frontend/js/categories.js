document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      const main = document.getElementById('category-list');
      main.innerHTML = '';
      if (!categories.length) {
        main.textContent = 'No categories found.';
        return;
      }
      const ul = document.createElement('ul');
      categories.forEach(cat => {
        const li = document.createElement('li');
        li.textContent = `${cat.name}: ${cat.description}`;
        ul.appendChild(li);
      });
      main.appendChild(ul);
    })
    .catch(() => {
      document.getElementById('category-list').textContent = 'Failed to load categories.';
    });
});

// frontend/js/app.js

document.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('logo');
  const menu = document.getElementById('dropdownMenu');

  if (logo && menu) {
    logo.addEventListener('click', (e) => {
      e.stopPropagation();
      logo.classList.add('logo-shake');
      logo.addEventListener('animationend', () => {
        logo.classList.remove('logo-shake');
        menu.classList.toggle('show');
      }, { once: true });
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== logo) {
        menu.classList.remove('show');
      }
    });
  }
});

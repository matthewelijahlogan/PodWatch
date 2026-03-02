document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("recommendation-container");

  fetch("/api/recommend")
    .then((res) => res.json())
    .then((data) => {
      container.innerHTML = "";
      data.forEach(podcast => {
        const card = document.createElement("div");
        card.className = "podcast-card";
        card.innerHTML = `
          <h2>${podcast.title}</h2>
          <p>${podcast.description || "No description available."}</p>
        `;
        container.appendChild(card);
      });
    })
    .catch((err) => {
      container.innerHTML = "<p>Failed to load recommendations.</p>";
      console.error(err);
    });
});

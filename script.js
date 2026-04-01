const API_KEY = "3fcb5792bd86636fb93f8d5fa159d32e";

async function fetchMovies() {

  const response = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`
  );

  const data = await response.json();

  const container = document.getElementById("movies");

  data.results.forEach(movie => {

    const card = document.createElement("div");

    card.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" width="200">
      <h3>${movie.title}</h3>
      <p>⭐ ${movie.vote_average}</p>
    `;

    container.appendChild(card);

  });

}

fetchMovies();
// TMDB API Configuration
const API_KEY = "09c18febc78292d701e642d976b60d0c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500/";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original/";

// Endpoints
const ENDPOINTS = {
  trending: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
  popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
};

// Wait for DOM to Load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  handleNavbarScroll();
  setupModalListeners();
});

// Initialize Application
async function initApp() {
  // Fetch and render Trending Movies (for Continue Watching)
  await fetchAndRenderMovies(ENDPOINTS.trending, "trending-row");

  // Fetch and render Popular Movies (for Trending Now)
  await fetchAndRenderMovies(ENDPOINTS.popular, "popular-row");
}

// Fetch and Render Movies from TMDB
async function fetchAndRenderMovies(url, containerId) {
  const container = document.getElementById(containerId);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const movies = data.results;

    if (!movies || movies.length === 0) {
      container.innerHTML = '<p class="error-msg">No movies found.</p>';
      return;
    }

    // Clear container before rendering
    container.innerHTML = "";

    movies.forEach((movie) => {
      const movieCard = document.createElement("div");
      movieCard.className = "movie-card";

      // Format date and rating
      const releaseDate = movie.release_date
        ? movie.release_date.split("-")[0]
        : "N/A";
      const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

      movieCard.innerHTML = `
                <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
                <div class="card-overlay">
                    <div class="card-info">
                        <h3>${movie.title}</h3>
                        <p>${releaseDate} | <i class="fas fa-star" style="color: gold;"></i> ${rating}</p>
                    </div>
                </div>
            `;

      movieCard.addEventListener("click", () => {
        openModal(movie);
      });

      container.appendChild(movieCard);
    });
  } catch (error) {
    console.error("Error loading movies:", error);
    container.innerHTML =
      '<p class="error-msg">Failed to load movies. Please check your connection or API key.</p>';
  }
}

// Modal Logic
function setupModalListeners() {
  const modal = document.getElementById("movie-modal");
  const closeBtn = document.querySelector(".close-btn");

  closeBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside content
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      closeModal();
    }
  });

  // Close with Escape key
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

async function playTrailer(movieId) {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`,
    );
    const data = await response.json();
    const videos = data.results;

    // Find official trailer on YouTube
    const trailer = videos.find(
      (v) => v.type === "Trailer" && v.site === "YouTube",
    );

    if (trailer) {
      window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank");
    } else {
      alert("Trailer not available");
    }
  } catch (error) {
    console.error("Error fetching trailer:", error);
    alert("Error loading trailer");
  }
}

function openModal(movie) {
  const modal = document.getElementById("movie-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalRating = document.getElementById("modal-rating");
  const modalOverview = document.getElementById("modal-overview");
  const modalHeaderImg = document.getElementById("modal-header-image");
  const playBtn = document.getElementById("modal-play-btn");

  // Populate data
  modalTitle.innerText = movie.title;
  modalDate.innerText = movie.release_date
    ? movie.release_date.split("-")[0]
    : "N/A";
  modalRating.innerHTML = `<i class="fas fa-star" style="color: gold;"></i> ${movie.vote_average.toFixed(
    1,
  )} Rating`;
  modalOverview.innerText = movie.overview || "No description available.";

  // Set backdrop image
  const backdropPath = movie.backdrop_path || movie.poster_path;
  modalHeaderImg.style.backgroundImage = `url(${BACKDROP_BASE_URL}${backdropPath})`;

  // Update Play Button
  playBtn.onclick = () => playTrailer(movie.id);

  // Show modal
  modal.style.display = "block";
  document.body.style.overflow = "hidden"; // Prevent background scroll
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  modal.style.display = "none";
  document.body.style.overflow = "auto"; // Restore scroll
}

// Navbar Scroll Effect
function handleNavbarScroll() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// TMDB API Configuration
const API_KEY = "09c18febc78292d701e642d976b60d0c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500/";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original/";

// OMDB API Configuration
const OMDB_API_KEY = "e5ef6fb7";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

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
  const videoModal = document.getElementById("video-modal");
  const closeBtn = document.querySelector(".close-btn");
  const closeVideoBtn = document.querySelector(".close-video-btn");

  closeBtn.addEventListener("click", closeModal);
  closeVideoBtn.addEventListener("click", closeVideoModal);

  // Close modals when clicking outside content
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      closeModal();
    }
    if (event.target == videoModal) {
      closeVideoModal();
    }
  });

  // Close with Escape key
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeVideoModal();
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
      openVideoModal(trailer.key);
    } else {
      alert("Trailer not available");
    }
  } catch (error) {
    console.error("Error fetching trailer:", error);
    alert("Error loading trailer");
  }
}

function openVideoModal(videoKey) {
  const videoModal = document.getElementById("video-modal");
  const iframe = document.getElementById("trailer-iframe");

  // Set YouTube Embed URL with autoplay
  iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;

  // Show Modal
  videoModal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  const videoModal = document.getElementById("video-modal");
  const iframe = document.getElementById("trailer-iframe");

  // Stop video by clearing src
  iframe.src = "";

  // Hide Modal
  videoModal.style.display = "none";

  // Restore overflow if movie modal is also closed
  if (document.getElementById("movie-modal").style.display !== "block") {
    document.body.style.overflow = "auto";
  }
}

// Fetch additional data from OMDB
async function fetchOMDBData(title, year) {
  try {
    const response = await fetch(
      `${OMDB_BASE_URL}?t=${encodeURIComponent(title)}&y=${year}&apikey=${OMDB_API_KEY}`,
    );
    const data = await response.json();
    return data.Response === "True" ? data : null;
  } catch (error) {
    console.error("OMDB Error:", error);
    return null;
  }
}

async function openModal(movie) {
  const modal = document.getElementById("movie-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalRating = document.getElementById("modal-rating");
  const modalOverview = document.getElementById("modal-overview");
  const modalHeaderImg = document.getElementById("modal-header-image");
  const playBtn = document.getElementById("modal-play-btn");

  // Enriched data placeholders
  const modalRuntime = document.getElementById("modal-runtime");
  const modalImdb = document.getElementById("modal-imdb");
  const modalActors = document.getElementById("modal-actors");

  // Reset enriched fields
  modalRuntime.innerText = "";
  modalImdb.style.display = "none";
  modalActors.innerText = "";

  // Populate basic TMDB data
  modalTitle.innerText = movie.title;
  const year = movie.release_date ? movie.release_date.split("-")[0] : "";
  modalDate.innerText = year || "N/A";
  modalRating.innerHTML = `<i class="fas fa-star" style="color: gold;"></i> ${movie.vote_average.toFixed(1)} Rating`;
  modalOverview.innerText = movie.overview || "No description available.";

  // Set backdrop image
  const backdropPath = movie.backdrop_path || movie.poster_path;
  modalHeaderImg.style.backgroundImage = `url(${BACKDROP_BASE_URL}${backdropPath})`;

  // Update Play Button
  playBtn.onclick = () => playTrailer(movie.id);

  // Show modal
  modal.style.display = "block";
  document.body.style.overflow = "hidden"; // Prevent background scroll

  // Fetch and apply OMDB data
  if (year) {
    const omdbData = await fetchOMDBData(movie.title, year);
    if (omdbData) {
      if (omdbData.Runtime && omdbData.Runtime !== "N/A") {
        modalRuntime.innerText = `| ${omdbData.Runtime}`;
      }
      if (omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
        modalImdb.innerText = `IMDb ${omdbData.imdbRating}`;
        modalImdb.style.display = "inline-block";
      }
      if (omdbData.Actors && omdbData.Actors !== "N/A") {
        modalActors.innerText = `Starring: ${omdbData.Actors}`;
      }
    }
  }
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  modal.style.display = "none";

  // Restore scroll unless video modal is still open
  if (document.getElementById("video-modal").style.display !== "block") {
    document.body.style.overflow = "auto";
  }
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

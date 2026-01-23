// TMDB API Configuration
const API_KEY = '09c18febc78292d701e642d976b60d0c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500/';

// Endpoints
const ENDPOINTS = {
    trending: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
    popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`
};

// Wait for DOM to Load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    handleNavbarScroll();
});

// Initialize Application
async function initApp() {
    // Fetch and render Trending Movies (for Continue Watching)
    await fetchAndRenderMovies(ENDPOINTS.trending, 'trending-row');
    
    // Fetch and render Popular Movies (for Trending Now)
    await fetchAndRenderMovies(ENDPOINTS.popular, 'popular-row');
}

// Fetch and Render Movies from TMDB
async function fetchAndRenderMovies(url, containerId) {
    const container = document.getElementById(containerId);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        const movies = data.results;

        if (!movies || movies.length === 0) {
            container.innerHTML = '<p class="error-msg">No movies found.</p>';
            return;
        }

        // Clear container before rendering
        container.innerHTML = '';

        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            
            // Format date and rating
            const releaseDate = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            
            movieCard.innerHTML = `
                <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
                <div class="card-overlay">
                    <div class="card-info">
                        <h3>${movie.title}</h3>
                        <p>${releaseDate} | <i class="fas fa-star" style="color: gold;"></i> ${rating}</p>
                    </div>
                </div>
            `;
            
            movieCard.addEventListener('click', () => {
                alert(`Viewing details for: ${movie.title}\nRelease: ${releaseDate}\nRating: ${rating}`);
            });

            container.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
        container.innerHTML = '<p class="error-msg">Failed to load movies. Please check your connection or API key.</p>';
    }
}

// Navbar Scroll Effect
function handleNavbarScroll() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

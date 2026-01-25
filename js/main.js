// TMDB API Configuration
const API_KEY = "09c18febc78292d701e642d976b60d0c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500/";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/original/";

// OMDB API Configuration
const OMDB_API_KEY = "e5ef6fb7";
const OMDB_BASE_URL = "https://www.omdbapi.com/";

// Watchmode API Configuration
const WATCHMODE_API_KEY = "1QNJ91Fjl4RB1BGAqZuo03WAqGwjpJvZZWkgcEUW";
const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";

// Jikan API (MAL) Configuration
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// GogoAnime API (anbuanime) Configuration
const GOGO_API_URL = "https://anbuanime.onrender.com";

// Endpoints
const ENDPOINTS = {
  trending: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
  popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
  search: `${BASE_URL}/search/multi?api_key=${API_KEY}`,
  tvTrending: `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`,
  tvPopular: `${BASE_URL}/tv/popular?api_key=${API_KEY}`,
  movieNowPlaying: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`,
  tvOnTheAir: `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`,
};

// Global State
let searchTimeout = null;
const loadedContent = {
    movies: false,
    tv: false,
    anime: false,
    animeCollections: false
};
let activeFilters = {
    movie: { genres: [], country: '' },
    tv: { genres: [], country: '' }
};
const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'KR', name: 'South Korea' },
    { code: 'JP', name: 'Japan' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'ES', name: 'Spain' },
    { code: 'BR', name: 'Brazil' },
    { code: 'CN', name: 'China' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TR', name: 'Turkey' }
];

// Wait for DOM to Load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  handleNavbarScroll();
  setupModalListeners();
  setupSearch();
  setupNavigation();
  setupFilters();
  
  // Close dropdowns when clicking outside
  window.onclick = (event) => {
    if (!event.target.matches('.filter-btn') && !event.target.closest('.filter-dropdown')) {
        document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
    }
  };
});

// Initialize Application
async function initApp() {
  if (loadedContent.movies) return;

  // Fetch and render Trending Movies (for Continue Watching)
  await fetchAndRenderContent(ENDPOINTS.trending, "trending-row", "movie");

  // Fetch and render Popular Movies (for Trending Now)
  await fetchAndRenderContent(ENDPOINTS.popular, "popular-row", "movie");
  
  loadedContent.movies = true;
}

async function initMoviesApp() {
    if (loadedContent.movies_view) return;

    // Initial Popular Fetch for Movies View
    await fetchAndRenderContent(ENDPOINTS.popular, "movies-popular-row", "movie");

    // Populate Filters
    await populateFilters('movie');

    loadedContent.movies_view = true;
}

async function initTVApp() {
    if (loadedContent.tv) return;

    // Fetch and render Trending TV
    await fetchAndRenderContent(ENDPOINTS.tvTrending, "tv-trending-row", "tv");

    // Fetch and render Popular TV
    await fetchAndRenderContent(ENDPOINTS.tvPopular, "tv-popular-row", "tv");

    loadedContent.tv = true;
}

// Unified Fetch and Render
async function fetchAndRenderContent(url, containerId, type) {
  const container = document.getElementById(containerId);

  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const results = data.results;

    if (!results || results.length === 0) {
      container.innerHTML = '<p class="error-msg">No content found.</p>';
      return;
    }

    container.innerHTML = "";

    results.forEach((item) => {
      const mediaType = item.media_type || type; 
      const card = createContentCard(item, mediaType);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading content:", error);
    container.innerHTML =
      '<p class="error-msg">Failed to load content. Please check your connection or API key.</p>';
  }
}

// Helper to create content card (Movie/TV)
function createContentCard(item, type) {
  const card = document.createElement("div");
  card.className = "movie-card";

  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? date.split("-")[0] : "N/A";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
  const posterPath = item.poster_path
    ? `${IMAGE_BASE_URL}${item.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";

  const inList = isInMyList(item.id);

  card.innerHTML = `
        <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
        <div class="list-btn ${inList ? "active" : ""}" title="${inList ? "Remove from List" : "Add to My List"}" data-id="${item.id}">
            <i class="fas ${inList ? "fa-check" : "fa-plus"}"></i>
        </div>
        <div class="card-overlay">
            <div class="card-info">
                <h3>${title}</h3>
                <p>${year} | <i class="fas fa-star" style="color: gold;"></i> ${rating}</p>
            </div>
        </div>
    `;

  card.addEventListener("click", (e) => {
    if (e.target.closest(".list-btn")) return;
    openModal(item, type);
  });

  const listBtn = card.querySelector(".list-btn");
  listBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMyList(item, type);
    const isActive = isInMyList(item.id);
    listBtn.classList.toggle("active", isActive);
    listBtn.querySelector("i").className = `fas ${isActive ? "fa-check" : "fa-plus"}`;
    listBtn.title = isActive ? "Remove from List" : "Add to My List";
  });

  return card;
}

// LocalStorage helpers
function getMyList() {
  const list = localStorage.getItem("layarfilm_mylist");
  return list ? JSON.parse(list) : [];
}

function isInMyList(id) {
  const list = getMyList();
  return list.some((m) => m.id === id);
}

function toggleMyList(item, type) {
  let list = getMyList();
  const index = list.findIndex((m) => m.id === item.id);

  if (index > -1) {
    list.splice(index, 1);
  } else {
    list.push({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      type: type 
    });
  }

  localStorage.setItem("layarfilm_mylist", JSON.stringify(list));

  if (document.getElementById("mylist-view").style.display === "block") {
    renderMyList();
  }
}

// Navigation Logic
function setupNavigation() {
  const navHome = document.getElementById("nav-home");
  const navTv = document.getElementById("nav-tv");
  const navMyList = document.getElementById("nav-mylist");

  navHome.addEventListener("click", (e) => {
    e.preventDefault();
    showView("homepage");
    setActiveLink(navHome);
  });

  navTv.addEventListener("click", (e) => {
      e.preventDefault();
      showView("tv");
      setActiveLink(navTv);
      initTVApp();
  });

  const navMovies = document.getElementById("nav-movies");
  navMovies.addEventListener("click", (e) => {
    e.preventDefault();
    showView("movies");
    setActiveLink(navMovies);
    initMoviesApp();
  });

  navMyList.addEventListener("click", (e) => {
    e.preventDefault();
    showView("mylist");
    setActiveLink(navMyList);
    renderMyList();
  });

  const navPopular = document.getElementById("nav-popular");
  navPopular.addEventListener("click", (e) => {
    e.preventDefault();
    showView("popular");
    setActiveLink(navPopular);
    initPopularApp();
  });

  const navAnime = document.getElementById("nav-anime");
  navAnime.addEventListener("click", (e) => {
    e.preventDefault();
    showView("anime");
    setActiveLink(navAnime);
    initAnimeApp();
  });
}

function showView(viewName) {
  const homeContent = document.getElementById("homepage-content");
  const movieContent = document.getElementById("movies-view");
  const tvContent = document.getElementById("tv-shows-view");
  const animeContent = document.getElementById("anime-view");
  const popularContent = document.getElementById("popular-view");
  const searchView = document.getElementById("search-view");
  const mylistView = document.getElementById("mylist-view");

  homeContent.style.display = viewName === "homepage" ? "block" : "none";
  movieContent.style.display = viewName === "movies" ? "block" : "none";
  tvContent.style.display = viewName === "tv" ? "block" : "none";
  animeContent.style.display = viewName === "anime" ? "block" : "none";
  popularContent.style.display = viewName === "popular" ? "block" : "none";
  searchView.style.display = viewName === "search" ? "block" : "none";
  mylistView.style.display = viewName === "mylist" ? "block" : "none";

  if (viewName === "homepage" || viewName === "movies" || viewName === "tv" || viewName === "popular" || viewName === "anime") {
    document.getElementById("search-input").value = "";
  }
}

function setActiveLink(activeLink) {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });
  activeLink.classList.add("active");
}

function renderMyList() {
  const grid = document.getElementById("mylist-grid");
  const list = getMyList();

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-list-msg">Your list is empty.</p>';
    return;
  }

  list.forEach((item) => {
    const card = createContentCard(item, item.type || 'movie');
    grid.appendChild(card);
  });
}

// Search Logic
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchToggle = document.getElementById("search-toggle");

  searchToggle.addEventListener("click", () => {
    searchInput.focus();
  });

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 400);
  });
}

async function handleSearch(query) {
  const homeContent = document.getElementById("homepage-content");
  const tvContent = document.getElementById("tv-shows-view");
  const searchView = document.getElementById("search-view");
  const mylistView = document.getElementById("mylist-view");
  const resultsGrid = document.getElementById("search-results-grid");
  const searchTitle = document.getElementById("search-query-title");

  if (!query || query.length === 0) {
    showView("homepage");
    return;
  }

  homeContent.style.display = "none";
  tvContent.style.display = "none";
  mylistView.style.display = "none";
  searchView.style.display = "block";

  searchTitle.innerText = `Searching for "${query}"...`;
  resultsGrid.innerHTML = '<div class="loading-results">Loading results...</div>';

  try {
    const response = await fetch(`${ENDPOINTS.search}&query=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.results;

    resultsGrid.innerHTML = "";
    searchTitle.innerText = `Search results for "${query}"`;

    const filteredResults = results.filter(item => item.media_type === "movie" || item.media_type === "tv");

    if (!filteredResults || filteredResults.length === 0) {
      resultsGrid.innerHTML = '<p class="no-results">No results found for your search.</p>';
      return;
    }

    filteredResults.forEach((item) => {
      const card = createContentCard(item, item.media_type);
      resultsGrid.appendChild(card);
    });
  } catch (error) {
    console.error("Search Error:", error);
    resultsGrid.innerHTML = '<p class="error-msg">Failed to fetch search results.</p>';
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

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      closeModal();
    }
    if (event.target == videoModal) {
      closeVideoModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
      closeVideoModal();
    }
  });
}

async function playTrailer(id, type) {
  try {
    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const response = await fetch(
      `${BASE_URL}/${endpoint}/${id}/videos?api_key=${API_KEY}`,
    );
    const data = await response.json();
    const videos = data.results;

    const trailer = videos.find(
      (v) => (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube",
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

  iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;

  videoModal.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeVideoModal() {
  const videoModal = document.getElementById("video-modal");
  const iframe = document.getElementById("trailer-iframe");

  iframe.src = "";
  videoModal.style.display = "none";

  if (document.getElementById("movie-modal").style.display !== "block") {
    document.body.style.overflow = "auto";
  }
}

// Watchmode Fetch Logic
async function fetchWatchmodeData(title, type) {
    const container = document.getElementById("watchmode-sources");
    const section = document.getElementById("modal-watchmode-section");
    
    // Reset previous data
    container.innerHTML = '<p style="color:#aaa; font-style:italic;">Checking availability...</p>';
    section.style.display = "block";
    
    try {
        // Step 1: Search for title to get Watchmode ID
        const searchType = type === 'tv' ? 'tv' : 'movie';
        const searchRes = await fetch(`${WATCHMODE_BASE_URL}/search/?apiKey=${WATCHMODE_API_KEY}&search_field=name&search_value=${encodeURIComponent(title)}&types=${searchType}`);
        const searchData = await searchRes.json();
        
        if (!searchData.title_results || searchData.title_results.length === 0) {
            container.innerHTML = '<p style="color:#aaa;">Not available for streaming</p>';
            return;
        }
        
        // Find best match (simple logic: first result)
        const bestMatch = searchData.title_results[0];
        
        // Step 2: Get Sources
        // Determine region: use active filter if set, otherwise default to US
        const region = activeFilters[type === 'tv' ? 'tv' : 'movie'].country || 'US';
        const sourcesRes = await fetch(`${WATCHMODE_BASE_URL}/title/${bestMatch.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=${region}`);
        const sourcesData = await sourcesRes.json();
        
        if (!sourcesData || sourcesData.length === 0) {
            container.innerHTML = '<p style="color:#aaa;">Not available for streaming</p>';
            return;
        }

        // Filter and Deduplicate Sources (Prioritize Subscription and Free)
        const uniqueSources = [];
        const seen = new Set();
        
        sourcesData.forEach(source => {
            if (seen.has(source.source_id)) return;
            // Only show Subscription (sub) or Free services
            if (source.type === 'sub' || source.type === 'free') {
                uniqueSources.push(source);
                seen.add(source.source_id);
            }
        });

        if (uniqueSources.length === 0) {
             container.innerHTML = '<p style="color:#aaa;">No subscription streaming found. (Rent/Buy available)</p>';
             return;
        }

        // Render Sources
        container.innerHTML = "";
        
        // Limit to top 5 sources to avoid clutter
        uniqueSources.slice(0, 5).forEach(source => {
            const link = document.createElement("a");
            link.href = source.web_url;
            link.target = "_blank";
            link.className = "streaming-link";
            
            // Use a generic placeholder if logo fails, but Watchmode usually provides valid URLs if you map them manually. 
            // Note: Watchmode API actually returns specific source fields. We will try to rely on their data or text if logo is missing.
            // Since we don't have a reliable logo map, we will use text labels and try to find a logo if possible or just style it nicely.
            // Actually Watchmode doesn't return logo URLs in the source endpoint directly without expansion. 
            // We'll stick to text names for reliability unless we had a logo map.
            // Wait, implementation plan mentioned logos. Let's try to simulate or use text.
            // Let's use simple text for now to ensure it works, maybe add a generic icon.
            
            // Correction: Better UX is to use simple text if no logo.
            
            link.innerHTML = `
                <span class="streaming-name">${source.name}</span>
                <span class="streaming-type">${source.type === 'free' ? 'FREE' : ''}</span>
            `;
            
            container.appendChild(link);
        });

    } catch (error) {
        console.error("Watchmode Error", error);
        container.innerHTML = '<p style="color:#aaa;">Unable to load streaming info</p>';
    }
}

// Fetch additional data from OMDB
async function fetchOMDBData(title, year, type) {
   const outputType = type === 'tv' ? 'series' : 'movie';
  try {
    const response = await fetch(
      `${OMDB_BASE_URL}?t=${encodeURIComponent(title)}&y=${year}&type=${outputType}&apikey=${OMDB_API_KEY}`,
    );
    const data = await response.json();
    return data.Response === "True" ? data : null;
  } catch (error) {
    console.error("OMDB Error:", error);
    return null;
  }
}

async function fetchTVDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
        const data = await response.json();
        return data; 
    } catch(e) {
        console.error("TV Details Error", e);
        return null;
    }
}

async function openModal(item, type) {
  const modal = document.getElementById("movie-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDate = document.getElementById("modal-date");
  const modalRating = document.getElementById("modal-rating");
  const modalOverview = document.getElementById("modal-overview");
  const modalHeaderImg = document.getElementById("modal-header-image");
  const playBtn = document.getElementById("modal-play-btn");

  const modalRuntime = document.getElementById("modal-runtime");
  const modalImdb = document.getElementById("modal-imdb");
  const modalActors = document.getElementById("modal-actors");
  
  // Watchmode Section
  const watchmodeSection = document.getElementById("modal-watchmode-section");
  const watchmodeSources = document.getElementById("watchmode-sources");

  modalRuntime.innerText = "";
  modalImdb.style.display = "none";
  modalActors.innerText = "";
  watchmodeSection.style.display = "none"; // Hide initially
  watchmodeSources.innerHTML = "";
  
  // Recommendations Section
  const recSection = document.getElementById("modal-recommendations-section");
  const recGrid = document.getElementById("recommendations-grid");
  recSection.style.display = "none";
  recGrid.innerHTML = "";

  // Anime Episode Section
  const animeEpContainer = document.getElementById("anime-episode-container");
  const animePlayerWrapper = document.getElementById("anime-player-wrapper");
  const animePlayer = document.getElementById("anime-player");
  const episodeList = document.getElementById("episode-list");
  
  if (animeEpContainer) {
      animeEpContainer.style.display = "none";
      animePlayerWrapper.style.display = "none";
      animePlayer.src = "";
      episodeList.innerHTML = "";
  }
  
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;
  const year = date ? date.split("-")[0] : "";

  modalTitle.innerText = title;
  modalDate.innerText = year || "N/A";
  modalRating.innerHTML = `<i class="fas fa-star" style="color: gold;"></i> ${item.vote_average? item.vote_average.toFixed(1) : 'N/A'} Rating`;
  modalOverview.innerText = item.overview || "No description available.";

  refreshModalListBtn(item, type);

  const backdropPath = item.backdrop_path || item.poster_path;
  if (backdropPath) {
      modalHeaderImg.style.backgroundImage = `url(${BACKDROP_BASE_URL}${backdropPath})`;
  } else {
      modalHeaderImg.style.background = "#111";
  }

  playBtn.onclick = () => playTrailer(item.id, type);

  const watchBtn = document.getElementById("modal-watch-btn");
  watchBtn.onclick = () => playFullMovie(item.id, type);

  const modalPlusBtn = document.getElementById("modal-plus-btn");
  modalPlusBtn.onclick = () => {
    toggleMyList(item, type);
    refreshModalListBtn(item, type);
    renderMyList();
  };

  modal.style.display = "block";
  document.body.style.overflow = "hidden";

  if (type === 'tv') {
      const tvDetails = await fetchTVDetails(item.id);
      if (tvDetails) {
        modalRuntime.innerText = `| ${tvDetails.number_of_seasons} Season${tvDetails.number_of_seasons > 1 ? 's' : ''}`;
      }
  }

  if (year) {
    const omdbData = await fetchOMDBData(title, year, type);
    if (omdbData) {
      if (omdbData.Runtime && omdbData.Runtime !== "N/A" && type !== 'tv') {
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
  
  // Call Watchmode API
  fetchWatchmodeData(title, type);

  // Call Recommendations API
  showRecommendationsSkeleton();
  const recommendations = await fetchSimilarContent(item.id, type);
  renderRecommendations(recommendations, type);

  // Check for Anime (Genre 16 or Country JP or Type 'tv' with animation)
  const isAnime = (item.genre_ids && item.genre_ids.includes(16)) || 
                  (type === 'tv' && item.origin_country && item.origin_country.includes('JP'));

  if (isAnime) {
      // GogoAnime API is unstable. Keeping this function but handling errors silently.
      // fetchGogoAnimeData(...) will just fail silently if API is down.
      fetchGogoAnimeData(item.original_name || item.title || item.name);
  }
}

function refreshModalListBtn(item, type) {
    const modalPlusBtn = document.getElementById("modal-plus-btn");
    const inList = isInMyList(item.id);
    modalPlusBtn.innerHTML = `<i class="fas ${inList ? "fa-check" : "fa-plus"}"></i> ${inList ? "In My List" : "My List"}`;
    if (inList) {
        modalPlusBtn.style.color = "var(--netflix-red)";
    } else {
        modalPlusBtn.style.color = "#fff";
    }
}

function closeModal() {
  const modal = document.getElementById("movie-modal");
  modal.style.display = "none";

  if (document.getElementById("video-modal").style.display !== "block") {
    document.body.style.overflow = "auto";
  }
}

function handleNavbarScroll() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

function playFullMovie(id, type, season = 1, episode = 1) {
    const videoModal = document.getElementById("video-modal");
    const iframe = document.getElementById("trailer-iframe"); 
    
    let embedUrl = "";
    
    if (type === 'movie') {
        embedUrl = `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    } else if (type === 'tv') {
        embedUrl = `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;
    }

    iframe.src = embedUrl;
    videoModal.style.display = "block";
}

async function fetchSimilarContent(id, type) {
    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
}

function showRecommendationsSkeleton() {
    const grid = document.getElementById("recommendations-grid");
    const section = document.getElementById("modal-recommendations-section");
    
    grid.innerHTML = "";
    section.style.display = "block";

    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "recommendation-card skeleton";
        skeleton.style.height = "195px"; // Approximate height of a card
        grid.appendChild(skeleton);
    }
}

function renderRecommendations(items, type) {
    const grid = document.getElementById("recommendations-grid");
    const section = document.getElementById("modal-recommendations-section");
    
    if (!items || items.length === 0) {
        grid.innerHTML = '<p class="empty-list-msg" style="padding: 20px 0;">No recommendations available</p>';
        section.style.display = "block";
        return;
    }

    grid.innerHTML = "";
    section.style.display = "block";

    items.slice(0, 10).forEach(item => {
        const card = document.createElement("div");
        card.className = "recommendation-card";
        
        const title = item.title || item.name;
        const posterPath = item.poster_path 
            ? `${IMAGE_BASE_URL}${item.poster_path}` 
            : "https://via.placeholder.com/500x750?text=No+Image";
        const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

        card.innerHTML = `
            <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
            <div class="recommendation-info">
                <h4>${title}</h4>
                <p><i class="fas fa-star star-icon"></i> ${rating}</p>
            </div>
        `;

        card.onclick = () => {
            // Smoothly transition to new modal content
            openModal(item, type);
            // Scroll modal to top
            document.querySelector(".modal-content").scrollTop = 0;
        };

        grid.appendChild(card);
    });
}

// --- Filter Management ---

function setupFilters() {
    // Desktop Clear Filter (changed ID to movie-clear-filters-btn)
    const clearBtn = document.getElementById("movie-clear-filters-btn");
    if (clearBtn) clearBtn.onclick = () => clearFilters('movie');
}

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const isShowing = dropdown.classList.contains('show');
    
    // Close all other dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('show'));
    
    if (!isShowing) {
        dropdown.classList.add('show');
    }
}

async function populateFilters(type) {
    // Fetch Genres
    try {
        const response = await fetch(`${BASE_URL}/genre/${type}/list?api_key=${API_KEY}`);
        const data = await response.json();
        const genres = data.genres;
        
        const containerId = type === 'movie' ? 'movie-genre-list' : 'tv-genre-list';
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = "";
            genres.forEach(genre => {
                const item = document.createElement("div");
                item.className = "filter-item";
                item.innerText = genre.name;
                item.dataset.id = genre.id;
                item.onclick = () => toggleFilter(type, 'genres', genre.id, item);
                container.appendChild(item);
            });
        }
    } catch (error) {
        console.error("Genre fetch error", error);
    }

    // Populate Countries
    const cContainerId = type === 'movie' ? 'movie-country-list' : 'tv-country-list';
    const cContainer = document.getElementById(cContainerId);
    if (cContainer) {
        cContainer.innerHTML = "";
        COUNTRIES.forEach(country => {
            const item = document.createElement("div");
            item.className = "filter-item";
            item.innerText = country.name;
            item.dataset.code = country.code;
            item.onclick = () => setCountryFilter(type, country.code, item, country.name);
            cContainer.appendChild(item);
        });
    }
}

function toggleFilter(type, category, value, element) {
    const list = activeFilters[type][category];
    const index = list.indexOf(value);
    
    if (index > -1) {
        list.splice(index, 1);
        element.classList.remove('active');
    } else {
        list.push(value);
        element.classList.add('active');
    }
    
    updateFilteredResults(type);
}

function setCountryFilter(type, code, element, name) {
    const current = activeFilters[type].country;
    const container = element.parentElement;
    
    container.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
    
    if (current === code) {
        activeFilters[type].country = '';
    } else {
        activeFilters[type].country = code;
        element.classList.add('active');
    }

    // Update button text
    const groupID = type === 'movie' ? 'movie-country-filter-group' : 'tv-country-filter-group';
    const groupElement = document.getElementById(groupID);
    if (groupElement) {
        const btn = groupElement.querySelector('.filter-btn');
        btn.innerHTML = `${activeFilters[type].country ? name : 'Country'} <i class="fas fa-chevron-down"></i>`;
    }

    updateFilteredResults(type);
}

async function updateFilteredResults(type) {
    const filters = activeFilters[type];
    const hasFilters = filters.genres.length > 0 || filters.country !== '';
    
    const clearBtnId = type === 'movie' ? 'movie-clear-filters-btn' : 'tv-clear-filters-btn';
    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) clearBtn.style.display = hasFilters ? 'block' : 'none';

    const containerId = type === 'movie' ? '#movies-view .main-container' : '#tv-shows-view .main-container';
    const mainContainer = document.querySelector(containerId);
    if (!mainContainer) return;

    if (!hasFilters) {
        const filterSection = mainContainer.querySelector('.filtered-results-section');
        if (filterSection) filterSection.remove();
        mainContainer.querySelectorAll('.movie-section').forEach(row => row.style.display = 'block');
        return;
    }

    // Prepare Discovery URL
    let url = `${BASE_URL}/discover/${type}?api_key=${API_KEY}&sort_by=popularity.desc`;
    
    if (filters.genres.length > 0) {
        url += `&with_genres=${filters.genres.join(',')}`;
    }
    
    if (filters.country) {
        if (type === 'movie') {
            url += `&region=${filters.country}`;
        } else {
            url += `&with_origin_country=${filters.country}`;
        }
    }

    // Hide original sections
    mainContainer.querySelectorAll('.movie-section').forEach(row => {
        if (!row.classList.contains('filtered-results-section')) {
            row.style.display = 'none';
        }
    });
    
    // Show/Update Filtered Section
    let filterSection = mainContainer.querySelector('.filtered-results-section');
    if (!filterSection) {
        filterSection = document.createElement('section');
        filterSection.className = 'movie-section filtered-results-section';
        filterSection.innerHTML = `
            <h2 class="section-title">Results for active filters</h2>
            <div class="search-results-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px;"></div>
        `;
        mainContainer.appendChild(filterSection);
    }
    filterSection.style.display = 'block';
    
    const grid = filterSection.querySelector('.search-results-grid');
    grid.innerHTML = '<div class="skeleton-container" style="grid-column: 1/-1; display:flex; gap:15px; flex-wrap:wrap;">' + 
                     Array(10).fill('<div class="movie-card skeleton" style="height:250px; width:130px; border-radius:4px;"></div>').join('') + 
                     '</div>';

    try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data.results;

        grid.innerHTML = "";
        if (!results || results.length === 0) {
            grid.innerHTML = '<p class="empty-list-msg" style="grid-column: 1/-1;">No movies found for selected filters.</p>';
            return;
        }

        results.forEach(item => {
            const card = createContentCard(item, type);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Filter results error", error);
        grid.innerHTML = '<p class="error-msg">Error loading filtered results.</p>';
    }
}

function clearFilters(type) {
    activeFilters[type] = { genres: [], country: '' };
    
    const viewId = type === 'movie' ? 'movies-view' : 'tv-shows-view';
    const container = document.getElementById(viewId);
    if (!container) return;
    
    container.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
    
    const clearBtn = container.querySelector('.clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    
    const groupID = type === 'movie' ? 'movie-country-filter-group' : 'tv-country-filter-group';
    const groupElement = document.getElementById(groupID);
    if (groupElement) {
        const btn = groupElement.querySelector('.filter-btn');
        btn.innerHTML = `Country <i class="fas fa-chevron-down"></i>`;
    }

    const mainContainer = container.querySelector('.main-container');
    const filterSection = mainContainer.querySelector('.filtered-results-section');
    if (filterSection) filterSection.remove();
    
    mainContainer.querySelectorAll('.movie-section').forEach(row => row.style.display = 'block');
}

// --- New & Popular Logic ---

async function initPopularApp() {
    // Setup Tab Listeners
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.onclick = (e) => {
            tabBtns.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            fetchPopularTabData(e.target.dataset.tab);
        };
    });

    // Default to 'week' tab if not already loaded
    if (!loadedContent.popular) {
        fetchPopularTabData('week');
        loadedContent.popular = true;
    }
}

async function fetchPopularTabData(tab) {
    const grid = document.getElementById("popular-grid");
    
    // Show Skeletons
    grid.innerHTML = Array(12).fill('<div class="movie-card skeleton" style="height:250px;"></div>').join('');

    let endpoints = [];
    if (tab === 'week') {
        endpoints = [ENDPOINTS.trending, ENDPOINTS.tvTrending];
    } else if (tab === 'month') {
        endpoints = [ENDPOINTS.popular, ENDPOINTS.tvPopular];
    } else if (tab === 'new') {
        endpoints = [ENDPOINTS.movieNowPlaying, ENDPOINTS.tvOnTheAir];
    }

    try {
        const responses = await Promise.all(endpoints.map(url => fetch(url)));
        const dataObjects = await Promise.all(responses.map(res => res.json()));
        
        // Merge results
        let combined = [];
        dataObjects.forEach((data, index) => {
            const results = data.results || [];
            // Track type if not provided (index 0 is always movie endpoint in our definitions above, but trending-multi is different)
            // Let's be explicit based on endpoint name or structure
            const type = endpoints[index].includes('/tv/') || endpoints[index].includes('/trending/tv/') ? 'tv' : 'movie';
            
            results.forEach(item => {
                combined.push({ ...item, media_type: item.media_type || type });
            });
        });

        // Sort by popularity
        combined.sort((a, b) => b.popularity - a.popularity);

        // Render
        renderPopularResults(combined);
    } catch (error) {
        console.error("Error fetching popular data:", error);
        grid.innerHTML = '<p class="error-msg">Unable to load popular content. Please try again later.</p>';
    }
}

function renderPopularResults(results) {
    const grid = document.getElementById("popular-grid");
    grid.innerHTML = "";

    if (!results || results.length === 0) {
        grid.innerHTML = '<p class="empty-list-msg">No results found.</p>';
        return;
    }

    results.forEach(item => {
        const card = createContentCard(item, item.media_type);
        grid.appendChild(card);
    });
}

// --- Anime Logic ---

async function initAnimeApp() {
    if (loadedContent.anime) return;

    // Fetch and render Anime rows
    await fetchAndRenderAnime('trending', 'anime-trending-row');
    await fetchAndRenderAnime('popular', 'anime-popular-row');
    
    // Fetch and render Jikan (MAL) rows
    await fetchAndRenderJikan('seasonal', 'anime-seasonal-row');
    await fetchAndRenderJikan('top', 'anime-top-row');

    await fetchAndRenderAnime('new', 'anime-new-row');
    
    // GogoAnime API is currently down/unstable. 
    // fetchGogoRecentEpisodes(); // Disabled to prevent UI errors

    loadedContent.anime = true;
}

async function fetchAndRenderAnime(category, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="skeleton-container" style="display:flex; gap:20px;">' + Array(6).fill('<div class="movie-card skeleton" style="height:250px; width:160px; flex-shrink:0;"></div>').join('') + '</div>';

    let movieUrl, tvUrl;
    
    if (category === 'trending') {
        movieUrl = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`;
        tvUrl = `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`;
    } else if (category === 'popular') {
        movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc`;
        tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc`;
    } else if (category === 'new') {
        movieUrl = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}`;
        tvUrl = `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}`;
    }

    try {
        const [movieRes, tvRes] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
        const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()]);

        const animeMovies = (movieData.results || []).filter(item => {
            // Trending & New need extra filtering. Popular (discover) is already filtered.
            if (category === 'popular') return true;
            const isAnimation = item.genre_ids && item.genre_ids.includes(16);
            // Some trending don't have origin_country in the list result, might need to assume or check further
            // For discovery/trending, genre is a better indicator, but user asked for JP
            // Actually trending/movie doesn't have origin_country usually in the list.
            return isAnimation; 
        });

        const animeTV = (tvData.results || []).filter(item => {
            if (category === 'popular') return true;
            const isAnimation = item.genre_ids && item.genre_ids.includes(16);
            const isJP = item.origin_country && item.origin_country.includes('JP');
            return isAnimation && isJP;
        });

        // Merge and sort
        let combined = [...animeMovies.map(m => ({...m, media_type: 'movie'})), ...animeTV.map(t => ({...t, media_type: 'tv'}))];
        combined.sort((a, b) => b.popularity - a.popularity);

        container.innerHTML = "";
        
        if (combined.length === 0) {
            container.innerHTML = '<p class="empty-list-msg">No anime found in this category.</p>';
            return;
        }

        combined.forEach(item => {
            const card = createContentCard(item, item.media_type);
            container.appendChild(card);
        });

    } catch (error) {
        console.error(`Error loading ${category} anime:`, error);
        container.innerHTML = '<p class="error-msg">Error loading content.</p>';
    }
}

async function fetchAndRenderJikan(category, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<div class="skeleton-container" style="display:flex; gap:20px;">' + Array(6).fill('<div class="movie-card skeleton" style="height:250px; width:160px; flex-shrink:0;"></div>').join('') + '</div>';

    let url = category === 'seasonal' ? `${JIKAN_BASE_URL}/seasons/now` : `${JIKAN_BASE_URL}/top/anime`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data.data || [];

        container.innerHTML = "";
        
        if (results.length === 0) {
            container.innerHTML = '<p class="empty-list-msg">No results from MAL.</p>';
            return;
        }

        results.slice(0, 15).forEach(item => {
            const card = createJikanCard(item);
            container.appendChild(card);
        });
    } catch (error) {
        console.error(`Jikan ${category} error:`, error);
        container.innerHTML = '<p class="error-msg">Failed to load MyAnimeList data.</p>';
    }
}

function createJikanCard(item) {
    const card = document.createElement("div");
    card.className = "movie-card";

    const title = item.title_english || item.title;
    const rating = item.score || "N/A";
    const year = item.year || (item.aired && item.aired.prop && item.aired.prop.from.year) || "N/A";
    const posterPath = item.images && item.images.jpg && item.images.jpg.image_url;

    card.innerHTML = `
        <img src="${posterPath}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
        <div class="card-overlay">
            <div class="card-info">
                <h3>${title}</h3>
                <p>${year} | <i class="fas fa-star" style="color: gold;"></i> ${rating}</p>
            </div>
        </div>
        <div class="mal-badge" style="position:absolute; top:10px; left:10px; background:rgba(0,0,255,0.7); color:#fff; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:bold;">MAL</div>
    `;

    card.addEventListener("click", () => {
        handleJikanClick(item);
    });

    return card;
}

async function handleJikanClick(item) {
    const title = item.title_english || item.title;
    console.log(`Bridging Jikan title to TMDB: ${title}`);
    
    // Show a small "Locating content..." toast if possible, or just wait
    // Search TMDB
    try {
        const query = encodeURIComponent(title);
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();
        
        // Find best match in animation genre
        const match = data.results.find(res => {
            return (res.genre_ids && res.genre_ids.includes(16)) || (res.media_type === 'tv' || res.media_type === 'movie');
        }) || data.results[0];

        if (match) {
            openModal(match, match.media_type);
        } else {
            alert(`Sorry, we couldn't find matching streaming sources for "${title}" in our database.`);
        }
    } catch (error) {
        console.error("Bridge search error:", error);
    }
}

// --- Expanded Anime Content ---

function switchAnimeTab(tab, btn) {
    // Update Tab UI
    const container = btn.parentElement;
    container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Toggle Content Containers
    document.getElementById('anime-overview-content').style.display = tab === 'overview' ? 'block' : 'none';
    document.getElementById('anime-upcoming-content').style.display = tab === 'upcoming' ? 'block' : 'none';
    document.getElementById('anime-collections-content').style.display = tab === 'collections' ? 'block' : 'none';

    // Trigger Loads
    if (tab === 'upcoming') fetchAnimeUpcoming();
    if (tab === 'collections') fetchAnimeCollections();
}

async function fetchAnimeUpcoming() {
    const grid = document.getElementById("anime-upcoming-grid");
    if (grid.children.length > 0 && !grid.querySelector('.skeleton')) return; // Already loaded

    grid.innerHTML = Array(12).fill('<div class="movie-card skeleton" style="height:250px;"></div>').join('');

    try {
        const response = await fetch(`${JIKAN_BASE_URL}/seasons/upcoming`);
        const data = await response.json();
        const results = data.data || [];

        grid.innerHTML = "";
        results.slice(0, 24).forEach(item => {
            const card = createJikanCard(item);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Upcoming Anime error:", error);
        grid.innerHTML = '<p class="error-msg">Failed to load upcoming anime.</p>';
    }
}

async function fetchAnimeCollections() {
    // Only load if not already loaded
    if (loadedContent.animeCollections) return;

    // Endpoints provided by user
    const collectionMap = [
        { id: 'anime-ona-row', url: `${JIKAN_BASE_URL}/top/anime?type=ona`, name: 'ONA' },
        { id: 'anime-movies-row', url: `${JIKAN_BASE_URL}/top/anime?type=movie`, name: 'Movies' },
        { id: 'anime-bleach-row', url: `${JIKAN_BASE_URL}/anime?q=bleach&sfw`, name: 'Bleach' },
        { id: 'anime-evangelion-row', url: `${JIKAN_BASE_URL}/anime?q=%E6%96%B0%E4%B8%96%E7%B4%80&sfw`, name: 'Evangelion' },
        { id: 'anime-2012-row', url: `${JIKAN_BASE_URL}/seasons/2012/spring?sfw`, name: 'Spring 2012' }
    ];

    // Mark as starting to load
    loadedContent.animeCollections = true;

    // Fetch sequentially to respect Jikan rate limits (2 req/s)
    for (const collection of collectionMap) {
        const row = document.getElementById(collection.id);
        if (!row) continue;
        
        row.innerHTML = '<div class="skeleton-container" style="display:flex; gap:20px;">' + Array(6).fill('<div class="movie-card skeleton" style="height:250px; width:160px; flex-shrink:0;"></div>').join('') + '</div>';
        
        try {
            const response = await fetch(collection.url);
            if (response.status === 429) {
                console.warn(`Rate limited for ${collection.name}, retrying in 1s...`);
                await new Promise(r => setTimeout(r, 1000));
                // One retry
                const retryRes = await fetch(collection.url);
                var data = await retryRes.json();
            } else {
                var data = await response.json();
            }
            
            const results = data.data || [];

            row.innerHTML = "";
            if (results.length === 0) {
                row.innerHTML = '<p class="empty-list-msg">No results found for this collection.</p>';
            } else {
                results.slice(0, 15).forEach(item => {
                    const card = createJikanCard(item);
                    row.appendChild(card);
                });
            }
            
            // Small delay between requests to be safe
            await new Promise(r => setTimeout(r, 500));
            
        } catch (error) {
            console.error(`Collection ${collection.id} error:`, error);
            row.innerHTML = '<p class="error-msg">Failed to load collection. API rate limit may have been reached.</p>';
        }
    }
}
// --- GogoAnime Integration ---

async function fetchGogoRecentEpisodes() {
    const row = document.getElementById("anime-gogo-recent");
    if (!row) return;

    row.innerHTML = '<div class="skeleton-container" style="display:flex; gap:20px;">' + Array(6).fill('<div class="movie-card skeleton" style="height:250px; width:160px; flex-shrink:0;"></div>').join('') + '</div>';

    try {
        const response = await fetch(`${GOGO_API_URL}/recent-release`);
        const data = await response.json();
        
        // Data usually comes as array directly or inside key. Adjusting based on standard GogoAPI.
        // Usually [ { episodeId, episodeNum, animeImg, animeTitle, ... }, ... ]
        const results = Array.isArray(data) ? data : (data.results || []);

        row.innerHTML = "";
        if (results.length === 0) {
            row.innerHTML = '<p class="empty-list-msg">No recent episodes found.</p>';
            return;
        }

        results.slice(0, 15).forEach(item => {
            const card = createGogoCard(item);
            row.appendChild(card);
        });
    } catch (error) {
        console.error("GogoAnime Recent Error:", error);
        row.innerHTML = '<p class="error-msg">Failed to load recent episodes.</p>';
    }
}

function createGogoCard(item) {
    const card = document.createElement("div");
    card.className = "movie-card";

    const title = item.animeTitle;
    const epNum = item.episodeNum;
    const poster = item.animeImg;
    const epId = item.episodeId; // used to watch directly

    card.innerHTML = `
        <img src="${poster}" alt="${title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
        <div class="card-overlay">
            <div class="card-info">
                <h3>${title}</h3>
                <p>Episode ${epNum}</p>
            </div>
        </div>
        <div class="mal-badge" style="position:absolute; top:10px; left:10px; background:rgba(229, 9, 20, 0.8); color:#fff; padding:2px 5px; border-radius:3px; font-size:10px; font-weight:bold;">NEW EP</div>
    `;

    card.addEventListener("click", () => {
        bridgeGogoToTMDB(title, epId);
    });

    return card;
}

// Bridge Gogo item to TMDB Modal
async function bridgeGogoToTMDB(gogoTitle, episodeId) {
    // 1. Search TMDB
    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(gogoTitle)}`);
        const data = await res.json();
        const match = data.results && data.results.find(r => r.media_type==='tv' || r.media_type==='movie');

        if (match) {
            openModal(match, match.media_type);
            setTimeout(() => loadGogoPlayer(episodeId), 500);
        } else {
            alert("Could not find TMDB details for this anime.");
        }
    } catch (e) {
        console.error("Bridge Error", e);
    }
}

async function fetchGogoAnimeData(title) {
    const container = document.getElementById("anime-episode-container");
    const list = document.getElementById("episode-list");
    
    // Clean title for better search
    // Remove year from title if present (e.g. "Title (2024)") could confuse gogo search
    const cleanTitle = title.replace(/\(\d{4}\)/, '').trim();

    try {
        const response = await fetch(`${GOGO_API_URL}/search?keyw=${encodeURIComponent(cleanTitle)}`);
        const data = await response.json();
        
        if (!data || data.length === 0) return; // No match found

        // Take first match
        const animeId = data[0].animeId;
        
        // Fetch Details to get Episode List
        const detailsRes = await fetch(`${GOGO_API_URL}/anime-details/${animeId}`);
        const detailsData = await detailsRes.json();
        
        if (detailsData && detailsData.episodesList && detailsData.episodesList.length > 0) {
            // Show Container
            if (container) {
                container.style.display = "block";
                list.innerHTML = "";
                
                const sortedEps = detailsData.episodesList.sort((a, b) => a.episodeNum - b.episodeNum);

                sortedEps.forEach(ep => {
                    const btn = document.createElement("button");
                    btn.className = "btn-episode"; 
                    btn.innerText = `Ep ${ep.episodeNum}`;
                    btn.style.cssText = "padding: 8px 12px; background: #333; border: 1px solid #444; color: #fff; cursor: pointer; border-radius: 4px; font-weight: bold; transition: background 0.2s;";
                    btn.onmouseover = () => btn.style.background = "#555";
                    btn.onmouseout = () => btn.style.background = "#333";
                    btn.onclick = () => {
                        // Highlight active
                        list.querySelectorAll('.btn-episode').forEach(b => b.style.borderColor = '#444');
                        btn.style.borderColor = 'var(--netflix-red)';
                        loadGogoPlayer(ep.episodeId);
                    };
                    list.appendChild(btn);
                });
            }
        }

    } catch (error) {
        console.error("GogoAnime Search/Details Error:", error);
    }
}

async function loadGogoPlayer(episodeId) {
    const playerWrapper = document.getElementById("anime-player-wrapper");
    const player = document.getElementById("anime-player");
    
    if (playerWrapper && player) {
        playerWrapper.style.display = "block";
        playerWrapper.scrollIntoView({ behavior: 'smooth' });
        
        try {
            const res = await fetch(`${GOGO_API_URL}/vidcdn-watch/${episodeId}`);
            const data = await res.json();
            
            const streamUrl = data.Referer || data.link; 
            
            if (streamUrl) {
                player.src = streamUrl;
            } else {
                alert("Stream link not found.");
            }
            
        } catch (e) {
            console.error("Player Load Error", e);
            alert("Error loading player source.");
        }
    }
}

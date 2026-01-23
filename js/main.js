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

// Endpoints
const ENDPOINTS = {
  trending: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`,
  popular: `${BASE_URL}/movie/popular?api_key=${API_KEY}`,
  search: `${BASE_URL}/search/multi?api_key=${API_KEY}`,
  tvTrending: `${BASE_URL}/trending/tv/week?api_key=${API_KEY}`,
  tvPopular: `${BASE_URL}/tv/popular?api_key=${API_KEY}`,
};

// Global State
let searchTimeout = null;
const loadedContent = {
    movies: false,
    tv: false
};

// Wait for DOM to Load
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  handleNavbarScroll();
  setupModalListeners();
  setupSearch();
  setupNavigation();
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

  navMyList.addEventListener("click", (e) => {
    e.preventDefault();
    showView("mylist");
    setActiveLink(navMyList);
    renderMyList();
  });
}

function showView(viewName) {
  const homeContent = document.getElementById("homepage-content");
  const tvContent = document.getElementById("tv-shows-view");
  const searchView = document.getElementById("search-view");
  const mylistView = document.getElementById("mylist-view");

  homeContent.style.display = viewName === "homepage" ? "block" : "none";
  tvContent.style.display = viewName === "tv" ? "block" : "none";
  searchView.style.display = viewName === "search" ? "block" : "none";
  mylistView.style.display = viewName === "mylist" ? "block" : "none";

  if (viewName === "homepage" || viewName === "tv") {
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
        const sourcesRes = await fetch(`${WATCHMODE_BASE_URL}/title/${bestMatch.id}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=US`);
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

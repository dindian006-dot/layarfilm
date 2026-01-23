// Movie Data
const movies = [
    {
        id: 1,
        title: "The Cosmos",
        image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=80",
        category: "popular"
    },
    {
        id: 2,
        title: "Deep Sea",
        image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=400&q=80",
        category: "popular"
    },
    {
        id: 3,
        title: "Cyber City",
        image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=400&q=80",
        category: "popular"
    },
    {
        id: 4,
        title: "Infinite",
        image: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=400&q=80",
        category: "popular"
    },
    {
        id: 5,
        title: "Wild Life",
        image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=400&q=80",
        category: "trending"
    },
    {
        id: 6,
        title: "Mountain Peak",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
        category: "trending"
    },
    {
        id: 7,
        title: "Night Sky",
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80",
        category: "trending"
    },
    {
        id: 8,
        title: "Ocean Wave",
        image: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=400&q=80",
        category: "trending"
    },
    {
        id: 9,
        title: "The Master",
        image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80",
        category: "top-rated"
    },
    {
        id: 10,
        title: "Inception",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80",
        category: "top-rated"
    },
    {
        id: 11,
        title: "The Knight",
        image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80",
        category: "top-rated"
    },
    {
        id: 12,
        title: "Legacy",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80",
        category: "top-rated"
    }
];

// Wait for DOM to Load
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    handleNavbarScroll();
});

// Initialize Application
function initApp() {
    renderMovies('popular', 'popular-row');
    renderMovies('trending', 'trending-row');
    renderMovies('top-rated', 'top-rated-row');
}

// Render Movie Card
function renderMovies(category, containerId) {
    const container = document.getElementById(containerId);
    const filteredMovies = movies.filter(movie => movie.category === category);

    filteredMovies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}">
        `;
        
        movieCard.addEventListener('click', () => {
            alert(`Opening ${movie.title}...`);
        });

        container.appendChild(movieCard);
    });
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

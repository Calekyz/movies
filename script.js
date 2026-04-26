// ============================================
// CINEMASCOPE - Professional Movie Discovery App
// Powered by TMDB API
// ============================================

// API Configuration
const API_KEY = 'aa266958da231c94e3be97fae71f5f76';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';

// App State
let currentCategory = 'popular';
let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = '';
let isSearchMode = false;

// DOM Elements
const moviesGrid = document.getElementById('moviesGrid');
const sectionTitle = document.getElementById('sectionTitle');
const sectionIcon = document.getElementById('sectionIcon');
const movieCount = document.getElementById('movieCount');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modal = document.getElementById('movieModal');
const closeModal = document.querySelector('.close-modal');

// Category Configurations
const categories = {
    popular: {
        title: 'Popular Movies',
        icon: 'fa-fire',
        endpoint: '/movie/popular'
    },
    now_playing: {
        title: 'Now Playing',
        icon: 'fa-ticket-alt',
        endpoint: '/movie/now_playing'
    },
    top_rated: {
        title: 'Top Rated Movies',
        icon: 'fa-star',
        endpoint: '/movie/top_rated'
    },
    upcoming: {
        title: 'Upcoming Movies',
        icon: 'fa-calendar',
        endpoint: '/movie/upcoming'
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadMovies();
});

// Setup Event Listeners
function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            switchCategory(category);
        });
    });

    // Search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Pagination
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));

    // Modal
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Switch Category
function switchCategory(category) {
    currentCategory = category;
    currentPage = 1;
    isSearchMode = false;
    currentSearchQuery = '';
    searchInput.value = '';
    
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Update section header
    const cat = categories[category];
    sectionTitle.textContent = cat.title;
    sectionIcon.className = `fas ${cat.icon}`;
    
    loadMovies();
}

// Perform Search
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    currentSearchQuery = query;
    currentPage = 1;
    isSearchMode = true;
    
    sectionTitle.textContent = `Search Results: "${query}"`;
    sectionIcon.className = 'fas fa-search';
    
    // Remove active from category buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    loadMovies(true);
}

// Load Movies
async function loadMovies(isSearch = false) {
    showLoading();
    
    try {
        let url;
        if (isSearch && currentSearchQuery) {
            url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentSearchQuery)}&page=${currentPage}&language=en-US`;
        } else {
            const cat = categories[currentCategory];
            url = `${BASE_URL}${cat.endpoint}?api_key=${API_KEY}&page=${currentPage}&language=en-US`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            totalPages = Math.min(data.total_pages, 500);
            movieCount.textContent = `${data.total_results} movies found`;
            displayMovies(data.results);
            updatePagination();
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error loading movies:', error);
        showError();
    }
}

// Display Movies
function displayMovies(movies) {
    moviesGrid.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
}

// Create Movie Card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => showMovieDetails(movie.id);
    
    const posterPath = movie.poster_path 
        ? `${IMAGE_BASE_URL}${POSTER_SIZE}${movie.poster_path}`
        : null;
    
    const rating = (movie.vote_average * 10).toFixed(0);
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const title = movie.title || movie.name || 'Untitled';
    
    card.innerHTML = `
        <div class="movie-poster">
            ${posterPath 
                ? `<img src="${posterPath}" alt="${title}" loading="lazy">`
                : `<div class="no-poster"><i class="fas fa-film"></i></div>`
            }
            <div class="movie-rating">
                <i class="fas fa-star"></i>
                <span>${rating}%</span>
            </div>
        </div>
        <div class="movie-info">
            <div class="movie-title">${title.length > 40 ? title.substring(0, 37) + '...' : title}</div>
            <div class="movie-year"><i class="far fa-calendar-alt"></i> ${year}</div>
        </div>
    `;
    
    return card;
}

// Show Movie Details Modal
async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,similar`);
        const movie = await response.json();
        
        const posterPath = movie.poster_path 
            ? `${IMAGE_BASE_URL}${POSTER_SIZE}${movie.poster_path}`
            : null;
        
        const backdropPath = movie.backdrop_path
            ? `${IMAGE_BASE_URL}${BACKDROP_SIZE}${movie.backdrop_path}`
            : null;
        
        const rating = (movie.vote_average * 10).toFixed(0);
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
        
        // Get top 5 cast members
        const cast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'N/A';
        
        // Get genres
        const genres = movie.genres?.map(genre => genre.name).join(', ') || 'N/A';
        
        document.getElementById('modalTitle').innerHTML = `
            ${movie.title}
            <span style="font-size: 1rem; color: #999; margin-left: 0.5rem;">(${releaseYear})</span>
        `;
        
        document.getElementById('modalBody').innerHTML = `
            <div class="modal-movie-info">
                ${posterPath ? `
                    <div class="modal-poster">
                        <img src="${posterPath}" alt="${movie.title}">
                    </div>
                ` : ''}
                <div class="modal-details">
                    <p><strong><i class="fas fa-star" style="color: #ffd700;"></i> Rating:</strong> ${rating}% (${movie.vote_count.toLocaleString()} votes)</p>
                    <p><strong><i class="fas fa-clock"></i> Runtime:</strong> ${runtime}</p>
                    <p><strong><i class="fas fa-tags"></i> Genres:</strong> ${genres}</p>
                    <p><strong><i class="fas fa-users"></i> Cast:</strong> ${cast}</p>
                    <p><strong><i class="fas fa-chart-line"></i> Popularity:</strong> ${Math.round(movie.popularity)}</p>
                    <p><strong><i class="fas fa-align-left"></i> Overview:</strong></p>
                    <p>${movie.overview || 'No overview available.'}</p>
                    ${movie.homepage ? `<p><strong><i class="fas fa-globe"></i> Website:</strong> <a href="${movie.homepage}" target="_blank" style="color: #e50914;">Visit Official Site</a></p>` : ''}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading movie details:', error);
        alert('Unable to load movie details. Please try again.');
    }
}

// Update Pagination
function updatePagination() {
    currentPageSpan.textContent = currentPage;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Change Page
function changePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        if (isSearchMode) {
            loadMovies(true);
        } else {
            loadMovies();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Show Loading State
function showLoading() {
    moviesGrid.innerHTML = `
        <div class="loading">
            <div class="loader"></div>
            <p>Loading amazing movies...</p>
        </div>
    `;
}

// Show No Results
function showNoResults() {
    moviesGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-film" style="font-size: 3rem; color: #e50914; margin-bottom: 1rem; display: block;"></i>
            <p>No movies found. Try a different search!</p>
        </div>
    `;
    movieCount.textContent = '0 movies found';
}

// Show Error
function showError() {
    moviesGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e50914; margin-bottom: 1rem; display: block;"></i>
            <p>Oops! Something went wrong. Please check your API key or try again later.</p>
        </div>
    `;
}

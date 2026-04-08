const API_KEY = "3fcb5792bd86636fb93f8d5fa159d32e";
let allMovies = []; 
let filteredMovies = []; 
let currentPage = 1;
let isFetching = false;
let showingFavs = false;


const moviesContainer = document.getElementById("movies");
const loadingIndicator = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const sortSelect = document.getElementById("sortSelect");
const themeToggle = document.getElementById("themeToggle");
const showFavsBtn = document.getElementById("showFavsBtn");
const noResultsInfo = document.getElementById("noResults");
const loaderTarget = document.getElementById("loaderTarget");


let favorites = JSON.parse(localStorage.getItem('cineFavs')) || [];
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");


function init() {
    initTheme();
    setupEventListeners();
    fetchInitialMovies();
}


function initTheme() {
    const savedTheme = localStorage.getItem('cineTheme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('cineTheme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});


async function fetchMovies(page = 1) {
    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&page=${page}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error("Error fetching movies:", error);
        return [];
    }
}


async function fetchInitialMovies() {
    loadingIndicator.classList.remove("hidden");
    

    const pagesToFetch = [1, 2, 3];
    const fetchPromises = pagesToFetch.map(page => fetchMovies(page));
    const results = await Promise.all(fetchPromises);
    

    allMovies = results.reduce((acc, curr) => acc.concat(curr), []);
    

    allMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex((t) => t.id === movie.id)
    );
    
    filteredMovies = [...allMovies];
    

    setupInfiniteScroll();

    loadingIndicator.classList.add("hidden");
    moviesContainer.classList.remove("hidden");
    
    applyFiltersAndSort();
}


function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}


function setupEventListeners() {
    searchInput.addEventListener("input", debounce(applyFiltersAndSort, 500));
    filterSelect.addEventListener("change", applyFiltersAndSort);
    sortSelect.addEventListener("change", applyFiltersAndSort);
    showFavsBtn.addEventListener("click", toggleFavsView);
}

function toggleFavsView() {
    showingFavs = !showingFavs;
    if (showingFavs) {
        showFavsBtn.classList.add("active");
        searchInput.value = '';
        searchInput.disabled = true;
        filterSelect.disabled = true;
    } else {
        showFavsBtn.classList.remove("active");
        searchInput.disabled = false;
        filterSelect.disabled = false;
    }
    applyFiltersAndSort();
}


function applyFiltersAndSort() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    const sortValue = sortSelect.value;

    let sourceArray = showingFavs 
        ? allMovies.filter(movie => favorites.includes(movie.id))
        : allMovies;

    let processedMovies = sourceArray.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm)
    );


    if (filterValue !== "all") {
        processedMovies = processedMovies.filter(movie => {
            if (filterValue === "high") return movie.vote_average >= 8;
            if (filterValue === "medium") return movie.vote_average >= 5 && movie.vote_average < 8;
            if (filterValue === "low") return movie.vote_average < 5;
            return true;
        });
    }


    if (sortValue !== "default") {
        processedMovies = processedMovies.sort((a, b) => {
            switch (sortValue) {
                case "ratingDesc":
                    return b.vote_average - a.vote_average;
                case "ratingAsc":
                    return a.vote_average - b.vote_average;
                case "titleAsc":
                    return a.title.localeCompare(b.title);
                case "titleDesc":
                    return b.title.localeCompare(a.title);
                case "dateDesc":
                    return new Date(b.release_date) - new Date(a.release_date);
                case "dateAsc":
                    return new Date(a.release_date) - new Date(b.release_date);
                default:
                    return 0;
            }
        });
    }

    filteredMovies = processedMovies;
    renderMovies(filteredMovies);
}


function renderMovies(moviesArray) {
    if (moviesArray.length === 0) {
        moviesContainer.classList.add("hidden");
        noResultsInfo.classList.remove("hidden");
        moviesContainer.innerHTML = "";
        return;
    }

    noResultsInfo.classList.add("hidden");
    moviesContainer.classList.remove("hidden");


    moviesContainer.innerHTML = "";


    const htmlString = moviesArray.map(movie => {
        const isFav = favorites.includes(movie.id);
        const posterUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Poster';
            
        return `
            <div class="movie-card" data-id="${movie.id}">
                <div class="movie-poster-container">
                    <img src="${posterUrl}" alt="${movie.title}" loading="lazy">
                    <div class="overlay">
                        <p class="overview-text">${movie.overview || "No overview available."}</p>
                    </div>
                </div>
                <div class="movie-info">
                    <h3 class="movie-title" title="${movie.title}">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="rating"><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</span>
                        <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                        <button class="like-btn ${isFav ? 'liked' : ''}" aria-label="Like" data-action="favorite">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join(""); 
    
    moviesContainer.innerHTML = htmlString;
}


moviesContainer.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action="favorite"]');
    if (!btn) return;

    const card = btn.closest('.movie-card');
    const movieId = parseInt(card.dataset.id);


    if (favorites.includes(movieId)) {
        favorites = favorites.filter(id => id !== movieId); 
        btn.classList.remove('liked');
        btn.querySelector('i').classList.replace('fas', 'far');
        
        if (showingFavs) {
            applyFiltersAndSort();
        }
    } else {
        favorites.push(movieId);
        btn.classList.add('liked');
        btn.querySelector('i').classList.replace('far', 'fas');
    }
    

    localStorage.setItem('cineFavs', JSON.stringify(favorites));
});


function setupInfiniteScroll() {
    const observer = new IntersectionObserver(async (entries) => {
        if (entries[0].isIntersecting && !isFetching && searchInput.value === '' && filterSelect.value === 'all' && sortSelect.value === 'default' && !showingFavs) {
            isFetching = true;
            currentPage++;
            const newMovies = await fetchMovies(currentPage+2); 
            if (newMovies.length > 0) {
                allMovies = [...allMovies, ...newMovies];
                applyFiltersAndSort();
            }
            isFetching = false;
        }
    }, { rootMargin: '100px' });

    observer.observe(loaderTarget);
}


init();
// TCG Marketplace - Complete Redesign with Animations
const API_BASE = '';
let currentPage = 1;
let currentQuery = '';
let currentSet = '';
let currentGame = 'pokemon';
let games = [];
let currentView = 'grid';
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const setFilter = document.getElementById('setFilter');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('results');
const paginationContainer = document.getElementById('pagination');
const featuredCardsContainer = document.getElementById('featuredCards');
const featuredSection = document.getElementById('featuredSection');
const recentSection = document.getElementById('recentSection');
const recentCardsContainer = document.getElementById('recentCards');
const heroGameText = document.getElementById('heroGameText');
const footerText = document.getElementById('footerText');
const loadingScreen = document.getElementById('loadingScreen');
const mobileMenu = document.getElementById('mobileMenu');
const themeToggle = document.getElementById('themeToggle');

// Popular cards by game
const POPULAR_CARDS = {
  pokemon: [
    'Charizard', 'Pikachu', 'Mewtwo', 'Rayquaza', 'Umbreon', 
    'Lugia', 'Gengar', 'Eevee', 'Snorlax', 'Blastoise'
  ],
  onepiece: [
    'Luffy', 'Zoro', 'Nami', 'Sanji', 'Shanks', 
    'Gol D. Roger', 'Usopp', 'Chopper', 'Robin', 'Ace'
  ]
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // Show loading screen
  showLoading();
  
  // Load theme
  loadTheme();
  
  // Load games
  await loadGames();
  
  // Setup game switcher
  setupGameSwitcher();
  
  // Load sets
  await loadSets();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup view toggle
  setupViewToggle();
  
  // Setup filter chips
  setupFilterChips();
  
  // Setup mobile menu
  setupMobileMenu();
  
  // Setup theme toggle
  setupThemeToggle();
  
  // Load recently viewed
  loadRecentlyViewed();
  
  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const game = params.get('game');
  
  if (game && games.find(g => g.id === game)) {
    switchGame(game, false);
  }
  
  if (query) {
    searchInput.value = query;
    await performSearch(query);
    featuredSection.style.display = 'none';
  } else {
    await loadFeaturedCards();
  }
  
  // Hide loading screen
  setTimeout(hideLoading, 500);
}

// Loading Screen
function showLoading() {
  loadingScreen.classList.remove('hidden');
}

function hideLoading() {
  loadingScreen.classList.add('hidden');
}

// Theme Management
function loadTheme() {
  const theme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
  showToast(`Switched to ${next} mode`, 'info');
}

function updateThemeIcon(theme) {
  if (themeToggle) {
    themeToggle.innerHTML = `<span>${theme === 'dark' ? '☀️' : '🌙'}</span>`;
  }
}

function setupThemeToggle() {
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Mobile Menu
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const closeMenu = document.getElementById('closeMenu');
  
  menuToggle?.addEventListener('click', () => {
    mobileMenu.classList.add('active');
  });
  
  closeMenu?.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
  });
  
  mobileMenu?.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.classList.remove('active');
    }
  });
}

// Load Games
async function loadGames() {
  try {
    const response = await fetch(`${API_BASE}/api/games`);
    games = await response.json();
  } catch (error) {
    games = [
      { id: 'pokemon', name: 'Pokemon TCG', icon: '⚡', enabled: true },
      { id: 'onepiece', name: 'One Piece', icon: '☠️', enabled: true }
    ];
  }
}

// Game Switcher
function setupGameSwitcher() {
  const gamePills = document.querySelectorAll('.game-pill');
  
  gamePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const game = pill.dataset.game;
      switchGame(game);
      
      gamePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });
}

function switchGame(game, animate = true) {
  if (game === currentGame) return;
  
  currentGame = game;
  currentPage = 1;
  currentQuery = '';
  currentSet = '';
  
  // Update UI
  updateGameUI();
  
  // Clear search
  searchInput.value = '';
  resultsSection.classList.add('hidden');
  featuredSection.style.display = 'block';
  
  // Reload sets
  loadSets();
  
  // Load featured cards
  loadFeaturedCards();
  
  // Update URL
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('game', game);
  window.history.pushState({}, '', newUrl);
  
  if (animate) {
    showToast(`Switched to ${getGameName(game)}`, 'info');
  }
}

function updateGameUI() {
  const game = games.find(g => g.id === currentGame);
  if (!game) return;
  
  // Update hero badge
  if (heroGameText) {
    heroGameText.textContent = game.name;
  }
  
  // Update search placeholder
  const placeholderText = currentGame === 'pokemon' 
    ? 'Search for a Pokemon card (e.g., Charizard, Pikachu)...'
    : 'Search for a One Piece card (e.g., Luffy, Zoro, Shanks)...';
  searchInput.placeholder = placeholderText;
  
  // Update footer
  if (footerText) {
    if (currentGame === 'pokemon') {
      footerText.innerHTML = 'Powered by <a href="https://pokemontcg.io/" target="_blank">Pokemon TCG API</a>';
    } else {
      footerText.innerHTML = 'One Piece Card Game data is sample data for demonstration.';
    }
  }
}

function getGameName(gameId) {
  const game = games.find(g => g.id === gameId);
  return game ? game.name : gameId;
}

// View Toggle
function setupViewToggle() {
  const viewBtns = document.querySelectorAll('.view-btn');
  
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      currentView = view;
      
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      resultsContainer.className = view === 'grid' ? 'results-grid' : 'results-list';
      
      // Re-render if we have results
      if (currentQuery) {
        performSearch(currentQuery);
      }
    });
  });
}

// Filter Chips
function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const filter = chip.dataset.filter;
      applyFilter(filter);
    });
  });
}

function applyFilter(filter) {
  // This would filter the current results
  // For now, just show a toast
  showToast(`Filter: ${filter} (coming soon)`, 'info');
}

// Event Listeners
function setupEventListeners() {
  // Search
  searchBtn?.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1;
      performSearch(query);
      featuredSection.style.display = 'none';
      resultsSection.classList.remove('hidden');
    }
  });

  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1;
        performSearch(query);
        featuredSection.style.display = 'none';
        resultsSection.classList.remove('hidden');
      }
    }
  });

  // Set filter
  setFilter?.addEventListener('change', (e) => {
    currentSet = e.target.value;
    if (currentQuery) {
      currentPage = 1;
      performSearch(currentQuery);
    }
  });

  // Refresh featured
  document.getElementById('refreshFeatured')?.addEventListener('click', () => {
    const btn = document.getElementById('refreshFeatured');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => btn.style.transform = '', 500);
    loadFeaturedCards();
    showToast('Featured cards refreshed', 'success');
  });
}

// Load Sets
async function loadSets() {
  try {
    setFilter.innerHTML = '<option value="">📦 All Sets</option>';
    
    const response = await fetch(`${API_BASE}/api/${currentGame}/sets`);
    const data = await response.json();
    
    data.data.forEach(set => {
      const option = document.createElement('option');
      option.value = set.id;
      option.textContent = `📦 ${set.name}`;
      setFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load sets:', error);
  }
}

// Load Featured Cards
async function loadFeaturedCards() {
  featuredCardsContainer.innerHTML = `
    <div class="skeleton-grid">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
  `;
  
  try {
    const popularCards = POPULAR_CARDS[currentGame] || POPULAR_CARDS.pokemon;
    const shuffled = [...popularCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    const cardPromises = selected.map(async (cardName) => {
      try {
        const response = await fetch(
          `${API_BASE}/api/${currentGame}/cards/search?q=${encodeURIComponent(cardName)}&pageSize=5`
        );
        const data = await response.json();
        if (data.cards?.length > 0) {
          return data.cards[Math.floor(Math.random() * data.cards.length)];
        }
      } catch (e) {
        console.error(`Failed to load ${cardName}:`, e);
      }
      return null;
    });
    
    const cards = (await Promise.all(cardPromises)).filter(c => c !== null);
    
    if (cards.length === 0) {
      featuredCardsContainer.innerHTML = '<p class="placeholder">Could not load featured cards</p>';
      return;
    }
    
    featuredCardsContainer.innerHTML = '';
    cards.forEach((card, index) => {
      const cardElement = createCardElement(card, true);
      cardElement.style.animationDelay = `${index * 0.1}s`;
      featuredCardsContainer.appendChild(cardElement);
    });
  } catch (error) {
    console.error('Failed to load featured cards:', error);
    featuredCardsContainer.innerHTML = '<p class="placeholder">Could not load featured cards</p>';
  }
}

// Perform Search
async function performSearch(query) {
  currentQuery = query;
  searchStatus.innerHTML = '<span class="loading"></span> Searching...';
  resultsContainer.innerHTML = '';
  
  // Add skeleton loading
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    resultsContainer.appendChild(skeleton);
  }
  
  paginationContainer.innerHTML = '';

  try {
    let url = `${API_BASE}/api/${currentGame}/cards/search?q=${encodeURIComponent(query)}&page=${currentPage}`;
    if (currentSet) {
      url = `${API_BASE}/api/${currentGame}/sets/${currentSet}/cards?page=${currentPage}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    displayResults(data);
    displayPagination(data);
    
    // Update URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('q', query);
    newUrl.searchParams.set('game', currentGame);
    window.history.pushState({}, '', newUrl);
    
    showToast(`Found ${data.totalCount} cards`, 'success');
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `<div class="placeholder">Error: ${error.message}</div>`;
    searchStatus.textContent = '';
    showToast('Search failed', 'error');
  }
}

// Display Results
function displayResults(data) {
  if (!data.cards?.length) {
    resultsContainer.innerHTML = '<div class="placeholder">No cards found. Try a different search.</div>';
    searchStatus.textContent = '0 results found';
    return;
  }

  searchStatus.textContent = `${data.totalCount} cards found`;
  resultsContainer.innerHTML = '';
  resultsContainer.className = currentView === 'grid' ? 'results-grid' : 'results-list';

  data.cards.forEach((card, index) => {
    const cardElement = createCardElement(card);
    cardElement.style.animationDelay = `${index * 0.05}s`;
    resultsContainer.appendChild(cardElement);
  });
}

// Create Card Element
function createCardElement(card, isFeatured = false) {
  const cardDiv = document.createElement('div');
  cardDiv.className = `card ${isFeatured ? 'featured-card' : ''}`;
  
  const game = card.game || currentGame;
  cardDiv.addEventListener('click', () => {
    addToRecentlyViewed(card);
    window.location.href = `/card.html?id=${card.id}&game=${game}`;
  });

  const prices = card.tcgplayer?.prices || {};
  const marketPrice = prices.normal?.market || prices.holofoil?.market;
  const lowPrice = prices.normal?.low || prices.holofoil?.low;
  const highPrice = prices.normal?.high || prices.holofoil?.high;

  const rarityClass = getRarityClass(card.rarity);

  cardDiv.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${card.images.small}" alt="${card.name}" class="card-image" loading="lazy">
      <span class="game-tag ${game}">${game === 'pokemon' ? '⚡' : '☠️'}</span>
    </div>
    <div class="card-content">
      <h3 class="card-name">${card.name}</h3>
      <p class="card-set">${card.set.name} • #${card.number}</p>
      
      <div class="card-prices">
        <div class="price-row">
          <span class="price-label">Market</span>
          <span class="price-value ${marketPrice ? '' : 'na'}">${marketPrice ? `$${marketPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
        ${currentView === 'list' ? `
        <div class="price-row">
          <span class="price-label">Low</span>
          <span class="price-value ${lowPrice ? '' : 'na'}">${lowPrice ? `$${lowPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
        <div class="price-row">
          <span class="price-label">High</span>
          <span class="price-value ${highPrice ? '' : 'na'}">${highPrice ? `$${highPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
        ` : ''}
      </div>
      
      ${card.rarity ? `<span class="card-rarity rarity-${rarityClass}">${card.rarity}</span>` : ''}
      <p class="view-details">Click to view details →</p>
    </div>
  `;

  return cardDiv;
}

// Get Rarity Class
function getRarityClass(rarity) {
  if (!rarity) return '';
  const lower = rarity.toLowerCase();
  if (lower.includes('common')) return 'common';
  if (lower.includes('uncommon')) return 'uncommon';
  if (lower.includes('rare')) return 'rare';
  if (lower.includes('ultra')) return 'ultra-rare';
  if (lower.includes('secret')) return 'secret-rare';
  if (lower.includes('promo')) return 'promo';
  if (lower.includes('leader')) return 'leader';
  if (lower.includes('super')) return 'super-rare';
  return '';
}

// Pagination
function displayPagination(data) {
  const totalPages = Math.ceil(data.totalCount / data.pageSize);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = `
    <button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
      ← Prev
    </button>
    <span class="page-info">Page ${currentPage} of ${totalPages}</span>
    <button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
      Next →
    </button>
  `;
  
  paginationContainer.innerHTML = html;
}

window.goToPage = function(page) {
  currentPage = page;
  performSearch(currentQuery);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Recently Viewed
function addToRecentlyViewed(card) {
  const existing = recentlyViewed.findIndex(c => c.id === card.id);
  if (existing > -1) {
    recentlyViewed.splice(existing, 1);
  }
  
  recentlyViewed.unshift({
    id: card.id,
    name: card.name,
    image: card.images.small,
    game: card.game || currentGame,
    viewedAt: new Date().toISOString()
  });
  
  recentlyViewed = recentlyViewed.slice(0, 8);
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  loadRecentlyViewed();
}

function loadRecentlyViewed() {
  if (!recentCardsContainer) return;
  
  if (recentlyViewed.length === 0) {
    recentSection.classList.add('hidden');
    return;
  }
  
  recentSection.classList.remove('hidden');
  recentCardsContainer.innerHTML = '';
  
  recentlyViewed.forEach((card, index) => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.style.animationDelay = `${index * 0.05}s`;
    cardDiv.addEventListener('click', () => {
      window.location.href = `/card.html?id=${card.id}&game=${card.game}`;
    });
    
    cardDiv.innerHTML = `
      <div class="card-image-wrapper">
        <img src="${card.image}" alt="${card.name}" class="card-image" loading="lazy">
        <span class="game-tag ${card.game}">${card.game === 'pokemon' ? '⚡' : '☠️'}</span>
      </div>
      <div class="card-content">
        <h3 class="card-name">${card.name}</h3>
      </div>
    `;
    
    recentCardsContainer.appendChild(cardDiv);
  });
}

// Particle Animation for Hero
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: rgba(99, 102, 241, ${Math.random() * 0.5});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: float ${Math.random() * 10 + 10}s linear infinite;
      animation-delay: -${Math.random() * 10}s;
    `;
    container.appendChild(particle);
  }
}

// Initialize particles
createParticles();

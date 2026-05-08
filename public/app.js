// TCG Marketplace Frontend - Multi-Game Support
const API_BASE = '';
let currentPage = 1;
let currentQuery = '';
let currentSet = '';
let currentGame = 'pokemon';
let games = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const setFilter = document.getElementById('setFilter');
const resultsContainer = document.getElementById('results');
const paginationContainer = document.getElementById('pagination');
const featuredCardsContainer = document.getElementById('featuredCards');
const featuredSection = document.getElementById('featuredSection');
const gameInfo = document.getElementById('gameInfo');
const footerText = document.getElementById('footerText');

// Popular cards by game
const POPULAR_CARDS = {
  pokemon: [
    'Charizard', 'Pikachu', 'Mewtwo', 'Rayquaza', 'Umbreon', 
    'Lugia', 'Gengar', 'Eevee', 'Snorlax', 'Blastoise',
    'Venusaur', 'Mew', 'Gyarados', 'Dragonite', 'Alakazam',
    'Arcanine', 'Lucario', 'Gardevoir', 'Tyranitar', 'Metagross'
  ],
  onepiece: [
    'Luffy', 'Zoro', 'Nami', 'Sanji', 'Shanks', 
    'Gol D. Roger', 'Usopp', 'Chopper', 'Robin', 'Franky',
    'Brook', 'Jinbe', 'Ace', 'Whitebeard', 'Blackbeard'
  ]
};

// Initialize
async function init() {
  // Load available games
  await loadGames();
  
  // Setup game switcher
  setupGameSwitcher();
  
  // Load sets for current game
  await loadSets();
  
  // Setup event listeners
  setupEventListeners();
  
  // Check for URL params
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const game = params.get('game');
  
  if (game && games.find(g => g.id === game)) {
    switchGame(game);
  }
  
  if (query) {
    searchInput.value = query;
    performSearch(query);
    featuredSection.style.display = 'none';
  } else {
    resultsContainer.innerHTML = `<div class="placeholder">Search for a ${getGameName(currentGame)} card to see prices</div>`;
    loadFeaturedCards();
  }
}

// Load available games
async function loadGames() {
  try {
    const response = await fetch(`${API_BASE}/api/games`);
    games = await response.json();
    console.log('🎮 Available games:', games.map(g => g.name).join(', '));
  } catch (error) {
    console.error('Failed to load games:', error);
    // Fallback to default games
    games = [
      { id: 'pokemon', name: 'Pokemon TCG', icon: '⚡', enabled: true },
      { id: 'onepiece', name: 'One Piece Card Game', icon: '☠️', enabled: true, note: 'Sample data' }
    ];
  }
}

// Setup game switcher
function setupGameSwitcher() {
  const gameBtns = document.querySelectorAll('.game-btn');
  
  gameBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const game = btn.dataset.game;
      switchGame(game);
      
      // Update active button
      gameBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Switch game
function switchGame(game) {
  if (game === currentGame) return;
  
  currentGame = game;
  currentPage = 1;
  currentQuery = '';
  currentSet = '';
  
  // Update UI
  updateGameUI();
  
  // Clear and reload
  searchInput.value = '';
  resultsContainer.innerHTML = `<div class="placeholder">Search for a ${getGameName(game)} card to see prices</div>`;
  searchStatus.textContent = '';
  paginationContainer.innerHTML = '';
  
  // Reload sets for new game
  loadSets();
  
  // Load featured cards for new game
  featuredSection.style.display = 'block';
  loadFeaturedCards();
  
  // Update URL
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('game', game);
  window.history.pushState({}, '', newUrl);
}

// Update game-specific UI
function updateGameUI() {
  const game = games.find(g => g.id === currentGame);
  if (!game) return;
  
  // Update game badge
  gameInfo.innerHTML = `<span class="game-badge ${currentGame}">${game.icon} ${game.name}</span>`;
  
  // Update search placeholder
  const placeholderText = currentGame === 'pokemon' 
    ? 'Search for a Pokemon card (e.g., Charizard, Pikachu)...'
    : 'Search for a One Piece card (e.g., Luffy, Zoro, Shanks)...';
  searchInput.placeholder = placeholderText;
  
  // Update footer
  if (currentGame === 'pokemon') {
    footerText.innerHTML = 'Powered by <a href="https://pokemontcg.io/" target="_blank">Pokemon TCG API</a>';
  } else {
    footerText.innerHTML = 'One Piece Card Game data is sample data. Official API integration coming soon.';
  }
  
  // Update featured section title
  const featuredTitle = featuredSection.querySelector('h2');
  featuredTitle.textContent = `🔥 Featured ${game.name} Cards`;
}

// Get game display name
function getGameName(gameId) {
  const game = games.find(g => g.id === gameId);
  return game ? game.name : gameId;
}

// Load featured/random cards
async function loadFeaturedCards() {
  try {
    featuredCardsContainer.innerHTML = '<span class="loading"></span> Loading featured cards...';
    
    // Get popular cards for current game
    const popularCards = POPULAR_CARDS[currentGame] || POPULAR_CARDS.pokemon;
    
    // Pick 3 random cards
    const shuffled = [...popularCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    // Fetch cards
    const cardPromises = selected.map(async (cardName) => {
      try {
        const response = await fetch(
          `${API_BASE}/api/${currentGame}/cards/search?q=${encodeURIComponent(cardName)}&pageSize=5`
        );
        const data = await response.json();
        if (data.cards && data.cards.length > 0) {
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
    cards.forEach(card => {
      const cardElement = createCardElement(card, true);
      featuredCardsContainer.appendChild(cardElement);
    });
  } catch (error) {
    console.error('Failed to load featured cards:', error);
    featuredCardsContainer.innerHTML = '<p class="placeholder">Could not load featured cards</p>';
  }
}

// Setup event listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1;
      performSearch(query);
      featuredSection.style.display = 'none';
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1;
        performSearch(query);
        featuredSection.style.display = 'none';
      }
    }
  });

  setFilter.addEventListener('change', (e) => {
    currentSet = e.target.value;
    if (currentQuery) {
      currentPage = 1;
      performSearch(currentQuery);
      featuredSection.style.display = 'none';
    }
  });
}

// Load available sets
async function loadSets() {
  try {
    setFilter.innerHTML = '<option value="">All Sets</option>';
    
    const response = await fetch(`${API_BASE}/api/${currentGame}/sets`);
    const data = await response.json();
    
    data.data.forEach(set => {
      const option = document.createElement('option');
      option.value = set.id;
      option.textContent = `${set.name} ${set.series ? `(${set.series})` : ''}`;
      setFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load sets:', error);
  }
}

// Perform search
async function performSearch(query) {
  currentQuery = query;
  searchStatus.innerHTML = '<span class="loading"></span> Searching...';
  resultsContainer.innerHTML = '<div class="placeholder">Loading...</div>';
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
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `<div class="placeholder">Error: ${error.message}</div>`;
    searchStatus.textContent = '';
  }
}

// Display search results
function displayResults(data) {
  if (!data.cards || data.cards.length === 0) {
    resultsContainer.innerHTML = '<div class="placeholder">No cards found. Try a different search.</div>';
    searchStatus.textContent = `0 results found`;
    return;
  }

  searchStatus.textContent = `${data.totalCount} cards found`;
  resultsContainer.innerHTML = '';

  data.cards.forEach(card => {
    const cardElement = createCardElement(card);
    resultsContainer.appendChild(cardElement);
  });
}

// Create card HTML element
function createCardElement(card, isFeatured = false) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card clickable';
  if (isFeatured) {
    cardDiv.classList.add('featured-card');
  }
  cardDiv.style.cursor = 'pointer';
  
  // Make card clickable
  const game = card.game || currentGame;
  cardDiv.addEventListener('click', () => {
    window.location.href = `/card.html?id=${card.id}&game=${game}`;
  });

  const prices = card.tcgplayer?.prices || {};
  const marketPrice = prices.normal?.market || prices.holofoil?.market || prices.reverseHolofoil?.market;
  const lowPrice = prices.normal?.low || prices.holofoil?.low || prices.reverseHolofoil?.low;
  const highPrice = prices.normal?.high || prices.holofoil?.high || prices.reverseHolofoil?.high;

  const rarityClass = getRarityClass(card.rarity);
  const gameBadge = `<span class="game-tag ${game}">${game === 'pokemon' ? '⚡' : '☠️'}</span>`;

  cardDiv.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${card.images.small}" alt="${card.name}" class="card-image" loading="lazy">
      ${gameBadge}
    </div>
    <div class="card-content">
      <h3 class="card-name">${card.name}</h3>
      <p class="card-set">${card.set.name} • #${card.number}</p>
      
      <div class="card-prices">
        <div class="price-row">
          <span class="price-label">Market</span>
          <span class="price-value ${marketPrice ? '' : 'na'}">${marketPrice ? `$${marketPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Low</span>
          <span class="price-value ${lowPrice ? '' : 'na'}">${lowPrice ? `$${lowPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
        <div class="price-row">
          <span class="price-label">High</span>
          <span class="price-value ${highPrice ? '' : 'na'}">${highPrice ? `$${highPrice.toFixed(2)}` : 'N/A'}</span>
        </div>
      </div>
      
      ${card.rarity ? `<span class="card-rarity rarity-${rarityClass}">${card.rarity}</span>` : ''}
      <p class="view-details">Click to view details →</p>
    </div>
  `;

  return cardDiv;
}

// Get rarity class for styling
function getRarityClass(rarity) {
  if (!rarity) return '';
  const rarityLower = rarity.toLowerCase();
  if (rarityLower.includes('common')) return 'common';
  if (rarityLower.includes('uncommon')) return 'uncommon';
  if (rarityLower.includes('rare')) return 'rare';
  if (rarityLower.includes('ultra')) return 'ultra-rare';
  if (rarityLower.includes('secret')) return 'secret-rare';
  if (rarityLower.includes('promo')) return 'promo';
  if (rarityLower.includes('leader')) return 'leader';
  if (rarityLower.includes('super')) return 'super-rare';
  return '';
}

// Display pagination
function displayPagination(data) {
  const totalPages = Math.ceil(data.totalCount / data.pageSize);
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';
  
  // Previous button
  html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">← Previous</button>`;
  
  // Page info
  html += `<span class="page-info">Page ${currentPage} of ${totalPages}</span>`;
  
  // Next button
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next →</button>`;
  
  paginationContainer.innerHTML = html;
}

// Go to specific page
window.goToPage = function(page) {
  currentPage = page;
  performSearch(currentQuery);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Start the app
init();

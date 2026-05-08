// TCG Marketplace Frontend
const API_BASE = '';
let currentPage = 1;
let currentQuery = '';
let currentSet = '';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const setFilter = document.getElementById('setFilter');
const resultsContainer = document.getElementById('results');
const paginationContainer = document.getElementById('pagination');

// Initialize
async function init() {
  await loadSets();
  setupEventListeners();
  
  // Check for URL params
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (query) {
    searchInput.value = query;
    performSearch(query);
  }
}

// Setup event listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      currentPage = 1;
      performSearch(query);
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        currentPage = 1;
        performSearch(query);
      }
    }
  });

  setFilter.addEventListener('change', (e) => {
    currentSet = e.target.value;
    if (currentQuery) {
      currentPage = 1;
      performSearch(currentQuery);
    }
  });
}

// Load available sets
async function loadSets() {
  try {
    const response = await fetch(`${API_BASE}/api/sets`);
    const sets = await response.json();
    
    sets.data.forEach(set => {
      const option = document.createElement('option');
      option.value = set.id;
      option.textContent = `${set.name} (${set.series})`;
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
    let url = `${API_BASE}/api/cards/search?q=${encodeURIComponent(query)}&page=${currentPage}`;
    if (currentSet) {
      url = `${API_BASE}/api/sets/${currentSet}/cards?page=${currentPage}`;
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
function createCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';

  const prices = card.tcgplayer?.prices || {};
  const marketPrice = prices.normal?.market || prices.holofoil?.market || prices.reverseHolofoil?.market;
  const lowPrice = prices.normal?.low || prices.holofoil?.low || prices.reverseHolofoil?.low;
  const highPrice = prices.normal?.high || prices.holofoil?.high || prices.reverseHolofoil?.high;

  const rarityClass = getRarityClass(card.rarity);

  cardDiv.innerHTML = `
    <img src="${card.images.small}" alt="${card.name}" class="card-image" loading="lazy">
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

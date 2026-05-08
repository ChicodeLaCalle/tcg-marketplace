const express = require('express');
const cors = require('cors');
const path = require('path');
const pokemon = require('pokemontcgsdk');
const db = require('./database');
const priceTracker = require('./priceTracker');
const priceService = require('./priceService');
const gameService = require('./gameService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pokemon TCG API Key (optional but recommended for higher rate limits)
if (process.env.POKEMON_TCG_API_KEY) {
  pokemon.configure({ apiKey: process.env.POKEMON_TCG_API_KEY });
}

// Start daily price tracking
priceTracker.startDailyTracking();

// Routes

// Get available games
app.get('/api/games', (req, res) => {
  res.json(gameService.getGames());
});

// Search cards by game
app.get('/api/:game/cards/search', async (req, res) => {
  try {
    const { game } = req.params;
    const { q, page = 1, pageSize = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await gameService.searchCards(game, q, page, pageSize);

    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      game: game
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search cards' });
  }
});

// Get card by ID
app.get('/api/:game/cards/:id', async (req, res) => {
  try {
    const { game, id } = req.params;
    const card = await gameService.getCard(game, id);
    
    // Track this card's price in background (only for Pokemon for now)
    if (game === 'pokemon') {
      priceTracker.trackCard(id).catch(console.error);
    }
    
    res.json(card);
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// Get card price history
app.get('/api/:game/cards/:id/history', async (req, res) => {
  try {
    const { game, id } = req.params;
    const { days = 30 } = req.query;
    
    // Get card first
    const card = await gameService.getCard(game, id);
    
    // For Pokemon: record current TCGPlayer prices
    if (game === 'pokemon') {
      await priceTracker.recordCardPrices(card);
    }
    
    // Get history
    const history = await db.getPriceHistory(id, parseInt(days));
    
    res.json({
      cardId: id,
      cardName: card.name,
      game: game,
      days: parseInt(days),
      data: history,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Get all sets by game
app.get('/api/:game/sets', async (req, res) => {
  try {
    const { game } = req.params;
    const sets = await gameService.getSets(game);
    res.json({ data: sets, game: game });
  } catch (error) {
    console.error('Sets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

// Get cards by set
app.get('/api/:game/sets/:setId/cards', async (req, res) => {
  try {
    const { game, setId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await gameService.getCardsBySet(game, setId, page, pageSize);

    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      game: game
    });
  } catch (error) {
    console.error('Set cards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch set cards' });
  }
});

// Generate mock price history (for demo purposes)
app.post('/api/:game/cards/:id/mock-history', async (req, res) => {
  try {
    const { game, id } = req.params;
    const card = await gameService.getCard(game, id);
    const basePrice = card.tcgplayer?.prices?.normal?.market || 
                      card.tcgplayer?.prices?.holofoil?.market || 10;
    
    await priceTracker.generateMockHistory(card.id, card.name, basePrice);
    
    res.json({ message: 'Mock history generated', cardId: card.id, game: game });
  } catch (error) {
    console.error('Mock history error:', error);
    res.status(500).json({ error: 'Failed to generate mock history' });
  }
});

// Get available price sources
app.get('/api/price-sources', (req, res) => {
  res.json(priceService.getEnabledSources());
});

// Get aggregated prices from all sources
app.get('/api/:game/cards/:id/prices', async (req, res) => {
  try {
    const { game, id } = req.params;
    const card = await gameService.getCard(game, id);
    const aggregated = await priceService.aggregatePrices(card);
    
    res.json({
      cardId: id,
      cardName: card.name,
      game: game,
      sources: aggregated
    });
  } catch (error) {
    console.error('Aggregate prices error:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated prices' });
  }
});

// Legacy routes (for backwards compatibility - default to Pokemon)
app.get('/api/cards/search', async (req, res) => {
  req.params.game = 'pokemon';
  // Redirect to new route
  const { q, page = 1, pageSize = 20 } = req.query;
  try {
    const result = await gameService.searchCards('pokemon', q, page, pageSize);
    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      game: 'pokemon'
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search cards' });
  }
});

app.get('/api/cards/:id', async (req, res) => {
  try {
    const card = await gameService.getCard('pokemon', req.params.id);
    priceTracker.trackCard(req.params.id).catch(console.error);
    res.json(card);
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

app.get('/api/cards/:id/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const card = await gameService.getCard('pokemon', req.params.id);
    await priceTracker.recordCardPrices(card);
    const history = await db.getPriceHistory(req.params.id, parseInt(days));
    res.json({
      cardId: req.params.id,
      cardName: card.name,
      game: 'pokemon',
      days: parseInt(days),
      data: history,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

app.get('/api/sets', async (req, res) => {
  try {
    const sets = await gameService.getSets('pokemon');
    res.json({ data: sets, game: 'pokemon' });
  } catch (error) {
    console.error('Sets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

app.get('/api/sets/:setId/cards', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await gameService.getCardsBySet('pokemon', req.params.setId, page, pageSize);
    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize,
      game: 'pokemon'
    });
  } catch (error) {
    console.error('Set cards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch set cards' });
  }
});

app.post('/api/cards/:id/mock-history', async (req, res) => {
  try {
    const card = await gameService.getCard('pokemon', req.params.id);
    const basePrice = card.tcgplayer?.prices?.normal?.market || 
                      card.tcgplayer?.prices?.holofoil?.market || 10;
    await priceTracker.generateMockHistory(card.id, card.name, basePrice);
    res.json({ message: 'Mock history generated', cardId: card.id, game: 'pokemon' });
  } catch (error) {
    console.error('Mock history error:', error);
    res.status(500).json({ error: 'Failed to generate mock history' });
  }
});

app.get('/api/cards/:id/prices', async (req, res) => {
  try {
    const card = await gameService.getCard('pokemon', req.params.id);
    const aggregated = await priceService.aggregatePrices(card);
    res.json({
      cardId: req.params.id,
      cardName: card.name,
      game: 'pokemon',
      sources: aggregated
    });
  } catch (error) {
    console.error('Aggregate prices error:', error);
    res.status(500).json({ error: 'Failed to fetch aggregated prices' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    priceSources: priceService.getEnabledSources().length,
    games: gameService.getGames().length
  });
});

app.listen(PORT, () => {
  console.log(`TCG Marketplace server running on http://localhost:${PORT}`);
  console.log(`🎮 Supported games: ${gameService.getGames().map(g => g.name).join(', ')}`);
});

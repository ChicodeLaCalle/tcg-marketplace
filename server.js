const express = require('express');
const cors = require('cors');
const path = require('path');
const pokemon = require('pokemontcgsdk');
const db = require('./database');
const priceTracker = require('./priceTracker');

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

// Search cards by name
app.get('/api/cards/search', async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await pokemon.card.where({ 
      q: `name:"${q}"`,
      pageSize: parseInt(pageSize),
      page: parseInt(page)
    });

    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search cards' });
  }
});

// Get card by ID
app.get('/api/cards/:id', async (req, res) => {
  try {
    const card = await pokemon.card.find(req.params.id);
    
    // Track this card's price in background
    priceTracker.trackCard(req.params.id).catch(console.error);
    
    res.json(card);
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// Get card price history
app.get('/api/cards/:id/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const history = await db.getPriceHistory(req.params.id, parseInt(days));
    
    res.json({
      cardId: req.params.id,
      days: parseInt(days),
      data: history
    });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Get all sets
app.get('/api/sets', async (req, res) => {
  try {
    const sets = await pokemon.set.all();
    res.json(sets);
  } catch (error) {
    console.error('Sets fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

// Get cards by set
app.get('/api/sets/:setId/cards', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await pokemon.card.where({
      q: `set.id:${req.params.setId}`,
      pageSize: parseInt(pageSize),
      page: parseInt(page)
    });

    res.json({
      cards: result.data,
      totalCount: result.totalCount,
      page: result.page,
      pageSize: result.pageSize
    });
  } catch (error) {
    console.error('Set cards fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch set cards' });
  }
});

// Generate mock price history (for demo purposes)
app.post('/api/cards/:id/mock-history', async (req, res) => {
  try {
    const card = await pokemon.card.find(req.params.id);
    const basePrice = card.tcgplayer?.prices?.normal?.market || 
                      card.tcgplayer?.prices?.holofoil?.market || 10;
    
    await priceTracker.generateMockHistory(card.id, card.name, basePrice);
    
    res.json({ message: 'Mock history generated', cardId: card.id });
  } catch (error) {
    console.error('Mock history error:', error);
    res.status(500).json({ error: 'Failed to generate mock history' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TCG Marketplace server running on http://localhost:${PORT}`);
});

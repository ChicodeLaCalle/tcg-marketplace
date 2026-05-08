const fetch = require('node-fetch');
const pokemon = require('pokemontcgsdk');

// Game configurations
const GAMES = {
  pokemon: {
    name: 'Pokemon TCG',
    id: 'pokemon',
    enabled: true,
    hasApi: true,
    api: pokemon,
    color: '#ff6b6b',
    icon: '⚡'
  },
  onepiece: {
    name: 'One Piece Card Game',
    id: 'onepiece',
    enabled: true,
    hasApi: false, // No public API available yet
    color: '#3b82f6',
    icon: '☠️',
    note: 'One Piece API coming soon. Using sample data for now.'
  }
};

// Sample One Piece cards for demo
const ONE_PIECE_SAMPLE_CARDS = [
  {
    id: 'op01-001',
    name: 'Monkey D. Luffy',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '001',
    rarity: 'Leader',
    type: 'Leader',
    color: 'Red',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-001.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-001.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 45.50, low: 38.00, high: 55.00 }
      }
    }
  },
  {
    id: 'op01-002',
    name: 'Roronoa Zoro',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '002',
    rarity: 'Super Rare',
    type: 'Character',
    color: 'Green',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-002.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-002.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 12.99, low: 8.00, high: 18.00 }
      }
    }
  },
  {
    id: 'op01-003',
    name: 'Nami',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '003',
    rarity: 'Rare',
    type: 'Character',
    color: 'Blue',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-003.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-003.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 8.50, low: 5.00, high: 12.00 }
      }
    }
  },
  {
    id: 'op01-004',
    name: 'Usopp',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '004',
    rarity: 'Common',
    type: 'Character',
    color: 'Yellow',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-004.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-004.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 1.50, low: 0.50, high: 3.00 }
      }
    }
  },
  {
    id: 'op01-005',
    name: 'Sanji',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '005',
    rarity: 'Super Rare',
    type: 'Character',
    color: 'Blue',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-005.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-005.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 15.00, low: 10.00, high: 22.00 }
      }
    }
  },
  {
    id: 'op01-006',
    name: 'Tony Tony Chopper',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '006',
    rarity: 'Common',
    type: 'Character',
    color: 'Pink',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-006.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-006.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 2.00, low: 1.00, high: 4.00 }
      }
    }
  },
  {
    id: 'op01-007',
    name: 'Nico Robin',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '007',
    rarity: 'Rare',
    type: 'Character',
    color: 'Purple',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-007.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-007.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 6.00, low: 3.50, high: 10.00 }
      }
    }
  },
  {
    id: 'op01-008',
    name: 'Franky',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '008',
    rarity: 'Uncommon',
    type: 'Character',
    color: 'Blue',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-008.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-008.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 3.50, low: 2.00, high: 6.00 }
      }
    }
  },
  {
    id: 'op01-009',
    name: 'Brook',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '009',
    rarity: 'Uncommon',
    type: 'Character',
    color: 'Black',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-009.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-009.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 4.00, low: 2.50, high: 7.00 }
      }
    }
  },
  {
    id: 'op01-010',
    name: 'Jinbe',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '010',
    rarity: 'Rare',
    type: 'Character',
    color: 'Blue',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-010.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-010.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 7.50, low: 5.00, high: 12.00 }
      }
    }
  },
  {
    id: 'op01-121',
    name: 'Shanks',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '121',
    rarity: 'Secret Rare',
    type: 'Character',
    color: 'Red',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-121.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-121.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 250.00, low: 200.00, high: 350.00 }
      }
    }
  },
  {
    id: 'op01-120',
    name: 'Gol D. Roger',
    set: { id: 'op01', name: 'Romance Dawn', series: 'OP-01' },
    number: '120',
    rarity: 'Secret Rare',
    type: 'Character',
    color: 'Red',
    images: {
      small: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-120.png',
      large: 'https://www.onepiece-cardgame.com/images/cardlist/card/OP01-120.png'
    },
    tcgplayer: {
      prices: {
        normal: { market: 180.00, low: 150.00, high: 250.00 }
      }
    }
  }
];

class GameService {
  constructor() {
    this.games = GAMES;
    this.onePieceCards = ONE_PIECE_SAMPLE_CARDS;
  }

  // Get all available games
  getGames() {
    return Object.values(this.games).map(game => ({
      id: game.id,
      name: game.name,
      enabled: game.enabled,
      hasApi: game.hasApi,
      color: game.color,
      icon: game.icon,
      note: game.note
    }));
  }

  // Get game by ID
  getGame(gameId) {
    return this.games[gameId] || null;
  }

  // Search cards by game
  async searchCards(gameId, query, page = 1, pageSize = 20) {
    const game = this.getGame(gameId);
    
    if (!game || !game.enabled) {
      throw new Error('Game not found or not enabled');
    }

    if (gameId === 'pokemon') {
      // Use Pokemon TCG API
      const result = await game.api.card.where({
        q: `name:"${query}"`,
        pageSize: parseInt(pageSize),
        page: parseInt(page)
      });
      
      // Tag cards with game
      result.data = result.data.map(card => ({ ...card, game: 'pokemon' }));
      return result;
    } 
    
    else if (gameId === 'onepiece') {
      // Filter sample One Piece cards
      const filtered = this.onePieceCards.filter(card => 
        card.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // Paginate
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + parseInt(pageSize));
      
      return {
        data: paginated.map(card => ({ ...card, game: 'onepiece' })),
        totalCount: filtered.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }

    throw new Error('Unsupported game');
  }

  // Get card by ID and game
  async getCard(gameId, cardId) {
    const game = this.getGame(gameId);
    
    if (!game || !game.enabled) {
      throw new Error('Game not found or not enabled');
    }

    if (gameId === 'pokemon') {
      const card = await game.api.card.find(cardId);
      return { ...card, game: 'pokemon' };
    } 
    
    else if (gameId === 'onepiece') {
      const card = this.onePieceCards.find(c => c.id === cardId);
      if (!card) throw new Error('Card not found');
      return { ...card, game: 'onepiece' };
    }

    throw new Error('Unsupported game');
  }

  // Get sets by game
  async getSets(gameId) {
    const game = this.getGame(gameId);
    
    if (!game || !game.enabled) {
      throw new Error('Game not found or not enabled');
    }

    if (gameId === 'pokemon') {
      const sets = await game.api.set.all();
      return sets.map(set => ({ ...set, game: 'pokemon' }));
    } 
    
    else if (gameId === 'onepiece') {
      // Return unique sets from sample data
      const setsMap = new Map();
      this.onePieceCards.forEach(card => {
        if (!setsMap.has(card.set.id)) {
          setsMap.set(card.set.id, {
            ...card.set,
            game: 'onepiece',
            images: { logo: '', symbol: '' }
          });
        }
      });
      return Array.from(setsMap.values());
    }

    throw new Error('Unsupported game');
  }

  // Get cards by set
  async getCardsBySet(gameId, setId, page = 1, pageSize = 20) {
    const game = this.getGame(gameId);
    
    if (!game || !game.enabled) {
      throw new Error('Game not found or not enabled');
    }

    if (gameId === 'pokemon') {
      const result = await game.api.card.where({
        q: `set.id:${setId}`,
        pageSize: parseInt(pageSize),
        page: parseInt(page)
      });
      
      result.data = result.data.map(card => ({ ...card, game: 'pokemon' }));
      return result;
    } 
    
    else if (gameId === 'onepiece') {
      const filtered = this.onePieceCards.filter(card => card.set.id === setId);
      
      const start = (page - 1) * pageSize;
      const paginated = filtered.slice(start, start + parseInt(pageSize));
      
      return {
        data: paginated.map(card => ({ ...card, game: 'onepiece' })),
        totalCount: filtered.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    }

    throw new Error('Unsupported game');
  }
}

module.exports = new GameService();

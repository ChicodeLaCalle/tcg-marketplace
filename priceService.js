const fetch = require('node-fetch');

// Price source configurations
const PRICE_SOURCES = {
  tcgplayer: {
    name: 'TCGPlayer',
    region: 'US',
    enabled: true
  },
  pricecharting: {
    name: 'PriceCharting',
    region: 'US',
    enabled: true,
    baseUrl: 'https://www.pricecharting.com/api'
  },
  cardmarket: {
    name: 'Cardmarket',
    region: 'EU',
    enabled: false, // Placeholder - requires API key or scraping (against ToS)
    note: 'Cardmarket does not have a public API. Manual entry or browser extension required.'
  }
};

class PriceService {
  constructor() {
    this.sources = PRICE_SOURCES;
  }

  // Get all enabled price sources
  getEnabledSources() {
    return Object.entries(this.sources)
      .filter(([key, source]) => source.enabled)
      .map(([key, source]) => ({ key, ...source }));
  }

  // Fetch prices from PriceCharting API
  async fetchPriceChartingPrices(cardName, setName = null) {
    try {
      // PriceCharting has a search endpoint
      // Note: Free tier allows limited requests. Consider caching.
      
      // Normalize card name for search
      const searchQuery = encodeURIComponent(cardName);
      
      // PriceCharting web search (not official API - using their search page)
      // For production, you'd want to use their official API or scrape with permission
      
      // For now, return mock structure showing how it would work
      console.log(`🔍 Would search PriceCharting for: ${cardName}`);
      
      return {
        source: 'pricecharting',
        prices: {
          loose: null,      // Ungraded
          graded7: null,    // PSA 7
          graded8: null,    // PSA 8
          graded9: null,    // PSA 9
          graded10: null    // PSA 10
        },
        url: `https://www.pricecharting.com/search?q=${searchQuery}`,
        note: 'PriceCharting integration requires API key or web scraping setup'
      };
    } catch (error) {
      console.error('PriceCharting fetch error:', error);
      return null;
    }
  }

  // Aggregate prices from all sources
  async aggregatePrices(card) {
    const results = {
      tcgplayer: card.tcgplayer?.prices || null,
      pricecharting: null,
      cardmarket: null
    };

    // Fetch PriceCharting data
    if (this.sources.pricecharting.enabled) {
      results.pricecharting = await this.fetchPriceChartingPrices(
        card.name,
        card.set?.name
      );
    }

    return results;
  }

  // Format prices for display
  formatPrices(prices, sourceKey) {
    const source = this.sources[sourceKey];
    if (!source || !prices) return null;

    switch (sourceKey) {
      case 'tcgplayer':
        return this.formatTCGPlayerPrices(prices);
      case 'pricecharting':
        return this.formatPriceChartingPrices(prices);
      default:
        return prices;
    }
  }

  formatTCGPlayerPrices(prices) {
    const formatted = {};
    for (const [type, data] of Object.entries(prices)) {
      formatted[type] = {
        market: data.market,
        low: data.low,
        mid: data.mid,
        high: data.high
      };
    }
    return formatted;
  }

  formatPriceChartingPrices(data) {
    if (!data) return null;
    return {
      loose: data.prices?.loose,
      graded7: data.prices?.graded7,
      graded8: data.prices?.graded8,
      graded9: data.prices?.graded9,
      graded10: data.prices?.graded10,
      url: data.url
    };
  }
}

module.exports = new PriceService();

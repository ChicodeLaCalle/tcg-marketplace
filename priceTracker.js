const cron = require('node-cron');
const pokemon = require('pokemontcgsdk');
const db = require('./database');

class PriceTracker {
  constructor() {
    this.isRunning = false;
  }

  // Record prices for a card
  async recordCardPrices(card) {
    try {
      const prices = card.tcgplayer?.prices || {};
      
      // Record each price type
      for (const [priceType, data] of Object.entries(prices)) {
        if (data.market) {
          await db.recordPrice(card.id, card.name, `${priceType}_market`, data.market);
        }
        if (data.low) {
          await db.recordPrice(card.id, card.name, `${priceType}_low`, data.low);
        }
        if (data.high) {
          await db.recordPrice(card.id, card.name, `${priceType}_high`, data.high);
        }
      }
      
      console.log(`📊 Recorded prices for ${card.name}`);
    } catch (error) {
      console.error(`Failed to record prices for ${card.id}:`, error);
    }
  }

  // Track popular cards (for demo, we'll track when cards are viewed)
  async trackCard(cardId) {
    try {
      const card = await pokemon.card.find(cardId);
      await this.recordCardPrices(card);
    } catch (error) {
      console.error(`Failed to track card ${cardId}:`, error);
    }
  }

  // Schedule daily price tracking for tracked cards
  startDailyTracking() {
    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
      console.log('🕐 Running daily price tracking...');
      
      try {
        const trackedCards = await db.getTrackedCards();
        
        for (const tracked of trackedCards) {
          await this.trackCard(tracked.card_id);
        }
        
        // Cleanup old data
        const deleted = await db.cleanupOldData();
        console.log(`🧹 Cleaned up ${deleted} old price records`);
        
        console.log('✅ Daily price tracking complete');
      } catch (error) {
        console.error('Daily tracking failed:', error);
      }
    });

    console.log('⏰ Daily price tracking scheduled (midnight)');
  }

  // Generate mock historical data for demonstration
  async generateMockHistory(cardId, cardName, basePrice) {
    const types = ['normal_market', 'holofoil_market', 'reverseHolofoil_market'];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (const type of types) {
        // Generate realistic price fluctuation (±15%)
        const variance = (Math.random() - 0.5) * 0.3;
        const price = Math.max(0.1, basePrice * (1 + variance));
        
        await new Promise((resolve, reject) => {
          const dbModule = require('./database');
          dbModule.db.run(
            `INSERT INTO price_history (card_id, card_name, price_type, price, recorded_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [cardId, cardName, type, price.toFixed(2), date.toISOString()],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }
    
    console.log(`📈 Generated 30 days of mock history for ${cardName}`);
  }
}

module.exports = new PriceTracker();

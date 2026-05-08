const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'prices.db');

class Database {
  constructor() {
    // Ensure directory exists
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new sqlite3.Database(DB_PATH);
    this.initialized = false;
    this.init();
  }

  init() {
    // Use serialize to ensure tables are created in order
    this.db.serialize(() => {
      // Price history table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          card_id TEXT NOT NULL,
          card_name TEXT NOT NULL,
          price_type TEXT NOT NULL,
          price REAL,
          recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating price_history table:', err);
        } else {
          console.log('✅ price_history table ready');
        }
      });

      // Index for faster queries
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_card_date 
        ON price_history(card_id, recorded_at)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
        }
      });

      this.initialized = true;
    });
  }

  // Wait for initialization (helper for async operations)
  async waitForInit() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.initialized) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  // Record a price snapshot
  async recordPrice(cardId, cardName, priceType, price) {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO price_history (card_id, card_name, price_type, price) 
         VALUES (?, ?, ?, ?)`,
        [cardId, cardName, priceType, price],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  // Get price history for a card (last 30 days)
  async getPriceHistory(cardId, days = 30) {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          DATE(recorded_at) as date,
          price_type,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM price_history 
        WHERE card_id = ? 
          AND recorded_at >= DATE('now', '-${days} days')
          AND price IS NOT NULL
        GROUP BY DATE(recorded_at), price_type
        ORDER BY date ASC
      `;
      
      this.db.all(sql, [cardId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get latest price for a card
  async getLatestPrice(cardId) {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM price_history 
        WHERE card_id = ? 
        ORDER BY recorded_at DESC 
        LIMIT 1
      `;
      
      this.db.get(sql, [cardId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get all tracked cards
  async getTrackedCards() {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT card_id, card_name, 
          MAX(recorded_at) as last_updated
        FROM price_history 
        GROUP BY card_id
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Clean old data (keep 90 days)
  async cleanupOldData(days = 90) {
    await this.waitForInit();
    
    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM price_history 
        WHERE recorded_at < DATE('now', '-${days} days')
      `;
      
      this.db.run(sql, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();

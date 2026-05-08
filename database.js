const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'prices.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.init();
  }

  init() {
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
    `);

    // Index for faster queries
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_card_date 
      ON price_history(card_id, recorded_at)
    `);
  }

  // Record a price snapshot
  recordPrice(cardId, cardName, priceType, price) {
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
  getPriceHistory(cardId, days = 30) {
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
  getLatestPrice(cardId) {
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
  getTrackedCards() {
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
  cleanupOldData(days = 90) {
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

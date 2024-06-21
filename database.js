const sqlite3 = require('sqlite3').verbose();

const dbPath = '/home/bot/data/warns_bans.db'; // Adjust the path as needed

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error connecting to database ${dbPath}:`, err.message);
  } else {
    console.log(`Connected to SQLite database ${dbPath}`);

    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table "warns":', err.message);
      } else {
        console.log('Table "warns" initialized or already exists.');
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table "bans":', err.message);
      } else {
        console.log('Table "bans" initialized or already exists.');
      }
    });
  }
});

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err.message);
});

module.exports = db;

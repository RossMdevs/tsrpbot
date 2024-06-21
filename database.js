const sqlite3 = require('sqlite3').verbose();

// Specify the path to your SQLite database file
const dbPath = 'warns_bans.db';

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error connecting to database ${dbPath}:`, err.message);
  } else {
    console.log(`Connected to SQLite database ${dbPath}`);

    // Create table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table "warns" initialized or already exists.');
      }
    });
  }
});

module.exports = db;

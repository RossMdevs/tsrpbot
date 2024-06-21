// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('warns_bans.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create warns table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating warns table:', err.message);
      } else {
        console.log('Table "warns" initialized or already exists.');
      }
    });

    // Create bans table if not exists
    db.run(`CREATE TABLE IF NOT EXISTS bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating bans table:', err.message);
      } else {
        console.log('Table "bans" initialized or already exists.');
      }
    });
  }
});

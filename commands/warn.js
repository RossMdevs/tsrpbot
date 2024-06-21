module.exports = {
  name: 'warn',
  description: 'Warns a user.',
  async execute(message, args, db) {
    const user_id = args[0];
    const moderator_id = message.author.id;
    const reason = args.slice(1).join(' ');

    // Insert warn into database
    db.run(`INSERT INTO warns (user_id, moderator_id, reason) VALUES (?, ?, ?)`, [user_id, moderator_id, reason], function(err) {
      if (err) {
        console.error('Error inserting warn:', err.message);
        message.reply('Error: Failed to add warn. Please try again later.');
      } else {
        message.reply(`Warn added successfully for user ${user_id}.`);
        console.log(`Warn added by ${moderator_id} for user ${user_id}: ${reason}`);
      }
    });
  },
};


// Log a message to indicate that the help.js file has been read
console.log("warn.js started");

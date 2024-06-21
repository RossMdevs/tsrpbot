module.exports = {
  name: 'help',
  description: 'Displays available commands and their usage.',
  execute(message, args) {
    // Help command content
    const helpMessage = `Available commands:
    ○ **!request <details>** - Streamlines a request to the Board of Directors (Staff+)
    ○ **!report <details>** - Report an issue or user (Anyone can use this command)
    ○ **!role add/remove <user_id/user_mention/username> @role** - Add or remove roles for a user (Authorized Role Only)
    ○ **!help** - Display this help message.`;

    // Reply to the user with the help message
    message.channel.send(helpMessage);
  },
};

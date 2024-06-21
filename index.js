const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map();

// Load all command files from the commands directory
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log('TSRP Resources have started.');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Split the message content into command and arguments
  const [commandName, ...args] = message.content.trim().split(/\s+/);

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  try {
    // Pass db instance if command requires it
    await command.execute(message, args, db);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command!');
  }
});

client.login(process.env.DISCORD_TOKEN);

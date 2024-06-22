const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid'); // For generating UUIDs
require('dotenv').config(); // Load environment variables from .env file

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Replace with your allowed user IDs
const allowedUserIds = ['760626163147341844'];

// Define the role for requesting additions
const requestAddRole = '123456789012345678'; // Role ID allowed to request additions

// Define the channel ID where approval requests will be posted
const approvalChannelId = '1253717988675424296';

// Store pending add requests with tokens
const pendingAddRequests = new Map();

client.once('ready', () => {
  console.log('TSRP Tool has started.');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore messages from bots

  // Split the message content into command and arguments
  const [command, ...args] = message.content.trim().split(/\s+/);

  // Check if the command is "!help"
  if (command === '!help') {
    message.reply(`Available commands:
    ○ **!add username password** - Request to add a user to IRS (Request Add Role Required).
    ○ **!approve add username token** - Approve an add user request (Approve Add Role Required).`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add') {
      console.log(`Unauthorized user attempted !add command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.')
        .then(msg => msg.delete({ timeout: 5000 })); // Delete error message after 5 seconds
      message.delete().catch(console.error); // Delete the command message
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

  // Check if the command is "!add"
  if (command === '!add') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.has(requestAddRole)) {
      console.log(`Unauthorized user attempted !add command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.')
        .then(msg => msg.delete({ timeout: 5000 })); // Delete error message after 5 seconds
      message.delete().catch(console.error); // Delete the command message
      return;
    }

    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: `username password`.')
        .then(msg => msg.delete({ timeout: 5000 })); // Delete error message after 5 seconds
      message.delete().catch(console.error); // Delete the command message
      return;
    }

    const username = args[0];
    const password = args[1];

    // Generate a unique token (UUID) for this request
    const token = uuidv4();
    pendingAddRequests.set(token, { username, password });

    // Send request for approval to the approval channel
    const approvalChannel = client.channels.cache.get(approvalChannelId);
    if (!approvalChannel) {
      console.error(`Approval channel with ID ${approvalChannelId} not found.`);
      message.reply('**No!** Approval channel not found.')
        .then(msg => msg.delete({ timeout: 5000 })); // Delete error message after 5 seconds
      message.delete().catch(console.error); // Delete the command message
      return;
    }

    approvalChannel.send(`Request to add user "${username}" by ${message.author.tag}. Use \`!approve add ${username} ${token}\` to approve.`)
      .then(() => {
        message.reply('Your request has been submitted for approval.');
        console.log(`Add request by ${message.author.tag} (${message.author.id}) for user "${username}" has been logged.`);
        message.delete().catch(console.error); // Delete the command message after logging the request
      })
      .catch(error => {
        console.error('Error sending approval request:', error);
        message.reply('**No!** There was an error submitting your request.')
          .then(msg => msg.delete({ timeout: 5000 })); // Delete error message after 5 seconds
        message.delete().catch(console.error); // Delete the command message
      });
  }
});

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
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

// Define the role IDs for permission to use !request and !changerole
const roleForRequestID = '1176929445441982465'; // Role ID that can use !request
const rolesForChangeRole = ['1176929445441982465']; // Array of role IDs that can use !changerole

// Define the channel ID where requests and reports will be posted
const requestChannelId = '1253717988675424296';
const reportChannelId = 'ReportChannelID'; // Define the report channel ID

client.once('ready', () => {
  console.log('TSRP Tool has started.');
  console.log(`Requests Logger: ${requestChannelId}`);
  console.log(`Reports Logger: ${reportChannelId}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore messages from bots

  // Split the message content into command and arguments
  const [command, ...args] = message.content.trim().split(/\s+/);

  // Check if the command is "!help"
  if (command === '!help') {
    message.reply(`Available commands:
    ○ **!add username password** - Adds a user to IRS automatically. (Authorized Users Only)
    ○ **!request <details>** - Streamlines a request to the Board of Directors (Staff+)
    ○ **!report <details>** - Report an issue or user (Anyone can use this command)
    ○ **!role add/remove <user_id/user_mention/username> @role** - Add or remove roles for a user (Authorized Role Only)
    ○ **!help** - Display this help message.`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add') {
      console.log(`Unauthorized access attempt by: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted access to this command. This action will be logged.');
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

  // Handle !request command
  if (command === '!request') {
    handleRequestCommand(message, args);
  }

  // Handle !role command (formerly !changerole)
  if (command === '!role') {
    handleChangeRoleCommand(message, args);
  }
});

async function handleRequestCommand(message, args) {
  // Check if the author has the allowed role for !request
  const member = message.guild.members.cache.get(message.author.id);
  if (!member.roles.cache.has(roleForRequestID)) {
    console.log(`Unauthorized request attempt by: ${message.author.tag} (${message.author.id})`);
    message.reply('**No!**: You do not have permission to use this command.');
    return;
  }

  // Ensure the request has content
  if (args.length === 0) {
    message.reply('**No!** Please provide your request after the command.');
    return;
  }

  const requestContent = args.join(' ');

  // Find the request channel
  const requestChannel = client.channels.cache.get(requestChannelId);
  if (!requestChannel) {
    console.error(`Request channel with ID ${requestChannelId} not found.`);
    message.reply('**No!** Request channel not found.');
    return;
  }

  // Send the request to the request channel
  requestChannel.send(`Request from ${message.author.tag} (${message.author.id}): ${requestContent}`);
  message.reply('Your request has been submitted.');
  console.log(`Request executed by ${message.author.tag} (${message.author.id}): ${requestContent}`);
}

async function handleChangeRoleCommand(message, args) {
  // Check if the author has any of the allowed roles for !role (changerole)
  const member = message.guild.members.cache.get(message.author.id);
  if (!hasPermissionForChangeRole(member)) {
    console.log(`Unauthorized role change attempt by: ${message.author.tag} (${message.author.id})`);
    message.reply('**No!**: You do not have permission to use this command.');
    return;
  }

  // Ensure the command has the right format
  if (args.length < 3 || !['add', 'remove'].includes(args[0].toLowerCase())) {
    message.reply('**No!** This command requires at least three arguments: ``add/remove <user_id/user_mention/username> @role``.');
    return;
  }

  const action = args[0].toLowerCase(); // add or remove
  let userIdentifier = args[1]; // User ID, mention, or username
  const roleName = args.slice(2).join(' ').toLowerCase(); // Role name to search for

  // Check if the userIdentifier is a mention (strip off the "<@!>" if present)
  if (userIdentifier.startsWith('<@') && userIdentifier.endsWith('>')) {
    userIdentifier = userIdentifier.slice(3, -1); // Remove "<@!>" or "<@" and ">"
    if (userIdentifier.startsWith('!')) {
      userIdentifier = userIdentifier.slice(1); // Remove "!" if present
    }
  }

  // Find the user by ID, mention, or username in the guild
  let user = message.guild.members.cache.get(userIdentifier);
  if (!user) {
    // Attempt to find by username
    user = message.guild.members.cache.find(member => member.user.username.toLowerCase() === userIdentifier.toLowerCase());
  }

  if (!user) {
    message.reply(`**No!** Unable to find user "${userIdentifier}".`);
    return;
  }

  // Find the role in the guild by name
  const role = message.guild.roles.cache.find(role => role.name.toLowerCase() === roleName);

  if (!role) {
    message.reply(`**No!** Role "${roleName}" not found.`);
    return;
  }

  try {
    if (action === 'add') {
      await user.roles.add(role);
      message.reply(`I've added **${role.name}**  to **${user.user.tag}**.`);
      console.log(`Role ${role.name} added to ${user.user.tag} by ${message.author.tag}.`);
    } else if (action === 'remove') {
      await user.roles.remove(role);
      message.reply(`I've removed **${role.name}** from **${user.user.tag}**.`);
      console.log(`Role ${role.name} removed from ${user.user.tag} by ${message.author.tag}.`);
    }
  } catch (error) {
    console.error('Error adding/removing role:', error);
    message.reply('**Error!** Unable to add/remove role. Please check the bot permissions and try again.');
  }
}

function hasPermissionForChangeRole(member) {
  // Check if the member has any of the roles listed in rolesForChangeRole
  return rolesForChangeRole.some(roleID => member.roles.cache.has(roleID));
}

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

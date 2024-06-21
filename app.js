const { Client, GatewayIntentBits, Permissions } = require('discord.js');
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

// Define the allowed roles (role IDs) that can use !request command
const allowedRoles = ['1176929445441982465'];

// Define the channel ID where requests will be posted
const requestChannelId = '1253717988675424296';

client.once('ready', () => {
  console.log('Bot is ready.');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore messages from bots

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (message.content.startsWith('!add') || message.content.startsWith('!request')) {
      console.log(`AEDENIED: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted to access this command. This action will be logged.');
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

  // Split the message content into command and arguments
  const [command, ...args] = message.content.trim().split(/\s+/);

  // Check if the command is "!add"
  if (command === '!add') {
    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: ``username password``.');
      return;
    }

    const username = args[0];
    const password = args[1];

    // Execute htpasswd command to add a new user
    exec(`htpasswd -b /etc/apache2/.htpasswd "${username}" "${password}"`, async () => {
      // Send a response immediately after executing the command
      message.channel.send(`I've ran the command. I added user "${username}" to the IRS.`);
      await message.delete(); // Delete the command message after replying

      // Log a console message with the user's ID
      console.log(`Process Ran by ${message.author.id}`);

      // Execute grep command to search for the username in .htpasswd
      exec(`cat /etc/apache2/.htpasswd | grep "${username}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing grep command: ${error}`);
          return;
        }
        console.log(`Contents of /etc/apache2/.htpasswd for user "${username}":`);
        console.log(stdout);
      });
    });
  }

  // Check if the command is "!request"
  if (command === '!request') {
    // Check if the author has any of the allowed roles
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      console.log(`Unauthorized user attempted !request command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    // Ensure the request has content
    if (args.length === 0) {
      message.reply('**Improperly Formatted**: Please follow this format ``!request then what you need access to``.');
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
    await message.delete(); // Delete the command message after replying

  }
});

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

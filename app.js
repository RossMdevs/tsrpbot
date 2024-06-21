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

  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'Tarheel State Roleplay', type: 'WATCHING' }], // You can change WATCHING to PLAYING, LISTENING, or STREAMING
    status: 'online' // You can change this to idle, dnd, or invisible
  }).catch(console.error);
});
// Replace with your allowed user IDs
const allowedUserIds = ['760626163147341844'];

// Define the allowed roles (role IDs) that can use !request command
const allowedRoles = ['1176929445441982465'];

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
    ○ **!help** - Display this help message.`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add' || command === '!request') {
      console.log(`Unauthorized access attempt by: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted access to this command. This action will be logged.');
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

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
      message.channel.send(`I've run the command. I added user "${username}" to the IRS.`);
      await message.delete(); // Delete the command message after replying

      // Log a console message with the user's ID
      console.log(`User "${username}" added to IRS by ${message.author.tag} (${message.author.id})`);

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

  // Check if the command is "!report"
  if (command === '!report') {
    // Ensure the report has content
    if (args.length === 0) {
      message.reply('**No!** Please provide details of the report after the command.');
      return;
    }

    const reportContent = args.join(' ');

    // Find the report channel
    const reportChannel = client.channels.cache.get(reportChannelId);
    if (!reportChannel) {
      console.error(`Report channel with ID ${reportChannelId} not found.`);
      message.reply('**No!** Report channel not found.');
      return;
    }

    // Send the report to the report channel
    reportChannel.send(`Report from ${message.author.tag} (${message.author.id}): ${reportContent}`);
    message.reply('Your report has been submitted.');
    console.log(`Report executed by ${message.author.tag} (${message.author.id}): ${reportContent}`);
  }
});

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

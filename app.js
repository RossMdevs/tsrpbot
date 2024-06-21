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

// Define the role IDs for permission to use !request and !role
const roleForRequestID = '1176929445441982465'; // Role ID that can use !request
const rolesForChangeRole = ['1176929445441982465']; // Array of role IDs that can use !role

// Define the channel ID where requests and reports will be posted
const requestChannelId = '1253717988675424296';
const reportChannelId = '123456789012345678'; // Replace with your actual report channel ID

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

  // Handle !role command
  if (command === '!role') {
    handleChangeRoleCommand(message, args);
  }

  // Handle !report command
  if (command === '!report') {
    handleReportCommand(message, args);
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
  // Check if the author has any of the allowed roles for !role
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
  let userIdentifier = args[1]; // User ID, mention, or partial username
  const roleName = args.slice(2).join(' ').toLowerCase(); // Role name to search for

  // Check if the userIdentifier is a mention (strip off the "<@!>" if present)
  if (userIdentifier.startsWith('<@') && userIdentifier.endsWith('>')) {
    userIdentifier = userIdentifier.slice(3, -1); // Remove "<@!>" or "<@" and ">"
    if (userIdentifier.startsWith('!')) {
      userIdentifier = userIdentifier.slice(1); // Remove "!" if present
    }
  }

  // Find the user by ID or mention in the guild
  let user = message.guild.members.cache.get(userIdentifier);

  // If user is not found by ID or mention, attempt to find by partial username
  if (!user) {
    const usernameFilter = userIdentifier.toLowerCase();
    user = message.guild.members.cache.find(member =>
      member.user.username.toLowerCase().includes(usernameFilter)
    );
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
      if (user.roles.cache.has(role.id)) {
        message.reply(`**${user.user.tag}** already has the role **${role.name}**.`);
      } else {
        await user.roles.add(role);
        message.reply(`Role **${role.name}** successfully added to **${user.user.tag}**.`);
        console.log(`Role **${role.name}** added to **${user.user.tag}** by **${message.author.tag}**.`);
      }
    } else if (action === 'remove') {
      if (!user.roles.cache.has(role.id)) {
        message.reply(`**${user.user.tag}** does not have the role **${role.name}**.`);
      } else {
        await user.roles.remove(role);
        message.reply(`Role **${role.name}** successfully removed from **${user.user.tag}**.`);
        console.log(`Role ${role.name} removed from ${user.user.tag} by ${message.author.tag}.`);
      }
    }
  } catch (error) {
    console.error('Error adding/removing role:', error);
    message.reply('**Error!** Unable to add/remove role. Please check the bot permissions and try again.');
  }
}

async function handleReportCommand(message, args) {
  // Ensure the command has content
  if (args.length === 0) {
    message.reply('**No!** Please provide details for the report.');
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

  // Send a DM to the user who initiated the report
  try {
    await message.author.send(`Your report has been submitted:\n${reportContent}`);
  } catch (error) {
    console.error(`Failed to send DM to ${message.author.tag}:`, error);
  }
}

function hasPermissionForChangeRole(member) {
  // Check if the member has any of the roles listed in rolesForChangeRole
  return rolesForChangeRole.some(roleID => member.roles.cache.has(roleID));
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
      message.channel.send(`I've ran the command. I added user "${username}" to the IRS.`);
      await message.delete(); // Delete the command message after replying

      // Log a console message with the user's ID
      console.log(`IRS Adder tool Ran by ${message.author.tag}:(${message.author.id})`);

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
  client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

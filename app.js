const { Client, GatewayIntentBits, Permissions } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config(); // Load environment variables from .env file

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Replace with your allowed user IDs
const allowedUserIds = ['760626163147341844'];

// Define the allowed roles (role IDs) that can use !request, !timeout, !removetimeout, and !ban commands
const allowedRoles = ['1176929445441982465']; // These roles can use !request
const moderationPerms = ['1251360784584544256', '1252151997700767905', '1176929445441982465']; // These roles can use !timeout, !removetimeout, !ban, and !unban

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
    ○ **!timeout @user duration reason** - Puts a user in timeout for a specified duration (e.g., 10m, 1h).
    ○ **!removetimeout @user** - Removes the timeout from a user.
    ○ **!ban @user reason** - Bans a user from the server (Moderators+)
    ○ **!unban userID reason** - Unbans a user from the server (Moderators+)
    ○ **!help** - Display`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add' || command === '!request') {
      console.log(`AEDENIED: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted to access this command. This action will be logged.');
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

  // Check if the command is "!request"
  if (command === '!request') {
    // Check if the author has any of the allowed roles
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      console.log(`Unauthorized user attempted !request command: ${message.author.tag}:${message.author.id}`);
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
    requestChannel.send(`Request from ${message.author.tag} ${message.author.id}: ${requestContent}`);
    message.reply('Your request has been submitted.');
    console.log(`!request was executed by ${message.author.tag} (${message.author.id})`);
  }

  // Check if the command is "!ban"
  if (command === '!ban') {
    // Check if the author has any of the moderation permissions
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => moderationPerms.includes(role.id))) {
      console.log(`Unauthorized user attempted !ban command: ${message.author.tag}:${message.author.id}`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    // Get the user to ban
    const userToBan = message.mentions.members.first();
    if (!userToBan) {
      message.reply('**No!** Please mention the user to ban.');
      return;
    }

    // Get the ban reason from the command
    const banReason = args.slice(1).join(' ');

    // Ban the user
    await userToBan.ban({ reason: `Banned by ${message.author.tag} (${message.author.id}) for ${banReason}` })
      .then(() => {
        message.reply(`Successfully banned ${userToBan.user.tag} (${userToBan.user.id}) from the server.`);
        console.log(`User ${userToBan.user.tag} (${userToBan.user.id}) banned by ${message.author.tag} (${message.author.id}) for ${banReason}`);
      })
      .catch(error => {
        console.error(`Error banning user ${userToBan.user.tag} (${userToBan.user.id}):`, error);
        message.reply(`Failed to ban ${userToBan.user.tag}. Please check my permissions and try again.`);
      });
  }

  // Check if the command is "!unban"
  if (command === '!unban') {
    // Check if the author has any of the moderation permissions
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => moderationPerms.includes(role.id))) {
      console.log(`Unauthorized user attempted !unban command: ${message.author.tag}:${message.author.id}`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    // Get the user ID to unban
    const userID = args[0];
    if (!userID) {
      message.reply('**No!** Please provide the user ID to unban.');
      return;
    }

    // Get the unban reason from the command
    const unbanReason = args.slice(1).join(' ');

    // Unban the user
    message.guild.members.unban(userID, `Unbanned by ${message.author.tag} (${message.author.id}) for ${unbanReason}`)
      .then(() => {
        message.reply(`Successfully unbanned user with ID ${userID} from the server.`);
        console.log(`User with ID ${userID} unbanned by ${message.author.tag} (${message.author.id}) for ${unbanReason}`);
      })
      .catch(error => {
        console.error(`Error unbanning user with ID ${userID}:`, error);
        message.reply(`Failed to unban user with ID ${userID}. Please check my permissions and try again.`);
      });
  }

  // Check if the command is "!timeout"
  if (command === '!timeout') {
    // Check if the author has any of the moderation permissions
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => moderationPerms.includes(role.id))) {
      console.log(`Unauthorized user attempted !timeout command: ${message.author.tag}:${message.author.id}`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }



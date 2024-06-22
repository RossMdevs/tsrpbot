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

// Define the allowed roles (role IDs) that can use !role command
const allowedRoleManagerRoles = ['1176929445441982465'];

// Define the roles for requesting and approving additions
const requestAddRole = '1242009401917706241'; // Role ID allowed to request additions
const approveAddRole = ['234567890123456789', '1176929448407347273']; // Role IDs allowed to approve additions

// Define the channel ID where approval requests will be posted
const approvalChannelId = '1176929679911952554';

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
    ○ **!approve add username token** - Approve an add user request (Approve Add Role Required).
    ○ **!role add|remove @user|userID|partialName <role>** - Adds or removes a role from a user (Role Manager Role Required).`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add' || command === '!role' || command === '!approve') {
      console.log(`Access denied for user: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted access to this command. This action will be logged.');
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

  // Check if the command is "!add"
  if (command === '!add') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.has(requestAddRole)) {
      console.log(`Unauthorized user attempted !add command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.')
        .then(() => message.delete().catch(console.error)); // Delete the command message after replying
      return; // Exit if user doesn't have permission
    }

    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: `username password`.')
        .then(() => message.delete().catch(console.error)); // Delete the command message after replying
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
        .then(() => message.delete().catch(console.error)); // Delete the command message after replying
      return;
    }

    approvalChannel.send(`Request to add user "${username}" by ${message.author.tag}. Use \`!approve add ${username} ${token}\` to approve.`)
      .then(() => {
        message.reply('Your request has been submitted for approval.');
        console.log(`Add request by ${message.author.tag} (${message.author.id}) for user "${username}" has been logged.`);
        message.delete(); // Delete the command message after logging the request
      })
      .catch(error => {
        console.error('Error sending approval message:', error);
        message.reply('**No!** There was an error submitting your request. Please try again later.')
          .then(() => message.delete().catch(console.error)); // Delete the command message after replying
        console.log(`Error sending approval message for ${message.author.tag} (${message.author.id}): ${error.message}`);
      });
  }

  // Check if the command is "!approve"
  if (command === '!approve') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => approveAddRole.includes(role.id))) {
      console.log(`Unauthorized user attempted !approve command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    if (args.length !== 3 || args[0] !== 'add') {
      message.reply('**No!** This command requires the format: `!approve add username token`.');
      return;
    }

    const username = args[1];
    const token = args[2];

    // Check if the token exists in pending requests
    if (!pendingAddRequests.has(token)) {
      message.reply('**No!** Invalid token or request not found.');
      return;
    }

    const { password } = pendingAddRequests.get(token);

    // Execute htpasswd command to add a new user
    exec(`htpasswd -b /etc/apache2/.htpasswd "${username}" "${password}"`, async () => {
      // Send a response immediately after executing the command
      message.channel.send(`User "${username}" has been added to the IRS by ${message.author.tag}.`);
      // Log a console message with the user's ID
      console.log(`IRS Adder tool executed by ${message.author.tag} (${message.author.id}) for user "${username}".`);

      // Execute grep command to search for the username in .htpasswd
      exec(`cat /etc/apache2/.htpasswd | grep "${username}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing grep command: ${error}`);
          return;
        }
        console.log(`Contents of /etc/apache2/.htpasswd for user "${username}":`);
        console.log(stdout);
      });

      // Remove the token from pending requests after processing
      pendingAddRequests.delete(token);
    });
  }

  // Check if the command is "!role"
  if (command === '!role') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => allowedRoleManagerRoles.includes(role.id))) {
      console.log(`Unauthorized user attempted !role command: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    if (args.length < 3) {
      message.reply('**No!** This command requires at least three arguments: `add|remove @user|userID|partialName <role>`.');
      return;
    }

    const action = args[0];
    const userArg = args[1];
    const roleName = args.slice(2).join(' ');

    // Find the member
    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else {
      targetMember = message.guild.members.cache.find(m => m.id === userArg || m.user.username.includes(userArg) || (m.nickname && m.nickname.includes(userArg)));
    }

    if (!targetMember) {
      message.reply('**No!** User not found.');
      return;
    }

    // Find the role
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
    if (!role) {
      message.reply('**No!** Role not found.');
      return;
    }

    // Add or remove the role
    if (action === 'add') {
      if (targetMember.roles.cache.has(role.id)) {
        message.reply('**No!** User already has this role.');
      } else {
        targetMember.roles.add(role)
          .then(() => message.reply(`Role **${role.name}** has been added to ${targetMember.user.tag}.`))
          .catch(error => {
            console.error(`Error adding role: ${error}`);
            message.reply('**No!** There was an error adding the role.');
          });
      }
    } else if (action === 'remove') {
      if (!targetMember.roles.cache.has(role.id)) {
        message.reply('**No!** User does not have this role.');
      } else {
        targetMember.roles.remove(role)
          .then(() => message.reply(`Role **${role.name}** has been removed from ${targetMember.user.tag}.`))
          .catch(error => {
        console.error(`Error removing role: ${error}`);
        message.reply('**No!** There was an error removing the role.');
      });
  } else {
    message.reply('**No!** Invalid action. Use `add` or `remove`.');
  }
}
});

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

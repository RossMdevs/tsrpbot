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

client.once('ready', () => {
  console.log('TSRP Logger Started.');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignore messages from bots

  // Split the message content into command and arguments
  const [command, ...args] = message.content.trim().split(/\s+/);

  // Check if the command is "!help"
  if (command === '!help') {
    message.reply(`Available commands:
    ○ **!add username password** - Adds a user to IRS automatically. (Authorized Users Only)
    ○ **!role add|remove @user|userID|partialName <role>** - Adds or removes a role from a user.`);
    return;
  }

  // Check if the message author's ID is in the allowed list
  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add' || command === '!role') {
      console.log(`Access denied for user: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You are not granted to access this command. This action will be logged.');
    }
    return; // Ignore messages from unauthorized users for non-commands
  }

  // Check if the command is "!add"
  if (command === '!add') {
    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: `username password`.');
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
      console.log(`IRS Adder tool executed by ${message.author.tag} (${message.author.id})`);

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

  // Check if the command is "!role"
  if (command === '!role') {
    if (args.length < 3) {
      message.reply('**No!** This command requires at least three arguments: `add|remove @user|userID|partialName <role>`.');
      return;
    }

    const action = args[0];
    const userArg = args[1];
    const roleName = args.slice(2).join(' ');

    // Find the member
    let member;
    if (message.mentions.members.size > 0) {
      member = message.mentions.members.first();
    } else {
      member = message.guild.members.cache.find(m => m.id === userArg || m.user.username.includes(userArg) || (m.nickname && m.nickname.includes(userArg)));
    }

    if (!member) {
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
      if (member.roles.cache.has(role.id)) {
        message.reply('**No!** User already has this role.');
      } else {
        member.roles.add(role)
          .then(() => message.reply(`Role **${role.name}** has been added to ${member.user.tag}.`))
          .catch(error => {
            console.error(`Error adding role: ${error}`);
            message.reply('**No!** There was an error adding the role.');
          });
      }
    } else if (action === 'remove') {
      if (!member.roles.cache.has(role.id)) {
        message.reply('**No!** User does not have this role.');
      } else {
        member.roles.remove(role)
          .then(() => message.reply(`Role **${role.name}** has been removed from ${member.user.tag}.`))
          .catch(error => {
            console.error(`Error removing role: ${error}`);
            message.reply('**No!** There was an error removing the role.');
          });
      }
    } else {
      message.reply('**No!** Invalid action. Use `add` or `remove`.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN); // Retrieve bot token from environment variable

const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const allowedUserIds = ['760626163147341844'];
const addCommandChannelId = '1253976223944671243'; // Replace with your channel ID
const approvalChannelId = '1253973758637510718'; // Replace with your approval channel ID

const pendingAddRequests = new Map();

client.once('ready', () => {
  console.log('TSRP Tool has started.');
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const [command, ...args] = message.content.trim().split(/\s+/);

  if (command === '!help') {
    message.reply(`Available commands:
      ○ **!add username password** - Request to add a user to IRS.
      ○ **!approve add username token** - Approve an add user request.
      ○ **!role add|remove @user|userID|partialName <role>** - Adds or removes a role from a user.`);
    return;
  }

  if (!allowedUserIds.includes(message.author.id)) {
    if (command === '!add' || command === '!role' || command === '!approve') {
      console.log(`Access denied for user: ${message.author.tag} (${message.author.id})`);
      message.reply('This command is only authorized for **Staff Members**.');
    }
    return;
  }

  if (command === '!add') {
    if (message.channel.id !== addCommandChannelId) {
      message.reply('**No!** You can only use the !add command in the designated channel.');
      return;
    }

    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: `username password`.');
      return;
    }

    const username = args[0];
    const password = args[1];

    const token = uuidv4();
    pendingAddRequests.set(token, { username, password });

    message.reply(`Request to add user "${username}" by ${message.author.tag} has been received and is pending approval.`)
      .then(() => {
        console.log(`Add request by ${message.author.tag} (${message.author.id}) for user "${username}" has been logged.`);
        message.delete();
      })
      .catch(error => {
        console.error('Error sending confirmation message:', error);
        message.reply('**No!** There was an error submitting your request. Please try again later.')
          .then(() => message.delete().catch(console.error));
        console.log(`Error sending confirmation message for ${message.author.tag} (${message.author.id}): ${error.message}`);
      });

    const approvalChannel = client.channels.cache.get(approvalChannelId);
    if (!approvalChannel) {
      console.error(`Approval channel with ID ${approvalChannelId} not found.`);
      message.reply('**No!** Approval channel not found.')
        .then(() => message.delete().catch(console.error));
      return;
    }

    approvalChannel.send(`Request to add user "${username}" by ${message.author.tag}. Use \`!approve add ${username} ${token}\` to approve.`)
      .then(() => {
        console.log(`Approval request for user "${username}" sent to approval channel.`);
      })
      .catch(error => {
        console.error('Error sending approval request:', error);
        message.reply('**No!** There was an error submitting your request for approval.')
          .then(() => message.delete().catch(console.error));
        console.log(`Error sending approval request for ${message.author.tag} (${message.author.id}): ${error.message}`);
      });
  }

  if (command === '!approve') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => approveAddRoles.includes(role.id))) {
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

    if (!pendingAddRequests.has(token)) {
      message.reply('**No!** Invalid token or request not found.');
      return;
    }

    const { password } = pendingAddRequests.get(token);

    exec(`htpasswd -b /etc/apache2/.htpasswd "${username}" "${password}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing htpasswd command: ${error}`);
        message.reply('**No!** There was an error approving the user request.');
        return;
      }

      console.log(`User "${username}" has been added to the IRS by ${message.author.tag}.`);
      console.log(`Contents of /etc/apache2/.htpasswd for user "${username}":`);
      console.log(stdout);

      message.channel.send(`User "${username}" has been added to the IRS by ${message.author.tag}.`);

      pendingAddRequests.delete(token);
    });
  }

  if (command === '!role') {
    const member = message.guild.members.cache.get(message.author.id);
    if (!member.roles.cache.some(role => approveAddRoles.includes(role.id))) {
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

    const role = message.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
    if (!role) {
      message.reply('**No!** Role not found.');
      return;
    }

    if (action === 'add') {
      if (targetMember.roles.cache.has(role.id)) {
        message.reply(`**No!** ${targetMember.user.tag} already has this role.`);
      } else {
        try {
          await targetMember.roles.add(role);
          message.reply(`Role **${role.name}** has been added to ${targetMember.user.tag}.`);
        } catch (error) {
          console.error(`Error adding role: ${error}`);
          message.reply('**No!** There was an error adding the role.');
        }
      }
    } else if (action === 'remove') {
      if (!targetMember.roles.cache.has(role.id)) {
        message.reply(`**No!** ${targetMember.user.tag} does not have this role.`);
      } else {
        try {
          await targetMember.roles.remove(role);
          message.reply(`Role **${role.name}** has been removed from ${targetMember.user.tag}.`);
        } catch (error) {
          console.error(`Error removing role: ${error}`);
          message.reply('**No!** There was an error removing the role.');
        }
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

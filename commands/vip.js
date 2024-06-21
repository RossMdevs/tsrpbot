// commands/vip.js

const { allowedRoles } = require('../config.json'); // Replace with your actual config path
const Discord = require('discord.js');

module.exports = {
  name: 'vip',
  description: 'Assigns a VIP role to a user.',
  async execute(message, args) { // Mark the function as async
    // Check if the author has any of the allowed roles for !vip
    const member = message.guild.members.cache.get(message.author.id);
    if (!hasPermissionForVIP(member)) {
      console.log(`Unauthorized VIP role assignment attempt by: ${message.author.tag} (${message.author.id})`);
      message.reply('**No!**: You do not have permission to use this command.');
      return;
    }

    // Ensure the command has the right format
    if (args.length < 1) {
      message.reply('**No!** This command requires at least one argument: `<user_id/user_mention/username>`.');
      return;
    }

    let userIdentifier = args[0]; // User ID, mention, or partial username

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

    // Find the VIP role in the guild
    const vipRole = message.guild.roles.cache.find(role => role.name === 'VIP'); // Replace 'VIP' with your actual VIP role name

    if (!vipRole) {
      message.reply('**No!** The "VIP" role does not exist. Please create it.');
      return;
    }

    try {
      // Add the VIP role to the user
      if (user.roles.cache.has(vipRole.id)) {
        message.reply(`**${user.user.tag}** already has the VIP role.`);
      } else {
        await user.roles.add(vipRole);
        message.reply(`VIP role successfully added to **${user.user.tag}**.`);
        console.log(`VIP role added to **${user.user.tag}** by **${message.author.tag}**.`);
      }
    } catch (error) {
      console.error('Error adding VIP role:', error);
      message.reply('**Error!** Unable to add VIP role. Please check the bot permissions and try again.');
    }
  },
};

function hasPermissionForVIP(member) {
  // Check if the member has any of the roles listed in allowedRoles for VIP role assignment
  return allowedRoles.some(roleID => member.roles.cache.has(roleID));
}

// Log a message to indicate that the role.js file has been read
console.log("vip.js started");

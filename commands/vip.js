// commands/vip.js
const Discord = require('discord.js');

module.exports = {
  name: 'vip',
  description: 'Assigns VIP role to a user.',
  execute(message, args) {
    // Define the IDs of roles allowed to use this command
    const allowedRoles = ['1176929451943141460', '1239786870469296179', '1176929448407347273', '1176929445441982465', '1159695692135137320']; // Replace with actual role IDs

    // Check if the user has any of the allowed roles
    if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      return message.reply('You do not have permission to use this command.');
    }

    // Determine the user to assign VIP
    let userToVIP = message.mentions.members.first(); // Check for mentions first
    if (!userToVIP) {
      // If no mention, try finding by Discord ID
      userToVIP = message.guild.members.cache.get(args[0]);
      if (!userToVIP) {
        // If not found by ID, search by username/nickname
        const searchString = args.join(' ').toLowerCase();
        userToVIP = message.guild.members.cache.find(member =>
          member.user.username.toLowerCase().includes(searchString) ||
          (member.nickname && member.nickname.toLowerCase().includes(searchString))
        );
      }
    }

    // If user still not found, respond with an error
    if (!userToVIP) {
      return message.reply('Unable to find the user. Please mention a user, provide their ID, or use their username/nickname.');
    }

    // Add VIP role logic here
    const vipRole = message.guild.roles.cache.find(role => role.name === 'VIP Pass'); // Replace 'VIP' with actual VIP role name

    if (!vipRole) {
      return message.reply('The "VIP" role does not exist. Please create it.');
    }

    try {
      // Add the VIP role to the user
      userToVIP.roles.add(vipRole);
      // Send a success message
      message.channel.send(`**${userToVIP}** has been assigned **VIP Status**.`);
    } catch (error) {
      console.error('Error assigning VIP role:', error);
      message.reply('Failed to assign the VIP role. Please try again later.');
    }
  },
};

console.log("Start VIP.js logic")

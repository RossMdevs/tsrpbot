// commands/role.js

module.exports = {
    name: 'role',
    description: 'Add or remove roles for a user.',
    async execute(message, args) {
      // Replace with your allowed role IDs that can use !role
      const rolesForChangeRole = ['1176929445441982465'];
  
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
    },
  };
  
  function hasPermissionForChangeRole(member) {
    // Check if the member has any of the roles listed in rolesForChangeRole
    return rolesForChangeRole.some(roleID => member.roles.cache.has(roleID));
  }
  
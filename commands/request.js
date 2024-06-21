// commands/request.js

module.exports = {
    name: 'request',
    description: 'Streams a request to the Board of Directors.',
    async execute(message, args) {
      // Replace with your role ID that can use !request
      const roleForRequestID = '1176929445441982465';
  
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
  
      // Find the request channel ID (replace with your actual request channel ID)
      const requestChannelId = '1253717988675424296';
      const requestChannel = message.guild.channels.cache.get(requestChannelId);
      if (!requestChannel) {
        console.error(`Request channel with ID ${requestChannelId} not found.`);
        message.reply('**No!** Request channel not found.');
        return;
      }
  
      // Send the request to the request channel
      requestChannel.send(`Request from ${message.author.tag} (${message.author.id}): ${requestContent}`);
      message.reply('Your request has been submitted.');
      console.log(`Request executed by ${message.author.tag} (${message.author.id}): ${requestContent}`);
    },
  };
  
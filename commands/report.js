// commands/report.js

module.exports = {
    name: 'report',
    description: 'Report an issue or user.',
    async execute(message, args) {
      // Ensure the command has content
      if (args.length === 0) {
        message.reply('**No!** Please provide details for the report.');
        return;
      }
  
      const reportContent = args.join(' ');
  
      // Replace with your actual report channel ID
      const reportChannelId = '123456789012345678'; // Replace with your actual report channel ID
  
      // Find the report channel
      const reportChannel = message.client.channels.cache.get(reportChannelId);
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
    },
  };

// Log a message to indicate that the help.js file has been read
console.log("report.js started");

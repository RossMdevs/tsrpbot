// commands/add.js

const { exec } = require('child_process');

module.exports = {
  name: 'add',
  description: 'Adds a user to IRS.',
  async execute(message, args) {
    console.log('Executing !add command.');

    if (args.length !== 2) {
      message.reply('**No!** This command requires **exactly** two arguments: ``username password``.');
      return;
    }

    const username = args[0];
    const password = args[1];

    // Execute htpasswd command to add a new user
    exec(`htpasswd -b /etc/apache2/.htpasswd "${username}" "${password}"`, async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing htpasswd command: ${error}`);
        message.reply('**Error!** Failed to add user. Please check the bot permissions and try again.');
        return;
      }

      // Send a response immediately after executing the command
      try {
        await message.channel.send(`I've run the command. I added user "${username}" to the IRS.`);
        await message.delete(); // Delete the command message after replying
        console.log(`Command response sent to channel ${message.channel.id}.`);
      } catch (err) {
        console.error('Error sending message to channel:', err);
      }

      // Log a console message with the user's ID
      console.log(`IRS Adder tool ran by ${message.author.tag} (${message.author.id})`);
      console.log(`Output of htpasswd command:\n${stdout}`);

      // Check if the command produced any error message
      if (stderr) {
        console.error(`Error output from htpasswd command:\n${stderr}`);
      }
    });
  },
};

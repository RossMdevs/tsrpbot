// commands/add.js

const { exec } = require('child_process');

module.exports = {
  name: 'add',
  description: 'Adds a user to IRS.',
  async execute(message, args) {
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
  },
};

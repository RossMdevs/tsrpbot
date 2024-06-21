// commands/add.js

const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

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

    try {
      // Execute htpasswd command to add a new user
      const { stdout, stderr } = await execPromise(`htpasswd -b /etc/apache2/.htpasswd "${username}" "${password}"`);

      // Log the command output
      console.log(`Command output for adding user "${username}":`);
      console.log(stdout);
      if (stderr) console.error(`Error output: ${stderr}`);

      // Send a response in the channel
      message.channel.send(`User "${username}" successfully added to the IRS.`);

      // Log a console message with the user's ID
      console.log(`IRS Adder tool ran by ${message.author.tag} (${message.author.id})`);

      // Execute grep command to search for the username in .htpasswd
      const { stdout: grepOutput, stderr: grepError } = await execPromise(`cat /etc/apache2/.htpasswd | grep "${username}"`);
      if (grepError) console.error(`Error executing grep command: ${grepError}`);
      console.log(`Contents of /etc/apache2/.htpasswd for user "${username}":`);
      console.log(grepOutput);
    } catch (error) {
      console.error('Error executing htpasswd command:', error);
      message.reply('**Error!** Unable to add user. Please check the bot permissions and try again.');
    } finally {
      // Delete the command message after processing
      await message.delete().catch(console.error);
    }
  },
};

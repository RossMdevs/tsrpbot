const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map();

// Load all command files from the commands directory
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.name, command);
}

client.once('ready', () => {
  console.log('TSRP Resources have started.');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Split the message content into command and arguments
  const [commandName, ...args] = message.content.trim().split(/\s+/);

  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  try {
    if (commandName === 'add') { // Check if the command is 'add'
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
        message.channel.send(`I've run the command. I added user "${username}" to the IRS.`);
        await message.delete(); // Delete the command message after replying

        // Log a console message with the user's ID
        console.log(`IRS Adder tool ran by ${message.author.tag} (${message.author.id})`);
        console.log(`Output of htpasswd command:\n${stdout}`);

        // Check if the command produced any error message
        if (stderr) {
          console.error(`Error output from htpasswd command:\n${stderr}`);
        }
      });
    } else {
      await command.execute(message, args); // Execute other commands normally
    }
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command!');
  }
});

client.login(process.env.DISCORD_TOKEN);

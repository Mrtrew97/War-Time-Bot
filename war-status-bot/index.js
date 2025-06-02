require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`Received command: ${interaction.commandName} from user ${interaction.user.tag}`);

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`No command matching ${interaction.commandName} found.`);
    return interaction.reply({ content: 'Command not found!', ephemeral: true });
  }

  try {
    await command.execute(interaction);
    console.log(`Successfully executed command: ${interaction.commandName}`);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

// --- Add this Express web server to keep bot alive ---

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive and well!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// --- Load environment variables ---
require('dotenv').config();

// --- Set up the web server (for Render + UptimeRobot pinging) ---
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is alive and well!');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// --- Discord bot setup ---
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// --- Load commands ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// --- Ready event ---
client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// --- Handle interactions ---
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`📥 Command: ${interaction.commandName} from ${interaction.user.tag}`);

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`⚠️ No command matching ${interaction.commandName} found.`);
    return interaction.reply({ content: 'Command not found!', ephemeral: true });
  }

  try {
    await command.execute(interaction);
    console.log(`✅ Executed command: ${interaction.commandName}`);
  } catch (error) {
    console.error(`❌ Error executing command ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
  }
});

// --- Start the bot ---
client.login(process.env.DISCORD_TOKEN);

const { SlashCommandBuilder, ChannelType } = require('discord.js');
// Use a constant for the ephemeral flag (64 is the value for ephemeral)
const EPHEMERAL_FLAG = 64;

const colors = {
  red: '🔴 Emergency',
  blue: '🔵 No war Merit Trading Allowed',
  green: '🟢 Peaceful Zone',
  yellow: '🟡 Caution Zone',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('war')
    .setDescription('Rename voice channel based on war status')
    .addSubcommand(subcommand =>
      subcommand
        .setName('red')
        .setDescription('Set status to red-war'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('blue')
        .setDescription('Set status to blue-war'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('green')
        .setDescription('Set status to green-war'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('yellow')
        .setDescription('Set status to yellow-war')),
        
  async execute(interaction) {
    const color = interaction.options.getSubcommand();
    const newName = colors[color];
    console.log(`Received subcommand: ${color}, newName: ${newName}`);
    
    // Defer reply using flags with our constant
    await interaction.deferReply({ flags: EPHEMERAL_FLAG });
    
    const channel = interaction.guild.channels.cache.get(process.env.VOICE_CHANNEL_ID);
    if (!channel) {
      return interaction.editReply({ content: 'Voice channel not found.', flags: EPHEMERAL_FLAG });
    }
    if (channel.type !== ChannelType.GuildVoice) {
      return interaction.editReply({ content: 'Channel is not a voice channel.', flags: EPHEMERAL_FLAG });
    }
    
    console.log(`Attempting to rename channel ${channel.name} (${channel.id}) → ${newName}`);
    
    try {
      // Race the setName call against a 10-second timeout
      await Promise.race([
        channel.setName(newName),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout renaming channel')), 10000)
        )
      ]);
      console.log('Channel renamed successfully.');
      return interaction.editReply({ content: `Voice channel renamed to ${newName}`, flags: EPHEMERAL_FLAG });
    } catch (error) {
      console.error('Error during rename:', error);
      let errorMsg = 'Failed to rename voice channel.';
      if (error.code === 50013) {
        errorMsg = 'Bot lacks Manage Channels permission.';
      } else if (error.message === 'Timeout renaming channel') {
        errorMsg = 'Operation timed out. Try again in a moment.';
      }
      return interaction.editReply({ content: errorMsg, flags: EPHEMERAL_FLAG });
    }
  },
};

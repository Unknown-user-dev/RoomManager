const { Client, GatewayIntentBits, Events, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./whitelist.db');
const config = require('../config.json');

module.exports = {
	name: Events.ClientReady,
	once: true,

	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);


		const guild = client.guilds.cache.get('251317306724974593');

		if (guild) {
			joinVoiceChannelInGuild(guild, config.monitoredChannelId);
		} else {
			console.error('Guild not found');
		}
	}
};

function joinVoiceChannelInGuild(guild, voiceChannelId) {
	const voiceChannel = guild.channels.cache.get(voiceChannelId);

	if (voiceChannel && voiceChannel.type === ChannelType.GuildVoice) {
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: guild.id,
			adapterCreator: guild.voiceAdapterCreator,
		});

		connection.on('stateChange', (oldState, newState) => {
			console.log(`Connection state changed from ${oldState.status} to ${newState.status}`);
		});

		console.log('Connected to voice channel');
	} else {
		console.error('Voice channel not found or invalid type:', voiceChannelId);
	}
}

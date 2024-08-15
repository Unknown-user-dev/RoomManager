const fs = require("fs");
const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	REST,
	Routes,
	ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events
} = require("discord.js");
const { token, client_id, test_guild_id } = require("./config.json");
/**********************************************************************/
// User Database Whitelist
/**********************************************************************/
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./whitelist.db');
/**********************************************************************/
const ytdl = require('@distube/ytdl-core');
const { Readable } = require('stream');
const gtts = require('gtts');
const {joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType, AudioPlayerStatus} = require("@discordjs/voice");

/**********************************************************************/
// Config Space ✨
/**********************************************************************/
const adminId = ["", ""];
const adminIds = ["", ""];

const YOUTUBE_URL = '';

const monitoredChannelId = '';
const whitelistedChannelId = '';
const guildId = '';
/**********************************************************************/

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});




const eventFiles = fs
	.readdirSync("./events")
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(
			event.name,
			async (...args) => await event.execute(...args, client)
		);
	}
}


client.commands = new Collection();
client.slashCommands = new Collection();
client.buttonCommands = new Collection();
client.selectCommands = new Collection();
client.contextCommands = new Collection();
client.modalCommands = new Collection();
client.cooldowns = new Collection();
client.autocompleteInteractions = new Collection();
client.triggers = new Collection();

const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
	const commandFiles = fs
		.readdirSync(`./commands/${folder}`)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

const slashCommands = fs.readdirSync("./interactions/slash");


for (const module of slashCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/slash/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/slash/${module}/${commandFile}`);
		client.slashCommands.set(command.data.name, command);
	}
}

const autocompleteInteractions = fs.readdirSync("./interactions/autocomplete");


for (const module of autocompleteInteractions) {
	const files = fs
		.readdirSync(`./interactions/autocomplete/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const interactionFile of files) {
		const interaction = require(`./interactions/autocomplete/${module}/${interactionFile}`);
		client.autocompleteInteractions.set(interaction.name, interaction);
	}
}

const contextMenus = fs.readdirSync("./interactions/context-menus");


for (const folder of contextMenus) {
	const files = fs
		.readdirSync(`./interactions/context-menus/${folder}`)
		.filter((file) => file.endsWith(".js"));
	for (const file of files) {
		const menu = require(`./interactions/context-menus/${folder}/${file}`);
		const keyName = `${folder.toUpperCase()} ${menu.data.name}`;
		client.contextCommands.set(keyName, menu);
	}
}



const buttonCommands = fs.readdirSync("./interactions/buttons");

for (const module of buttonCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/buttons/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/buttons/${module}/${commandFile}`);
		client.buttonCommands.set(command.id, command);
	}
}




const modalCommands = fs.readdirSync("./interactions/modals");


for (const module of modalCommands) {
	const commandFiles = fs
		.readdirSync(`./interactions/modals/${module}`)
		.filter((file) => file.endsWith(".js"));

	for (const commandFile of commandFiles) {
		const command = require(`./interactions/modals/${module}/${commandFile}`);
		client.modalCommands.set(command.id, command);
	}
}


const selectMenus = fs.readdirSync("./interactions/select-menus");

for (const module of selectMenus) {
	const commandFiles = fs
		.readdirSync(`./interactions/select-menus/${module}`)
		.filter((file) => file.endsWith(".js"));
	for (const commandFile of commandFiles) {
		const command = require(`./interactions/select-menus/${module}/${commandFile}`);
		client.selectCommands.set(command.id, command);
	}
}

const rest = new REST({ version: "9" }).setToken(token);

const commandJsonData = [
	...Array.from(client.slashCommands.values()).map((c) => c.data.toJSON()),
	...Array.from(client.contextCommands.values()).map((c) => c.data),
];

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(

			Routes.applicationGuildCommands(client_id, test_guild_id),

			{ body: commandJsonData }
		);

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();

const triggerFolders = fs.readdirSync("./triggers");

for (const folder of triggerFolders) {
	const triggerFiles = fs
		.readdirSync(`./triggers/${folder}`)
		.filter((file) => file.endsWith(".js"));
	for (const file of triggerFiles) {
		const trigger = require(`./triggers/${folder}/${file}`);
		client.triggers.set(trigger.name, trigger);
	}
}

const channelCache = {};

let player = createAudioPlayer();
let musicResource;

function createMusicResource() {
	try {
		return createAudioResource(ytdl(YOUTUBE_URL, { filter: 'audioonly', quality: 'highestaudio' }), {
			inputType: StreamType.Arbitrary,
		});
	} catch (error) {
		console.error('Failed to create music resource:', error);
		return null;
	}
}

function createTTSResource(text) {
	try {
		const tts = new gtts(text);
		return createAudioResource(tts.stream(), {
			inputType: StreamType.Arbitrary,
		});
	} catch (error) {
		console.error('Failed to create TTS resource:', error);
		return null;
	}
}

function playMusicInLoop(connection) {
	musicResource = createMusicResource();

	if (!musicResource) {
		console.error('Music resource creation failed.');
		return;
	}

	player.play(musicResource);
	connection.subscribe(player);

	player.on(AudioPlayerStatus.Idle, () => {
		console.log('Music ended, restarting.');
		playMusicInLoop(connection);
	});

	player.on('error', (error) => {
		console.error('AudioPlayerError:', error);
		setTimeout(() => playMusicInLoop(connection), 5000);
	});

	console.log('Started playing YouTube audio in loop.');
}

function setMusicVolume(volume) {
	if (volume < 0 || volume > 1) {
		console.error('Volume must be between 0 and 1.');
		return;
	}
	musicResource = createMusicResource();
	if (musicResource) {
		player.stop();
		player.play(musicResource);
	}
}


client.once('ready', async () => {

	const guild = await client.guilds.fetch(guildId);
	channelCache[whitelistedChannelId] = guild.channels.cache.get(whitelistedChannelId);


	const waitChannel = guild.channels.cache.get(monitoredChannelId);
	if (waitChannel && waitChannel.type === ChannelType.GuildVoice) {
		const connection = joinVoiceChannel({
			channelId: waitChannel.id,
			guildId: guild.id,
			adapterCreator: guild.voiceAdapterCreator,
		});

		playMusicInLoop(connection);
	} else {
		console.error('Wait channel not found or invalid type.');
	}
});

client.on('voiceStateUpdate', async (oldState, newState) => {
	console.log('Voice state updated.');

	const { channelId, member } = newState;

	if (!member || !member.guild) return;
	if (member.id === client.user.id) {
		console.log('Ignored self.');
		return;
	}

	if (!channelId) {
		console.log('No channelId, skipping.');
		return;
	}

	if (channelId === monitoredChannelId) {
		console.log('User joined the monitored channel.');

		const guildMember = await member.guild.members.fetch(member.id);
		db.get('SELECT * FROM whitelist WHERE userId = ?', [member.id], async (err, row) => {
			if (err) {
				console.error('Database error:', err);
				return;
			}

			if (row) {
				console.log(`${member.user.tag} is whitelisted.`);
				const whitelistedChannel = channelCache[whitelistedChannelId];
				if (!whitelistedChannel) {
					console.error(`Whitelist channel not found in cache. ID: ${whitelistedChannelId}`);
				} else if (whitelistedChannel.type !== ChannelType.GuildVoice) {
					console.error(`Whitelist channel type invalid: Expected voice channel, got ${whitelistedChannel.type}`);
				} else {
					try {
						await guildMember.voice.setChannel(whitelistedChannel);
						console.log(`Moved ${member.user.tag} to the whitelisted channel.`);
					} catch (error) {
						console.error('Error moving member:', error);
					}
				}
			} else {
				console.log(`${member.user.tag} is not whitelisted.`);
				const whitelistedChannel = channelCache[whitelistedChannelId];
				if (whitelistedChannel && whitelistedChannel.members.some(m => adminId.includes(m.id))) {
					await sendMoveRequest(member);
				}
				const connection = joinVoiceChannel({
					channelId: monitoredChannelId,
					guildId: member.guild.id,
					adapterCreator: member.guild.voiceAdapterCreator,
				});

				const ttsPlayer = createAudioPlayer();
				const ttsResource = createTTSResource('Welcome to the waiting room. Please hold on.');

				if (!ttsResource) {
					console.error('TTS resource creation failed.');
					return;
				}

				setMusicVolume(0.1);

				ttsPlayer.play(ttsResource);
				connection.subscribe(ttsPlayer);

				ttsPlayer.on(AudioPlayerStatus.Idle, () => {
					console.log('TTS playback finished.');
					setMusicVolume(0.3);
					playMusicInLoop(connection);
				});

				ttsPlayer.on('error', (error) => {
					console.error('AudioPlayerError:', error);
					setMusicVolume(0.3);
					playMusicInLoop(connection);
				});
			}
		});
	} else {
		console.log('User did not join the monitored channel.');
	}
});

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
	console.error('Uncaught exception:', error);
});


async function sendMoveRequest(member) {
	if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
		console.error('Invalid adminIds:', adminIds);
		return;
	}

	try {
		const guild = member.guild;
		const whitelistedChannel = channelCache[whitelistedChannelId];

		if (!whitelistedChannel || whitelistedChannel.type !== ChannelType.GuildVoice) {
			console.error('Whitelist channel not found or invalid type.');
			return;
		}

		for (const id of adminIds) {
			const adminMember = await guild.members.fetch(id);
			if (adminMember.voice.channelId === whitelistedChannelId) {
				const user = await client.users.fetch(id);

				if (!user) {
					console.error('Admin user not found for ID:', id);
					continue;
				}

				const embed = new EmbedBuilder()
					.setTitle('Demande de Moove')
					.setDescription(`Un utilisateur a demandé un moove.\n\n**Heure de la demande :** ${new Date().toLocaleString()}\n**Pseudo :** ${member.user.tag}`)
					.setColor('#0099ff')
					.setTimestamp();

				await user.send({ embeds: [embed] });
				console.log(`Move request sent to ${user.tag}`);
			} else {
				console.log(`Admin ${adminMember.user.tag} is not connected to the whitelisted channel. No message sent.`);
			}
		}
	} catch (error) {
		console.error('Error checking admin status or sending move request DM:', error);
	}
}

client.login(token);

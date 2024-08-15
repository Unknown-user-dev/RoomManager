const { Events } = require("discord.js");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		const { client } = interaction;
		if (!interaction.isStringSelectMenu()) return;

		const command = client.selectCommands.get(interaction.customId);
		if (!command) {
			return await require("../messages/defaultSelectError").execute(interaction);
		}

		try {
			await command.execute(interaction);
		} catch (err) {
			console.error(err);
			await interaction.reply({
				content: "There was an issue while executing that select menu option!",
				ephemeral: true,
			});
		}
	},
};

const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,

	async execute(message) {
		const args = message.content.split(/ +/);
		if (message.author.bot) return;

		let triggered = false;

		message.client.triggers.every((trigger) => {
			trigger.name.every(async (name) => {
				if (message.content.includes(name)) {
					try {
						trigger.execute(message, args);
					} catch (error) {
						console.error(error);
						message.reply({
							content: "there was an error trying to execute that trigger!",
						});
					}
					triggered = true;
					return false;
				}
			});
		});
	},
};

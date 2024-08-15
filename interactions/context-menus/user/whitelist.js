const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./whitelist.db');

const adminIds = ["921126770340683886", "742312687014248521"]; // IDs des administrateurs autorisés

/**
 * @type {import('../../../typings').ContextInteractionCommand}
 */
module.exports = {
    data: {
        name: "Manage Whitelist",
        type: 2, // 2 is for user context menus
    },

    async execute(interaction) {
        // Vérifiez si l'utilisateur est un administrateur autorisé
        if (!adminIds.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
        }

        const targetUserId = interaction.targetId;

        db.get('SELECT * FROM whitelist WHERE userId = ?', [targetUserId], (err, row) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: 'Erreur de base de données !', ephemeral: true });
            }

            if (row) {
                // Si l'utilisateur est déjà sur la liste blanche, le retirer
                db.run('DELETE FROM whitelist WHERE userId = ?', [targetUserId], function(err) {
                    if (err) {
                        console.error(err);
                        return interaction.reply({ content: 'Erreur lors du retrait de la liste blanche.', ephemeral: true });
                    }

                    return interaction.reply({ content: `Retiré <@${targetUserId}> de la liste blanche.`, ephemeral: true });
                });
            } else {
                // Si l'utilisateur n'est pas sur la liste blanche, l'ajouter
                db.run('INSERT INTO whitelist (userId) VALUES (?)', [targetUserId], function(err) {
                    if (err) {
                        console.error(err);
                        return interaction.reply({ content: 'Erreur lors de l\'ajout à la liste blanche.', ephemeral: true });
                    }

                    return interaction.reply({ content: `Ajouté <@${targetUserId}> à la liste blanche.`, ephemeral: true });
                });
            }
        });
    },
};

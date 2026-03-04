// clanmission.js

const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'clanmission',
    description: 'Displays clan mission details.',
    async execute(message, args) {
        const missions = [
            { name: 'Mission A', completed: true },
            { name: 'Mission B', completed: false },
            { name: 'Mission C', completed: false, skipped: true },
            // more missions...
        ];

        let completedMissions = '';  
        let skippedMissions = '';

        missions.forEach(mission => {
            if (mission.completed) {
                completedMissions += `✅ **${mission.name}**\n`;
            } else if (mission.skipped) {
                skippedMissions += `⏭️ **${mission.name}** (Skipped)\n`;
            } else {
                skippedMissions += `❌ **${mission.name}** (Pending)\n`;
            }
        });

        const embed = new MessageEmbed()
            .setTitle('Clan Missions')
            .setColor('#0099ff')
            .setDescription('Here are the details of your clan missions:
\n**Completed Missions:**\n' + (completedMissions || 'None') + '\n**Skipped Missions:**\n' + (skippedMissions || 'None'))  
            .setTimestamp()
            .setFooter('Stay strong, warriors!');

        message.channel.send({ embeds: [embed] });
    },
};
const { SlashCommandBuilder } = require("discord.js");
const { missionData } = require("../missionData.js");

const missionChoices = [
  { name: "Breach", value: "Breach" },
  { name: "B.S.S", value: "B.S.S" },
  { name: "Basic Mission", value: "Basic Mission" },
  { name: "Bayonet", value: "Bayonet" },
  { name: "Clean Up", value: "Clean Up" },
  { name: "Common Only", value: "Common Only" },
  { name: "Cover", value: "Cover" },
  { name: "Hammer", value: "Hammer" },
  { name: "HILDR", value: "HILDR" },
  { name: "Knife", value: "Knife" },
  { name: "Local", value: "Local" },
  { name: "Logistics", value: "Logistics" },
  { name: "Rare Only", value: "Rare Only" },
  { name: "Recon", value: "Recon" },
  { name: "Showdown", value: "Showdown" },
  { name: "Uncommon Only", value: "Uncommon Only" }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("missions")
    .setDescription("Show operators for up to 8 missions")
    .addStringOption(option => {
      option.setName("m1").setDescription("Mission 1").setRequired(true);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m2").setDescription("Mission 2").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m3").setDescription("Mission 3").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m4").setDescription("Mission 4").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m5").setDescription("Mission 5").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m6").setDescription("Mission 6").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m7").setDescription("Mission 7").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    })
    .addStringOption(option => {
      option.setName("m8").setDescription("Mission 8").setRequired(false);
      missionChoices.forEach(choice => option.addChoices(choice));
      return option;
    }),

  async execute(interaction) {
    const missions = [];
    for (let i = 1; i <= 8; i++) {
      const m = interaction.options.getString(`m${i}`);
      if (m) missions.push(m);
    }
    if (missions.length === 0) {
      return interaction.reply("❌ You must pick at least one mission.");
    }

    const used = new Set();
    let reply = "";
    missions.forEach((mission, i) => {
      // All operators sorted by value (desc)
      const allOps = Object.entries(missionData[mission] || {}).sort((a, b) => b[1] - a[1]);
      // Prefer operators not yet used across previous missions
      let candidates = allOps.filter(([op]) => !used.has(op)).map(([op]) => op);
      // Pick top 4
      let selected = candidates.slice(0, 4);
      // Ensure Mia appears if she exists for this mission
      if (missionData[mission] && Object.prototype.hasOwnProperty.call(missionData[mission], 'Mia') && !selected.includes('Mia')) {
        if (selected.length >= 4) {
          selected[3] = 'Mia';
        } else {
          selected.push('Mia');
        }
      }
      // Mark selected as used so duplicates are avoided for other missions
      selected.forEach(op => used.add(op));
      reply += `M${i + 1} - ${mission}:\n${selected.join(", ")}\n\n`;
    });
    await interaction.reply(reply);
  },
};
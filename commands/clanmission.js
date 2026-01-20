const { SlashCommandBuilder } = require("discord.js");
const { missionData } = require("../missionData.js");

const missionChoices = [
  { name: "Skip", value: "Skip" },
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

// Assign each operator to the selected mission where they have the highest value
function assignBestOperators(missions) {
  // For each operator, find the mission (from selected) where their value is highest
  const operatorAssignments = {};
  for (const mission of missions) {
    if (mission === "skip") continue;
    const ops = missionData[mission] || {};
    for (const [op, value] of Object.entries(ops)) {
      if (!operatorAssignments[op] || value > operatorAssignments[op].value) {
        operatorAssignments[op] = { mission, value };
      }
    }
  }
  // Group operators by their assigned mission
  const results = {};
  for (const mission of missions) {
    if (mission === "skip") continue;
    results[mission] = [];
  }
  for (const [op, { mission, value }] of Object.entries(operatorAssignments)) {
    if (results[mission]) {
      results[mission].push({ op, value });
    }
  }
  // Sort each mission's operators by value descending
  for (const mission of missions) {
    if (mission === "skip") continue;
    results[mission].sort((a, b) => b.value - a.value);
  }
  return results;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clanmission")
    .setDescription("Pick missions and get best operators placement for your clan")
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

    // Filter out skipped missions
    const filteredMissions = missions.filter(m => m !== "skip");
    if (filteredMissions.length === 0) {
      return interaction.reply("❌ You must pick at least one mission.");
    }

    const results = assignBestOperators(missions);

    let reply = "**Best operator placement for your clan:**\n\n";
    missions.forEach((m, i) => {
      if (m === "skip") {
        reply += `M${i + 1} - (skipped)\n\n`;
        return;
      }
      // Ensure Mia is visible alongside other operators for this mission
      let opsList = results[m] && results[m].length ? results[m].map(o => ({ op: o.op, value: o.value })) : [];
      if (missionData[m] && Object.prototype.hasOwnProperty.call(missionData[m], 'Mia')) {
        const hasMia = opsList.some(x => x.op === 'Mia');
        if (!hasMia) {
          // Insert Mia at the front so she's easily visible
          opsList.unshift({ op: 'Mia', value: missionData[m]['Mia'] });
        }
      }
      const ops = opsList.length ? opsList.map(o => `${o.op} (${o.value})`).join(', ') : "No operators found for this mission";
      reply += `M${i + 1} - ${m}:\n${ops}\n\n`;
    });

    await interaction.reply(reply);
  },
};
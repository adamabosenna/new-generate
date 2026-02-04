const { SlashCommandBuilder } = require("discord.js");
const { AttachmentBuilder } = require("discord.js");
const generateMissionImage = require("../image/generateMissionImage.js");
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
  const operatorAssignments = {};
  for (const mission of missions) {
    if (!mission || mission.toLowerCase() === "skip") continue;
    const ops = missionData[mission] || {};
    for (const [op, value] of Object.entries(ops)) {
      if (!operatorAssignments[op] || value > operatorAssignments[op].value) {
        operatorAssignments[op] = { mission, value };
      }
    }
  }

  const results = {};
  for (const mission of missions) {
    if (!mission || mission.toLowerCase() === "skip") continue;
    results[mission] = [];
  }

  for (const [op, { mission, value }] of Object.entries(operatorAssignments)) {
    if (results[mission]) {
      results[mission].push({ op, value });
    }
  }

  for (const mission of Object.keys(results)) {
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
    // 1️⃣ GET MISSIONS (always produce 8 slots; missing options -> "Skip")
    const missions = [];
    for (let i = 1; i <= 8; i++) {
      const m = interaction.options.getString(`m${i}`);
      missions.push(m ? m : "Skip");
    }

    // Defer early so Discord shows "bot is thinking"
    await interaction.deferReply();

    // Ensure at least one non-skip mission
    const nonSkip = missions.filter(m => m && m.toLowerCase() !== "skip");
    if (nonSkip.length === 0) {
      return interaction.editReply("❌ You must pick at least one mission.");
    }

    // Assign best operators (pass full missions so assignment respects all slots)
    const results = assignBestOperators(missions);

    // Build textual reply, preserving skipped slots in output order
    let reply = "**Best operator placement for your clan:**\n\n";
    missions.forEach((m, i) => {
      if (!m || m.toLowerCase() === "skip") {
        reply += `M${i + 1} - (skipped)\n\n`;
        return;
      }
      const opsList = results[m] && results[m].length ? results[m].map(o => ({ op: o.op, value: o.value })) : [];
      const ops = opsList.length ? opsList.map(o => `${o.op} (${o.value})`).join(', ') : "No operators found for this mission";
      reply += `M${i + 1} - ${m}:\n${ops}\n\n`;
    });

    try {
      // Build mission objects for the image — ALWAYS 8 slots (skipped slots kept)
      // Use SAME operators as shown in message (from results)
      const missionObjects = missions.map(m => {
        if (!m || m.toLowerCase() === "skip") {
          return { name: "Skip", operators: [] };
        }
        const missionOps = results[m] || [];
        return {
          name: m,
          operators: missionOps.map(o => ({ name: o.op, value: o.value }))
        };
      });

      // Debug logs to help verify correct input to image generator
      console.log("MISSIONS FOR IMAGE:", missionObjects.map(m => m.name));

      // Generate image buffer
      console.log("Starting image generation...");
      const buffer = await generateMissionImage(missionObjects);
      console.log("Image generated. Buffer:", buffer ? `${buffer.length} bytes` : "null/undefined");

      // Validate buffer
      if (!buffer || buffer.length === 0) {
        console.error("generateMissionImage returned an invalid buffer");
        throw new Error("Invalid image buffer");
      }

      console.log("Creating attachment...");
      const attachment = new AttachmentBuilder(buffer, { name: "clan_mission.png" });
      console.log("Attachment created. Sending reply with image...");

      // Send text + image in ONE editReply
      const response = await interaction.editReply({
        content: reply,
        files: [attachment],
      });
      console.log("✅ Reply sent successfully with image!");
      
    } catch (err) {
      console.error("❌ Error in image generation/sending:", err.message || err);
      console.error("Error stack:", err.stack);
      // Fallback: send textual reply only
      try {
        console.log("Sending fallback text-only reply...");
        await interaction.editReply({ content: reply });
        console.log("Fallback reply sent");
      } catch (editErr) {
        console.error("Error editing reply with fallback text:", editErr);
      }
    }
  },
};
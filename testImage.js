const generateMissionImage = require("./image/generateMissionImage");
const fs = require("fs");
const path = require("path");

(async () => {
  const sampleMissions = [
    { name: "B.S.S", operators: [{ name: "Mia", value: 151 }, { name: "Diana", value: 416 }] },
    { name: "Basic Mission", operators: [{ name: "Mia", value: 169 }, { name: "Miro", value: 323 }] },
    { name: "Showdown", operators: [{ name: "Mia", value: 151 }, { name: "Zloy", value: 496 }] },
    { name: "Rare Only", operators: [{ name: "Syndrome", value: 407 }] },
    { name: "Uncommon Only", operators: [{ name: "Klaus", value: 264 }] },
    { name: "Recon", operators: [{ name: "Snek", value: 382 }] },
    { name: "Cover", operators: [{ name: "JB", value: 496 }] },
    { name: "Skip", operators: [] }
  ];

  try {
    const buffer = await generateMissionImage(sampleMissions);
    console.log("Test: Buffer length:", buffer && buffer.length);
    const outPath = path.resolve(process.cwd(), "clan_mission_test.png");
    fs.writeFileSync(outPath, buffer);
    console.log("Test: Saved", outPath);
  } catch (err) {
    console.error("Test image generation failed:", err && err.stack ? err.stack : err);
  }
})();
const fs = require('fs');
const path = require('path');
const operatorImages = require('./operatorImages');
const { missionData } = require('./missionData');

function normalizeKey(name) {
  if (!name) return "";
  return name.toString().toLowerCase().trim().replace(/\s+/g, "_").replace(/\.+/g, "");
}

function possibleFileNames(base) {
  const variants = [];
  if (base) variants.push(base);
  const noExt = base ? base.replace(/\.[^.]+$/, "") : base;
  if (noExt) {
    variants.push(noExt + ".png");
    variants.push(noExt + ".jpeg");
    variants.push(noExt + ".jpg");
    variants.push(noExt + ".png.jpeg");
    variants.push(noExt + ".png.jpg");
  }
  return Array.from(new Set(variants));
}

const operatorDirs = [
  path.join(__dirname, "image", "operators"),
  path.join(__dirname, "images", "operators"),
  path.join(process.cwd(), "image", "operators"),
  path.join(process.cwd(), "images", "operators")
];

console.log("Checking operator directories:");
for (const d of operatorDirs) {
  console.log(` - ${d} : ${fs.existsSync(d) ? "EXISTS" : "NOT FOUND"}`);
}

const usedOperators = new Set();
for (const mission of Object.values(missionData)) {
  for (const op of Object.keys(mission || {})) {
    usedOperators.add(op);
  }
}

const normalizedOperatorImages = {};
for (const [k, v] of Object.entries(operatorImages)) {
  normalizedOperatorImages[normalizeKey(k)] = v;
  // also include mapping by base filename if value contains extension
  const base = v && v.replace(/\.[^.]+$/, "");
  if (base) normalizedOperatorImages[normalizeKey(base)] = v;
}

console.log(`\nTotal distinct operators used in missionData: ${usedOperators.size}\n`);

const missingMappings = [];
const missingFiles = [];

for (const op of Array.from(usedOperators).sort()) {
  const key = normalizeKey(op);
  const mapped = normalizedOperatorImages[key] || operatorImages[op] || operatorImages[op.trim()];
  const candidates = [];
  if (mapped) candidates.push(...possibleFileNames(mapped));
  candidates.push(...possibleFileNames(key));
  candidates.push(...possibleFileNames(op));
  // unique
  const uniq = Array.from(new Set(candidates)).filter(Boolean);
  let found = false;
  let foundPath = null;
  for (const dir of operatorDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const fname of uniq) {
      const p = path.join(dir, fname);
      if (fs.existsSync(p)) {
        found = true;
        foundPath = p;
        break;
      }
    }
    if (found) break;
  }

  if (!mapped) {
    missingMappings.push({ op, key });
  }
  if (!found) {
    missingFiles.push({ op, mapped: mapped || null, tried: uniq.slice(0,6) });
    console.log(`MISSING FILE -> ${op} (normalized: ${key}) ; mapped="${mapped}" ; tried: ${uniq.slice(0,6).join(', ')}`);
  } else {
    console.log(`OK -> ${op}  (mapped="${mapped}")  => file found: ${foundPath}`);
  }
}

console.log("\nSummary:");
console.log(" - operators with NO mapping entry in operatorImages (normalized):", missingMappings.length);
if (missingMappings.length) console.log(missingMappings.map(m=>m.op).join(", "));
console.log(" - operators with NO matching file found on disk:", missingFiles.length);
if (missingFiles.length) console.log(missingFiles.map(m=>m.op).join(", "));
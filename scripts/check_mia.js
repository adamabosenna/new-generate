const fs = require('fs');
const path = require('path');
const txt = fs.readFileSync(path.resolve(__dirname, '..', 'missionData.js'), 'utf8');
const regex = /\bMia\b/g;
const matches = txt.match(regex) || [];
console.log('occurrences (word) in file:', matches.length);
if (matches.length) {
  // Print a few lines around the first match
  const idx = txt.search(regex);
  const start = Math.max(0, idx - 50);
  const end = Math.min(txt.length, idx + 50);
  console.log('surrounding text:', txt.slice(start, end));
}
const md = require('../missionData.js').missionData;
console.log('Mia present in parsed missions:');
for (const [m, ops] of Object.entries(md)) {
  if (Object.keys(ops).includes('Mia')) console.log(' -', m, ops['Mia']);
}
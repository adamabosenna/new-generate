// diag.js
const fs = require('fs');
const path = require('path');

function listDir(dir) {
  try {
    const exists = fs.existsSync(dir);
    const files = exists ? fs.readdirSync(dir).slice(0, 200) : [];
    return { dir, exists, sample: files };
  } catch (e) {
    return { dir, exists: false, error: e && e.message };
  }
}

console.log('=== Environment / Paths ===');
console.log('process.cwd():', process.cwd());
console.log('__filename:', __filename);
console.log('__dirname:', __dirname);

const candidateDirs = [
  path.join(__dirname, 'image', 'operators'),
  path.join(__dirname, 'images', 'operators'),
  path.join(__dirname, 'assets', 'image', 'operators'),
  path.join(__dirname, 'assets', 'images', 'operators'),
  path.join(process.cwd(), 'image', 'operators'),
  path.join(process.cwd(), 'images', 'operators')
];

console.log('\n=== Checking candidate operator directories (first 50 files shown) ===');
for (const d of candidateDirs) {
  const info = listDir(d);
  if (info.exists) {
    console.log(`- ${d} : EXISTS ; sample (${info.sample.length}):`, info.sample.slice(0,50));
  } else {
    if (info.error) console.log(`- ${d} : ERROR ${info.error}`);
    else console.log(`- ${d} : NOT FOUND`);
  }
}

console.log('\n=== Full listing for the directory you actually use ===');
const actual = candidateDirs.find(d => fs.existsSync(d));
if (actual) {
  try {
    const all = fs.readdirSync(actual);
    console.log(`Directory used: ${actual} (total files: ${all.length})`);
    all.slice(0,200).forEach(f => console.log('  ', f));
  } catch (e) {
    console.log('Could not read directory contents:', e && e.message);
  }
} else {
  console.log('No candidate operator directory exists. Make sure images are in one of the candidate directories listed above.');
}

console.log('\n=== Quick checks for a few expected files ===');
const checkNames = ['mia', 'diana', 'chen_li', 'jb', 'moses'];
for (const name of checkNames) {
  const patterns = [ `${name}.png`, `${name}.png.jpeg`, `${name}.jpeg`, `${name}.jpg`, `${name}.png.jpg`, `${name}` ];
  const found = [];
  for (const d of candidateDirs) {
    if (!fs.existsSync(d)) continue;
    for (const p of patterns) {
      const pth = path.join(d, p);
      if (fs.existsSync(pth)) found.push(pth);
    }
  }
  if (found.length) console.log(`FOUND for "${name}":`, found.slice(0,10));
  else console.log(`NOT FOUND for "${name}" (tried ${patterns.join(', ')})`);
}

console.log('\n=== End of diag ===');
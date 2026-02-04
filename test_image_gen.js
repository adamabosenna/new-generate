const generateMissionImage = require('./image/generateMissionImage');

(async () => {
  console.log('=== Testing Image Generation ===');
  const missions = [
    { name: 'Breach', operators: [ { name: 'Moses' }, { name: 'Diana' } ] },
    { name: 'Skip', operators: [] },
    { name: 'Bayonet', operators: [ { name: 'Chen li' } ] }
  ];

  try {
    console.log('Starting image generation...');
    const buffer = await generateMissionImage(missions);
    console.log('\n✅ Image generated successfully!');
    console.log('Buffer size:', buffer.length, 'bytes');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  }
})();

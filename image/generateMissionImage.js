// Font Registration
import { registerFont } from 'canvas';
registerFont('path/to/font.ttf', { family: 'CustomFont' });

// Modify the function to display 'Skipped' for unselected missions
function generateMissionImage(selectedMissions) {
    const canvas = createCanvas(800, 600);
    const context = canvas.getContext('2d');
    // Iterate over the mission slots
    for (let i = 0; i < 5; i++) {
        if (selectedMissions[i]) {
            context.fillText(selectedMissions[i].name, 50, 50 + i * 100);
        } else {
            context.fillText('Skipped', 50, 50 + i * 100);
            // Visual feedback can include a different color or style
            context.fillStyle = 'red';
            context.fillText('Skipped', 50, 50 + i * 100);
            context.fillStyle = 'black'; // Reset to default color
        }
    }
    return canvas.toBuffer();
}
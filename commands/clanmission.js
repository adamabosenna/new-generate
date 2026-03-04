// Updated clan mission command

const clanMission = async (missions) => {
    // Step 1: Beautify operator names by removing numbers
    const beautifiedMissions = missions.map(mission => {
        return {
            ...mission,
            operatorNames: mission.operatorNames.map(name => name.replace(/\d+/g, '')) // Removing numbers
        };
    });

    // Step 2: Logic to put operators with SAME stars in the LAST mission only 
    const finalMissions = {};

    beautifiedMissions.forEach(mission => {
        mission.operatorSlot.forEach(operator => {
            const starRating = operator.stars;
            if (!finalMissions[starRating]) {
                finalMissions[starRating] = mission;
            } else {
                finalMissions[starRating].operatorSlot = finalMissions[starRating].operatorSlot.concat(operator);
            }
        });
    });

    // Create an array for the image generation with all 8 mission slots
    const imageData = Object.values(finalMissions).slice(0, 8); // Assume we only need 8 missions

    // Step 3: Pass correct data structure to image generator
    passToImageGenerator(imageData);
};

const passToImageGenerator = (data) => {
    // Logic to interface with image generator
    console.log('Sending data to the image generator:', data);
};

module.exports = clanMission;
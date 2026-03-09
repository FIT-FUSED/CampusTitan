/**
 * Campus Environment Matrix
 * Returns time-based simulated campus zone data for the AI Wellness Coach
 */

export const getCurrentCampusEnvironment = () => {
    const hour = new Date().getHours();
    
    let timePeriod;
    let zones;
    
    if (hour >= 6 && hour < 9) {
        // Morning (06:00 - 09:00)
        timePeriod = 'morning';
        zones = [
            { name: 'Main Gym', crowdLevel: 'Crowded', noiseLevel: '85dB', status: 'Open' },
            { name: 'Library', crowdLevel: 'Quiet', noiseLevel: '35dB', status: 'Open' },
            { name: 'Courtyard', crowdLevel: 'Moderate', noiseLevel: '50dB', status: 'Open' },
        ];
    } else if (hour >= 9 && hour < 17) {
        // Daytime (09:00 - 17:00)
        timePeriod = 'daytime';
        zones = [
            { name: 'Academic Blocks', crowdLevel: 'Crowded', noiseLevel: '75dB', status: 'Open' },
            { name: 'Main Gym', crowdLevel: 'Quiet', noiseLevel: '40dB', status: 'Open' },
            { name: 'SAC', crowdLevel: 'Moderate', noiseLevel: '60dB', status: 'Open' },
        ];
    } else if (hour >= 17 && hour < 21) {
        // Evening (17:00 - 21:00)
        timePeriod = 'evening';
        zones = [
            { name: 'Main Gym', crowdLevel: 'Packed', noiseLevel: '95dB', status: 'Open' },
            { name: 'SAC', crowdLevel: 'Loud', noiseLevel: '85dB', status: 'Open' },
            { name: 'Library', crowdLevel: 'Moderate', noiseLevel: '50dB', status: 'Open' },
        ];
    } else {
        // Night (21:00 - 06:00)
        timePeriod = 'night';
        zones = [
            { name: 'Library', crowdLevel: 'Crowded', noiseLevel: '65dB', status: 'Open' },
            { name: 'Courtyard', crowdLevel: 'Quiet', noiseLevel: '30dB', status: 'Open' },
            { name: 'Main Gym', crowdLevel: 'N/A', noiseLevel: 'N/A', status: 'Closed' },
        ];
    }
    
    // Mock weather data
    const weather = {
        aqi: 120,
        temperature: 32,
        humidity: 65,
        condition: 'Partly Cloudy',
    };
    
    return {
        timePeriod,
        hour,
        zones,
        weather,
        lastUpdated: new Date().toISOString(),
    };
};

// Helper to get just the zone recommendations
export const getZoneRecommendation = (preference = 'quiet') => {
    const env = getCurrentCampusEnvironment();
    const openZones = env.zones.filter(z => z.status === 'Open');
    
    if (preference === 'quiet') {
        return openZones.find(z => z.noiseLevel.includes('35') || z.noiseLevel.includes('30') || z.noiseLevel.includes('40')) || openZones[0];
    }
    if (preference === 'activity') {
        return openZones.find(z => z.crowdLevel === 'Packed' || z.crowdLevel === 'Crowded') || openZones[0];
    }
    return openZones[0];
};

export default getCurrentCampusEnvironment;


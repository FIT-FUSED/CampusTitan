import * as ScreenTimeModule from '../../modules/expo-screen-time';

// Common Android package names
const CATEGORY_MAP = {
    // Work / Study
    'com.slack': 'work_screen_hours',
    'com.microsoft.teams': 'work_screen_hours',
    'com.google.android.apps.docs': 'work_screen_hours', // Google Docs
    'com.google.android.gm': 'work_screen_hours', // Gmail
    'com.linkedin.android': 'work_screen_hours',
    'com.notion.mo': 'work_screen_hours',

    // Leisure / Social
    'com.instagram.android': 'leisure_screen_hours',
    'com.facebook.katana': 'leisure_screen_hours',
    'com.zhiliaoapp.musically': 'leisure_screen_hours', // TikTok
    'com.google.android.youtube': 'leisure_screen_hours',
    'com.netflix.mediaclient': 'leisure_screen_hours',
    'com.spotify.music': 'leisure_screen_hours',
    'com.whatsapp': 'leisure_screen_hours',
};

export async function checkAndRequestPermission() {
    try {
        if (!ScreenTimeModule || !ScreenTimeModule.hasUsagePermission) {
            console.log("UsageStats Native Module not available (Expo Go?)");
            return false;
        }
        const hasPermission = ScreenTimeModule.hasUsagePermission();
        if (!hasPermission) {
            ScreenTimeModule.requestUsagePermission();
            return false;
        }
        return true;
    } catch (error) {
        console.log("Not running in a native build or module not found");
        return false;
    }
}

export function fetchCategorizedScreenTime() {
    try {
        if (!ScreenTimeModule || !ScreenTimeModule.getDailyUsageStats) {
            return { screen_time_hours: 0, work_screen_hours: 0, leisure_screen_hours: 0 };
        }
        const stats = ScreenTimeModule.getDailyUsageStats() || {};

        let totalMs = 0;
        let workMs = 0;
        let leisureMs = 0;

        for (const [pkg, timeMs] of Object.entries(stats)) {
            totalMs += timeMs;

            const category = CATEGORY_MAP[pkg];
            if (category === 'work_screen_hours') {
                workMs += timeMs;
            } else if (category === 'leisure_screen_hours') {
                leisureMs += timeMs;
            }
        }

        // Convert ms to hours
        return {
            screen_time_hours: parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2)),
            work_screen_hours: parseFloat((workMs / (1000 * 60 * 60)).toFixed(2)),
            leisure_screen_hours: parseFloat((leisureMs / (1000 * 60 * 60)).toFixed(2)),
        };
    } catch (error) {
        console.log("Could not fetch screen time - fallback to defaults", error);
        return {
            screen_time_hours: 0,
            work_screen_hours: 0,
            leisure_screen_hours: 0
        };
    }
}

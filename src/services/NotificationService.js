import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    constructor() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    }

    async register() {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            return false;
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6366F1',
            });
        }

        return true;
    }

    async shouldSendRainNotification() {
        try {
            const key = 'last_rain_notification_ts';
            const lastTsRaw = await AsyncStorage.getItem(key);
            const lastTs = lastTsRaw ? Number(lastTsRaw) : 0;
            const now = Date.now();
            const sixHoursMs = 6 * 60 * 60 * 1000;
            if (Number.isFinite(lastTs) && now - lastTs < sixHoursMs) {
                return false;
            }
            await AsyncStorage.setItem(key, String(now));
            return true;
        } catch {
            return true;
        }
    }

    async sendRainSuggestionNotification({ condition, suggestions }) {
        const canNotify = await this.register();
        if (!canNotify) return;

        const shouldSend = await this.shouldSendRainNotification();
        if (!shouldSend) return;

        const suggestionText = Array.isArray(suggestions) && suggestions.length
            ? suggestions.slice(0, 2).join(' • ')
            : 'Try an indoor workout or yoga today.';

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌧️ Rain alert',
                body: `It looks like ${condition || 'it’s raining'} right now. Indoor idea: ${suggestionText}`,
                data: { type: 'rain_suggestion' },
                sound: true,
            },
            trigger: null,
        });
    }

    async sendBadgeNotification(badge) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🏅 New Achievement Unlocked!',
                body: `You've earned the ${badge.title} badge! ${badge.description}`,
                data: { badgeId: badge.id },
                sound: true,
            },
            trigger: null, // show immediately
        });
    }
}

export default new NotificationService();

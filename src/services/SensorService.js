import { Pedometer } from 'expo-sensors';
import { Alert, Linking } from 'react-native';

class SensorService {
    constructor() {
        this.subscription = null;
        this.stepCount = 0;
        this.isAvailable = false;
        this.listeners = [];
        this.permissionStatus = null;
        this.isTracking = false;
    }

    async checkAvailability() {
        try {
            const result = await Pedometer.isAvailableAsync();
            console.log('[SensorService] Pedometer Availability:', result);
            this.isAvailable = result;
            return result;
        } catch (error) {
            console.error('[SensorService] Availability Error:', error);
            this.isAvailable = false;
            return false;
        }
    }

    async requestPermissions() {
        try {
            console.log('[SensorService] Requesting Physical Activity Permission...');
            const { granted, status, canAskAgain } = await Pedometer.requestPermissionsAsync();
            console.log('[SensorService] Pedometer Permission Result:', { granted, status });

            this.permissionStatus = status;

            if (!granted) {
                // If permission is denied and the OS won't show the prompt again,
                // guide the user to Settings.
                if (canAskAgain === false) {
                    Alert.alert(
                        'Permission required',
                        'To track steps, allow Physical Activity permission in Settings.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: () => {
                                    try {
                                        Linking.openSettings();
                                    } catch (e) {
                                        console.error('[SensorService] openSettings Error:', e);
                                    }
                                },
                            },
                        ]
                    );
                }
            }

            return granted;
        } catch (error) {
            console.error('[SensorService] requestPermissions Error:', error);
            return false;
        }
    }

    async startTracking(callback) {
        const available = await this.checkAvailability();
        if (!available) {
            console.error('[SensorService] Pedometer not available on device');
            return;
        }

        // If already tracking, do nothing
        if (this.isTracking) {
            console.log('[SensorService] Already tracking, ignoring startTracking');
            return;
        }

        try {
            const { granted, status, canAskAgain } = await Pedometer.getPermissionsAsync();
            console.log('[SensorService] Current permission status:', { status, granted, canAskAgain });

            // If already granted, proceed. Otherwise request once to trigger the native prompt.
            const isGranted = granted ? true : await this.requestPermissions();

            if (!isGranted) {
                console.log('[SensorService] Tracking aborted: Permission not granted');
                return;
            }

            // Mark as tracking
            this.isTracking = true;

            console.log('[SensorService] Starting watchStepCount...');
            this.subscription = Pedometer.watchStepCount(result => {
                console.log('[SensorService] Steps Received:', result.steps);
                this.stepCount = result.steps;
                if (callback) callback(this.stepCount);
                this.notifyListeners(this.stepCount);
            });
        } catch (error) {
            console.error('[SensorService] startTracking Error:', error);
        }
    }

    stopTracking() {
        if (this.subscription) {
            console.log('[SensorService] Stopping tracking...');
            this.subscription.remove();
            this.subscription = null;
        }
        this.isTracking = false;
    }

    addListener(callback) {
        if (!this.listeners.includes(callback)) {
            this.listeners.push(callback);
        }
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners(steps) {
        this.listeners.forEach(callback => callback(steps));
    }

    async incrementStep(callback) {
        if (!this.permissionStatus || this.permissionStatus !== 'granted') {
            const granted = await this.requestPermissions();
            if (!granted) return;
        }
        this.stepCount += 1;
        console.log('[SensorService] Incremented step count to:', this.stepCount);
        if (callback) callback(this.stepCount);
        this.notifyListeners(this.stepCount);
    }
}

export const sensorService = new SensorService();
export default sensorService;

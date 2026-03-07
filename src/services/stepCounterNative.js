import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const Native = NativeModules?.StepCounterModule || null;

export async function isAvailable() {
    if (Platform.OS !== 'android' || !Native) return false;
    return typeof Native.isAvailable === 'function' ? await Native.isAvailable() : false;
}

export async function hasPermission() {
    if (Platform.OS !== 'android') return false;
    const status = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
    return !!status;
}

export async function requestPermission() {
    if (Platform.OS !== 'android') return false;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
    return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getRawStepCounter() {
    if (Platform.OS !== 'android' || !Native) return null;
    if (typeof Native.getStepCounter !== 'function') return null;
    const v = await Native.getStepCounter();
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

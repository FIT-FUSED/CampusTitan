import { Pedometer } from "expo-sensors";
import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasUsagePermissionSafely,
  fetchCategorizedScreenTime,
} from "./screenTimeMapper";
import * as StepCounterNative from "./stepCounterNative";

const DAILY_STEPS_KEY = "@daily_steps";
const LAST_STEP_DATE_KEY = "@last_step_date";
const STEP_COUNTER_BASELINE_KEY = "@step_counter_baseline";
const STEP_COUNTER_BASELINE_DATE_KEY = "@step_counter_baseline_date";
const STRIDE_KM_PER_STEP = 0.0008; // ~1250 steps per km
const CALORIES_PER_STEP = 0.04; // rough avg walking

class SensorService {
  constructor() {
    this.stepCount = 0;
    this.lastStepDate = null;
    this.permissionStatus = null;
    this.listeners = [];
    this.isTracking = false;
    this.isAvailable = false;
  }

  async checkAvailability() {
    try {
      const available = await Pedometer.isAvailableAsync();
      this.isAvailable = available;
      return available;
    } catch (error) {
      console.error("[SensorService] Availability Error:", error);
      this.isAvailable = false;
      return false;
    }
  }

  async checkPermissions() {
    try {
      const result = await Pedometer.getPermissionsAsync();
      this.permissionStatus = result.status;
      return result.granted;
    } catch (error) {
      console.error("[SensorService] Permission Check Error:", error);
      this.permissionStatus = "denied";
      return false;
    }
  }

  async requestPermissions() {
    try {
      console.log("[SensorService] Requesting Physical Activity Permission...");
      const result = await Pedometer.requestPermissionsAsync();
      console.log("[SensorService] Pedometer Permission Result:", result);
      this.permissionStatus = result.status;
      return result.granted;
    } catch (error) {
      console.error("[SensorService] Permission Request Error:", error);
      this.permissionStatus = "denied";
      return false;
    }
  }

  async startTracking(callback) {
    const available = await this.checkAvailability();
    if (!available) {
      console.error("[SensorService] Pedometer not available on device");
      return;
    }
    const isGranted = await this.checkPermissions();
    if (!isGranted) {
      console.log("[SensorService] Tracking aborted: Permission not granted");
      return;
    }
    this.isTracking = true;
    console.log("[SensorService] Starting watchStepCount...");
    this.subscription = Pedometer.watchStepCount((result) => {
      console.log("[SensorService] watchStepCount received:", result);
      if (result && typeof result.steps === "number") {
        console.log("[SensorService] Steps Received:", result.steps);
        this.stepCount = result.steps;
        this.persistSteps();
        if (callback) callback(this.stepCount);
        this.notifyListeners(this.stepCount);
      } else {
        console.warn("[SensorService] Invalid step result:", result);
      }
    });
  }

  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isTracking = false;
    console.log("[SensorService] Tracking stopped");
  }

  addListener(callback) {
    if (!this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  notifyListeners(steps) {
    this.listeners.forEach((callback) => callback(steps));
  }

  async loadPersistedSteps() {
    try {
      const lastDate = await AsyncStorage.getItem(LAST_STEP_DATE_KEY);
      const today = new Date().toDateString();
      if (lastDate === today) {
        const saved = await AsyncStorage.getItem(DAILY_STEPS_KEY);
        if (saved) {
          this.stepCount = parseInt(saved, 10);
          this.lastStepDate = today;
        }
      } else {
        // New day: reset and clear old value
        await AsyncStorage.removeItem(DAILY_STEPS_KEY);
        await AsyncStorage.setItem(LAST_STEP_DATE_KEY, today);
        this.stepCount = 0;
        this.lastStepDate = today;
      }
    } catch (error) {
      console.error("[SensorService] Load Persisted Error:", error);
      this.stepCount = 0;
    }
  }

  async persistSteps() {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem(DAILY_STEPS_KEY, String(this.stepCount || 0));
      await AsyncStorage.setItem(LAST_STEP_DATE_KEY, today);
      this.lastStepDate = today;
    } catch (error) {
      console.error("[SensorService] Persist Steps Error:", error);
    }
  }

  getSteps() {
    return this.stepCount;
  }

  // Alias used by HomeScreen
  getTodaySteps() {
    return this.stepCount;
  }

  getKm() {
    return (this.stepCount || 0) * STRIDE_KM_PER_STEP;
  }

  getCalories() {
    return (this.stepCount || 0) * CALORIES_PER_STEP;
  }

  async incrementStep(callback) {
    if (!this.permissionStatus || this.permissionStatus !== "granted") {
      const granted = await this.requestPermissions();
      if (!granted) return;
    }
    this.stepCount += 1;
    await this.persistSteps();
    if (callback) callback(this.stepCount);
    this.notifyListeners(this.stepCount);
  }

  async getTier2StepCountToday() {
    if (Platform.OS !== "android") return null;
    const available = await StepCounterNative.isAvailable();
    if (!available) return null;
    const permitted = await StepCounterNative.hasPermission();
    if (!permitted) return null;

    const raw = await StepCounterNative.getRawStepCounter();
    if (raw === null) return null;

    const today = new Date().toDateString();
    const baselineDate = await AsyncStorage.getItem(
      STEP_COUNTER_BASELINE_DATE_KEY,
    );
    let baseline = await AsyncStorage.getItem(STEP_COUNTER_BASELINE_KEY);
    if (baselineDate !== today || baseline === null) {
      await AsyncStorage.setItem(STEP_COUNTER_BASELINE_DATE_KEY, today);
      await AsyncStorage.setItem(STEP_COUNTER_BASELINE_KEY, String(raw));
      baseline = String(raw);
    }
    const b = Number(baseline);
    if (!Number.isFinite(b)) return null;
    return Math.max(0, Math.floor(raw - b));
  }

  async fetchDailyMetrics() {
    const permissions = {
      healthConnect: false,
      usageStats: false,
    };

    const data = {
      steps: 0,
      exerciseMins: 0,
      walkedKm: 0,
      sleepHrs: 0,
      screenTimeHrs: 0,
      workScreenHrs: 0,
      leisureScreenHrs: 0,
    };

    const sources = {
      steps: "manual",
      exerciseMins: "manual",
      walkedKm: "manual",
      sleepHrs: "manual",
    };

    const allZeroTier1 = (d) =>
      (d.steps || 0) === 0 &&
      (d.exerciseMins || 0) === 0 &&
      (d.walkedKm || 0) === 0 &&
      (d.sleepHrs || 0) === 0;

    try {
      await this.loadPersistedSteps();
      data.walkedKm = this.getKm();
      sources.walkedKm = "sensor";
    } catch (e) {
      console.log("[SensorService] Sensor load error:", e);
    }

    try {
      if (!allZeroTier1(data)) {
        const tier2Steps = await this.getTier2StepCountToday();
        if (tier2Steps !== null && tier2Steps > 0) {
          data.steps = tier2Steps;
          sources.steps = "sensor";
          if (data.walkedKm === 0) {
            data.walkedKm = parseFloat(
              (tier2Steps * STRIDE_KM_PER_STEP).toFixed(2),
            );
            sources.walkedKm = "sensor";
          }
          if (data.exerciseMins === 0) {
            data.exerciseMins = Math.round(tier2Steps / 100);
            sources.exerciseMins = "sensor";
          }
        } else if (this.stepCount > 0 && data.steps === 0) {
          data.steps = this.stepCount;
          sources.steps = "sensor";
          if (data.walkedKm === 0) {
            data.walkedKm = this.getKm();
            sources.walkedKm = "sensor";
          }
          if (data.exerciseMins === 0) {
            data.exerciseMins = Math.round(this.stepCount / 100);
            sources.exerciseMins = "sensor";
          }
        }
      }
    } catch (e) {
      console.log("[SensorService] Tier2 step counter error:", e);
    }

    try {
      const hasPermission = hasUsagePermissionSafely();
      if (hasPermission) {
        permissions.usageStats = true;
        const screenStats = fetchCategorizedScreenTime();
        data.screenTimeHrs = screenStats.screen_time_hours || 0;
        data.workScreenHrs = screenStats.work_screen_hours || 0;
        data.leisureScreenHrs = screenStats.leisure_screen_hours || 0;
        sources.screenTimeHrs = "usage_stats";
      }
    } catch (e) {
      console.log("[SensorService] ScreenTime module error/not found:", e);
    }

    return { permissions, data, sources };
  }
}

export const sensorService = new SensorService();
export default sensorService;

// Home Dashboard — Premium Bento Layout
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ToastAndroid,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
} from "../../theme";
import { Avatar, SectionHeader } from "../../components/common";
import { useAuth } from "../../services/AuthContext";
import db from "../../services/database";
import sensorService from "../../services/SensorService";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  hasUsagePermissionSafely,
  requestUsagePermissionSafely,
} from "../../services/screenTimeMapper";

const { width: W } = Dimensions.get("window");
const CARD_GAP = 10;
const BENTO_W = (W - SPACING.lg * 2 - CARD_GAP) / 2;

// Circular Progress Ring (pure View, no SVG needed)
function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color,
  children,
}) {
  const clamp = Math.min(Math.max(progress, 0), 100);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Background ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: COLORS.surfaceElevated,
        }}
      />
      {/* Filled ring */}
      {clamp > 0 && (
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: "transparent",
            borderTopColor: color || COLORS.primary,
            borderRightColor:
              clamp > 25 ? color || COLORS.primary : "transparent",
            borderBottomColor:
              clamp > 50 ? color || COLORS.primary : "transparent",
            borderLeftColor:
              clamp > 75 ? color || COLORS.primary : "transparent",
            transform: [{ rotate: "-45deg" }],
          }}
        />
      )}
      <View style={{ alignItems: "center" }}>{children}</View>
    </View>
  );
}

function BottomSheet({
  visible,
  title,
  description,
  primaryLabel,
  onPrimary,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.sheetOverlay}>
          <TouchableWithoutFeedback>
            <View style={s.sheet}>
              <Text style={s.sheetTitle}>{title}</Text>
              <Text style={s.sheetDesc}>{description}</Text>
              <TouchableOpacity style={s.sheetPrimary} onPress={onPrimary}>
                <Text style={s.sheetPrimaryText}>{primaryLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sheetSecondary} onPress={onClose}>
                <Text style={s.sheetSecondaryText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meals: 0,
  });
  const [todayActivity, setTodayActivity] = useState({
    minutes: 0,
    burned: 0,
    count: 0,
  });
  const [todayMood, setTodayMood] = useState(null);
  const [steps, setSteps] = useState(0);
  const [km, setKm] = useState("0.00");
  const [calories, setCalories] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stepPermissionGranted, setStepPermissionGranted] = useState(false);
  const [stepPermissionStatus, setStepPermissionStatus] = useState(null);

  // Wellness Check-in & permission state
  const [checkInCompleted, setCheckInCompleted] = useState(false);
  const [usagePermission, setUsagePermission] = useState(false);
  const [sheet, setSheet] = useState({ visible: false, type: null });

  const today = format(new Date(), "yyyy-MM-dd");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Check if wellness check-in is done today
      const lastCheckIn =
        (await AsyncStorage.getItem("@last_logged_date")) ||
        (await AsyncStorage.getItem("@last_checkin_date"));
      setCheckInCompleted(lastCheckIn === today);
      setUsagePermission(hasUsagePermissionSafely());

      const foods = await db.getFoodLogs(user.id);
      const todayFoods = foods.filter((f) => f.date === today);
      const totals = todayFoods.reduce(
        (acc, f) => ({
          calories: acc.calories + (f.calories || 0),
          protein: acc.protein + (f.protein || 0),
          carbs: acc.carbs + (f.carbs || 0),
          fat: acc.fat + (f.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
      setTodayStats({ ...totals, meals: todayFoods.length });

      const activities = await db.getActivities(user.id);
      const todayActs = activities.filter((a) => a.date === today);
      setTodayActivity({
        minutes: todayActs.reduce((s, a) => s + (a.duration || 0), 0),
        burned: todayActs.reduce((s, a) => s + (a.caloriesBurned || 0), 0),
        count: todayActs.length,
      });
      setRecentActivities(
        activities.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
      );

      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = format(d, "yyyy-MM-dd");
        const dayActs = activities.filter((a) => a.date === dateStr);
        last7.push(dayActs.reduce((s, a) => s + (a.duration || 0), 0));
      }
      setWeeklyActivity(last7);

      const moods = await db.getMoodLogs(user.id);
      setTodayMood(moods.find((m) => m.date === today));
    } catch (e) {
      console.error("Load error:", e);
    }
  }, [user, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check Physical Activity permission on mount
  useEffect(() => {
    const checkStepPermission = async () => {
      const { granted } = await sensorService.checkPermissions();
      setStepPermissionGranted(!!granted);
    };
    checkStepPermission();
  }, []);

  // Load persisted steps and subscribe to live updates
  useEffect(() => {
    const loadAndSubscribe = async () => {
      await sensorService.loadPersistedSteps();
      const currentSteps = sensorService.getSteps();
      setSteps(currentSteps);
      setKm(sensorService.getKm().toFixed(2));
      setCalories(Math.round(sensorService.getCalories()));
    };
    loadAndSubscribe();

    const onSteps = (newSteps) => {
      setSteps(newSteps);
      setKm(sensorService.getKm().toFixed(2));
      setCalories(Math.round(sensorService.getCalories()));
    };
    sensorService.addListener(onSteps);
    return () => sensorService.removeListener(onSteps);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Dev mode: long-press logo for 2 seconds to reset check-in lock
  const handleDevReset = async () => {
    await AsyncStorage.removeItem("@last_logged_date");
    await AsyncStorage.removeItem("@last_checkin_date");
    setCheckInCompleted(false);
    if (Platform.OS === "android") {
      ToastAndroid.show("Dev Mode: Check-in Unlocked", ToastAndroid.SHORT);
    } else {
      Alert.alert("Dev Mode", "Check-in Unlocked");
    }
  };

  const openSheet = (type) => setSheet({ visible: true, type });
  const closeSheet = () => setSheet({ visible: false, type: null });

  const handlePrimarySheetAction = async () => {
    const type = sheet.type;
    closeSheet();

    if (type === "usage") {
      requestUsagePermissionSafely();
      // Permission is set in Settings; update state next tick
      setTimeout(() => setUsagePermission(hasUsagePermissionSafely()), 500);
      return;
    }

    if (type === "activity") {
      const granted = await sensorService.requestPermissions();
      setStepPermissionGranted(!!granted);
      setStepPermissionStatus(granted ? "granted" : "denied");
      if (granted) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Activity access enabled ✓", ToastAndroid.SHORT);
        } else {
          Alert.alert("Activity access enabled");
        }
        // Start background tracking now that we have permission
        sensorService.startTracking((newSteps) => {
          setSteps(newSteps);
          setKm(sensorService.getKm().toFixed(2));
          setCalories(Math.round(sensorService.getCalories()));
        });
      }
      return;
    }
  };

  const calorieGoal = 2000;
  const calProg = Math.min((todayStats.calories / calorieGoal) * 100, 100);
  const actGoal = 45;
  const actProg = Math.min((todayActivity.minutes / actGoal) * 100, 100);

  const hour = new Date().getHours();
  const greetEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";
  const greetText =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <View style={s.container}>
      {/* Permission Value-Exchange Bottom Sheet */}
      <BottomSheet
        visible={sheet.visible}
        title={
          sheet.type === "usage"
            ? "Enable App Usage Access"
            : "Enable Activity Access"
        }
        description={
          sheet.type === "usage"
            ? "We use screen-time data only to help you see how usage affects stress and productivity. This is optional — manual entry always works."
            : "We use the device step sensor to auto-fill your daily check-in. This is optional. Manual entry still works if you deny it."
        }
        primaryLabel={sheet.type === "usage" ? "Enable" : "Allow"}
        onPrimary={handlePrimarySheetAction}
        onClose={closeSheet}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ─── HERO GREETING ─── */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <View style={s.brandRow}>
                {/* Long-press for 2 s → Dev Mode unlock */}
                <TouchableOpacity
                  onLongPress={handleDevReset}
                  delayLongPress={2000}
                  activeOpacity={0.9}
                  style={s.logoWrap}
                >
                  <Image
                    source={require("../../../assets/icon.png")}
                    style={s.logo}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={s.brandName}>FITFUSION</Text>
                  <Text style={s.heroGreet}>
                    {greetText} {greetEmoji}
                  </Text>
                </View>
              </View>
              <Text style={s.heroName}>
                {user?.name?.split(" ")[0] || "User"}
              </Text>
              {!!user?.college && (
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>{user.college}</Text>
                </View>
              )}
            </View>
            <View style={s.heroRight}>
              <Avatar name={user?.name} color={COLORS.primary} size={52} />
              <Text style={s.heroDate}>{format(new Date(), "dd MMM")}</Text>
            </View>
          </View>
        </View>

        {/* ─── DAILY WELLNESS CHECK-IN CTA ─── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (checkInCompleted) {
              navigation.navigate("Wellness");
            } else {
              navigation.navigate("Wellness", {
                screen: "DailyWellnessCheckIn",
              });
            }
          }}
          style={[s.quizCard, checkInCompleted && { opacity: 0.9 }]}
        >
          <LinearGradient
            colors={
              checkInCompleted
                ? [COLORS.success, COLORS.accentDark]
                : [COLORS.primary, COLORS.accent]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.quizGradient}
          >
            <View style={s.quizContent}>
              <Text style={s.quizEmoji}>{checkInCompleted ? "✅" : "🧠"}</Text>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={s.quizTitle}>
                  {checkInCompleted
                    ? "You're all set!"
                    : "Daily Wellness Check-in"}
                </Text>
                <Text style={s.quizSub}>
                  {checkInCompleted
                    ? "View Today's Insights"
                    : "Earn points & train your AI predictor!"}
                </Text>
              </View>
              {!checkInCompleted && (
                <View style={s.quizBtn}>
                  <Text style={s.quizBtnText}>Start</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ─── VALUE EXCHANGE CARDS (shown only when check-in is pending) ─── */}
        {!checkInCompleted && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: SPACING.lg, marginHorizontal: -SPACING.lg }}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
          >
            {/* Card 1: Auto Step Tracking */}
            <TouchableOpacity
              style={[
                s.valueCard,
                { marginRight: SPACING.md, backgroundColor: "#FFF3E0" },
              ]}
              onPress={() => openSheet("activity")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 28, marginBottom: SPACING.sm }}>👟</Text>
              <Text
                style={[
                  s.bentoLabel,
                  { color: COLORS.text, textAlign: "center" },
                ]}
              >
                Auto Steps
              </Text>
              <Text
                style={[
                  s.bentoSub,
                  { color: COLORS.textSecondary, textAlign: "center" },
                ]}
              >
                {stepPermissionGranted ? "✓ Enabled" : "Enable Activity Access"}
              </Text>
              {!stepPermissionGranted && (
                <View style={s.valueCardBadge}>
                  <Text style={s.valueCardBadgeText}>Enable</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Card 2: Screen Time */}
            <TouchableOpacity
              style={[s.valueCard, { backgroundColor: "#E3F2FD" }]}
              onPress={() => openSheet("usage")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 28, marginBottom: SPACING.sm }}>📱</Text>
              <Text
                style={[
                  s.bentoLabel,
                  { color: COLORS.text, textAlign: "center" },
                ]}
              >
                Screen Time
              </Text>
              <Text
                style={[
                  s.bentoSub,
                  { color: COLORS.textSecondary, textAlign: "center" },
                ]}
              >
                {usagePermission ? "✓ Enabled" : "Enable Usage Access"}
              </Text>
              {!usagePermission && (
                <View style={s.valueCardBadge}>
                  <Text style={s.valueCardBadgeText}>Enable</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── BENTO GRID ─── */}
        <View style={s.bentoGrid}>
          {/* Row 1: Two progress rings side by side */}
          <View style={s.bentoRow}>
            {/* Calories Ring */}
            <View style={[s.bentoCard, s.bentoHalf]}>
              <ProgressRing
                progress={calProg}
                size={76}
                strokeWidth={5}
                color={COLORS.coral}
              >
                <Text style={s.ringValue}>{todayStats.calories}</Text>
                <Text style={s.ringUnit}>kcal</Text>
              </ProgressRing>
              <Text style={s.bentoLabel}>Calories</Text>
              <Text style={s.bentoSub}>
                {Math.round(calProg)}% of {calorieGoal}
              </Text>
            </View>

            {/* Activity Ring */}
            <View style={[s.bentoCard, s.bentoHalf]}>
              <ProgressRing
                progress={actProg}
                size={76}
                strokeWidth={5}
                color={COLORS.accent}
              >
                <Text style={s.ringValue}>{todayActivity.minutes}</Text>
                <Text style={s.ringUnit}>min</Text>
              </ProgressRing>
              <Text style={s.bentoLabel}>Activity</Text>
              <Text style={s.bentoSub}>
                {Math.round(actProg)}% of {actGoal}m
              </Text>
            </View>
          </View>

          {/* Row 2: Macro strip */}
          <LinearGradient
            colors={[COLORS.surface, COLORS.surfaceElevated]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.macroStrip}
          >
            {[
              {
                label: "Protein",
                val: todayStats.protein,
                color: COLORS.primary,
                suffix: "g",
              },
              {
                label: "Carbs",
                val: todayStats.carbs,
                color: COLORS.accent,
                suffix: "g",
              },
              {
                label: "Fat",
                val: todayStats.fat,
                color: COLORS.coral,
                suffix: "g",
              },
              {
                label: "Meals",
                val: todayStats.meals,
                color: COLORS.orange,
                suffix: "/4",
              },
            ].map((m, i) => (
              <View key={i} style={s.macroCell}>
                <View
                  style={[s.macroIndicator, { backgroundColor: m.color }]}
                />
                <Text style={s.macroVal}>
                  {Math.round(m.val)}
                  {m.suffix}
                </Text>
                <Text style={s.macroLbl}>{m.label}</Text>
              </View>
            ))}
          </LinearGradient>

          {/* ─── Automate Tracking section ─── */}
          <SectionHeader title="Automate Tracking" />
          <View style={[s.bentoRow, { marginBottom: SPACING.md }]}>
            {/* Auto step tracking value-exchange card */}
            <TouchableOpacity
              style={[
                s.bentoCard,
                s.bentoHalf,
                { paddingHorizontal: SPACING.sm },
              ]}
              activeOpacity={0.8}
              onPress={async () => {
                if (!stepPermissionGranted) {
                  const granted = await sensorService.requestPermissions();
                  if (granted) {
                    setStepPermissionGranted(true);
                    setStepPermissionStatus("granted");
                    sensorService.startTracking((st) => {
                      setSteps(st);
                      setKm(sensorService.getKm().toFixed(2));
                      setCalories(Math.round(sensorService.getCalories()));
                    });
                  } else {
                    Alert.alert(
                      "Permission needed",
                      "Enable Physical Activity in Settings to auto-track steps.",
                    );
                  }
                }
              }}
            >
              <LinearGradient
                colors={
                  stepPermissionGranted
                    ? COLORS.gradientPrimary
                    : [COLORS.surface, COLORS.surfaceElevated]
                }
                style={s.valueExchangeGradient}
              >
                <Text style={s.valueExchangeIcon}>👟</Text>
                <View style={s.valueExchangeContent}>
                  <Text
                    style={[
                      s.valueExchangeTitle,
                      stepPermissionGranted && { color: COLORS.textInverse },
                    ]}
                  >
                    Auto-step tracking
                  </Text>
                  <Text
                    style={[
                      s.valueExchangeDesc,
                      stepPermissionGranted && {
                        color: COLORS.textInverse,
                        opacity: 0.8,
                      },
                    ]}
                  >
                    {stepPermissionGranted
                      ? "Tracking active"
                      : "Enable Physical Activity access"}
                  </Text>
                </View>
                {!stepPermissionGranted && (
                  <Text style={s.valueExchangeButton}>Enable →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Screen time value-exchange card */}
            <TouchableOpacity
              style={[
                s.bentoCard,
                s.bentoHalf,
                { paddingHorizontal: SPACING.sm },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (!usagePermission) {
                  openSheet("usage");
                }
              }}
            >
              <LinearGradient
                colors={
                  usagePermission
                    ? [COLORS.accent, COLORS.accentDark]
                    : [COLORS.surface, COLORS.surfaceElevated]
                }
                style={s.valueExchangeGradient}
              >
                <Text style={s.valueExchangeIcon}>📊</Text>
                <View style={s.valueExchangeContent}>
                  <Text
                    style={[
                      s.valueExchangeTitle,
                      usagePermission && { color: COLORS.textInverse },
                    ]}
                  >
                    Auto screen time
                  </Text>
                  <Text
                    style={[
                      s.valueExchangeDesc,
                      usagePermission && {
                        color: COLORS.textInverse,
                        opacity: 0.8,
                      },
                    ]}
                  >
                    {usagePermission
                      ? "Categorising usage"
                      : "Enable Usage Access"}
                  </Text>
                </View>
                {!usagePermission && (
                  <Text style={s.valueExchangeButton}>Enable →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Row 3: Steps tall card + Mood / Burn */}
          <View style={s.bentoRow}>
            {/* Steps — tall gradient card */}
            <TouchableOpacity
              style={[s.bentoCard, s.bentoHalf, s.bentoTall]}
              activeOpacity={0.8}
              onPress={async () => {
                if (!stepPermissionGranted) {
                  const granted = await sensorService.requestPermissions();
                  if (granted) {
                    setStepPermissionGranted(true);
                    setStepPermissionStatus("granted");
                  }
                } else {
                  await sensorService.incrementStep((st) => {
                    setSteps(st);
                    setKm(sensorService.getKm().toFixed(2));
                    setCalories(Math.round(sensorService.getCalories()));
                  });
                }
              }}
            >
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.stepsGradient}
              >
                <Text style={s.stepsIcon}>👟</Text>
                <Text style={s.stepsValue}>{steps.toLocaleString()}</Text>
                <Text style={s.stepsLabel}>Steps Today</Text>
                <View style={s.stepsMeta}>
                  <Text style={s.stepsMetaItem}>{km} km</Text>
                  <Text style={s.stepsMetaDot}>·</Text>
                  <Text style={s.stepsMetaItem}>{calories} kcal</Text>
                </View>
                <Text style={s.stepsTap}>
                  {!stepPermissionGranted
                    ? "tap to enable tracking"
                    : "tap to sync"}
                </Text>
                {!stepPermissionGranted && (
                  <TouchableOpacity
                    style={s.permissionBtn}
                    onPress={async () => {
                      const granted = await sensorService.requestPermissions();
                      if (granted) {
                        setStepPermissionGranted(true);
                        setStepPermissionStatus("granted");
                      }
                    }}
                  >
                    <Text style={s.permissionBtnText}>Request Permission</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Mood + Burn stack */}
            <View style={[s.bentoHalf, { gap: CARD_GAP }]}>
              <View style={s.bentoCard}>
                <Text style={s.moodEmoji}>
                  {todayMood
                    ? ["😢", "😔", "😐", "🙂", "😄"][todayMood.mood - 1]
                    : "🫥"}
                </Text>
                <Text style={s.bentoLabel}>
                  {todayMood
                    ? ["Bad", "Low", "Okay", "Good", "Great"][
                        todayMood.mood - 1
                      ]
                    : "No mood"}
                </Text>
              </View>
              <View style={s.bentoCard}>
                <Text style={s.burnValue}>{todayActivity.burned}</Text>
                <Text style={s.burnUnit}>kcal burned</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── WEEKLY BAR CHART ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Weekly Activity</Text>
          <View style={s.barChart}>
            {weeklyActivity.map((val, i) => {
              const maxVal = Math.max(...weeklyActivity, 1);
              const h = Math.max((val / maxVal) * 70, 3);
              const days = ["M", "T", "W", "T", "F", "S", "S"];
              const isToday = i === 6;
              return (
                <View key={i} style={s.barCol}>
                  <LinearGradient
                    colors={
                      isToday
                        ? COLORS.gradientPrimary
                        : [COLORS.surfaceElevated, COLORS.surfaceElevated]
                    }
                    style={[s.bar, { height: h }]}
                  />
                  <Text
                    style={[
                      s.barLabel,
                      isToday && { color: COLORS.primary, ...FONTS.bold },
                    ]}
                  >
                    {days[i]}
                  </Text>
                  {isToday && <View style={s.barDot} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ─── RECENT ACTIVITY ─── */}
        {recentActivities.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            {recentActivities.map((act, i) => (
              <View key={i} style={s.actRow}>
                <View
                  style={[
                    s.actIcon,
                    { backgroundColor: COLORS.chartColors[i % 7] + "20" },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>
                    {act.type === "running"
                      ? "🏃"
                      : act.type === "gym"
                        ? "🏋️"
                        : act.type === "cycling"
                          ? "🚴"
                          : act.type === "yoga"
                            ? "🧘"
                            : "⚡"}
                  </Text>
                </View>
                <View style={s.actInfo}>
                  <Text style={s.actType}>
                    {act.type?.charAt(0).toUpperCase() + act.type?.slice(1)}
                  </Text>
                  <Text style={s.actMeta}>
                    {act.duration}min · {act.caloriesBurned}kcal
                  </Text>
                </View>
                <Text style={s.actDate}>{act.date?.slice(5)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingTop: Platform.OS === "ios" ? 60 : 40 },

  // ─── Hero ───
  hero: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl },
  heroTop: { flexDirection: "row", alignItems: "flex-start" },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.surface,
  },
  logo: { width: "100%", height: "100%" },
  brandName: {
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.textSecondary,
    ...FONTS.bold,
  },
  heroGreet: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    ...FONTS.medium,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroName: {
    fontSize: 32,
    ...FONTS.extraBold,
    color: COLORS.text,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  heroBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    ...FONTS.semiBold,
  },
  heroRight: { alignItems: "center" },
  heroDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.medium,
    marginTop: 4,
  },

  // ─── Daily Check-in CTA ───
  quizCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quizGradient: { padding: SPACING.lg },
  quizContent: { flexDirection: "row", alignItems: "center" },
  quizEmoji: { fontSize: 36 },
  quizTitle: {
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
    color: COLORS.textInverse,
  },
  quizSub: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    color: COLORS.textInverse,
    opacity: 0.8,
    marginTop: 2,
  },
  quizBtn: {
    backgroundColor: COLORS.textInverse,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    marginLeft: SPACING.sm,
  },
  quizBtnText: {
    color: COLORS.primary,
    ...FONTS.bold,
    fontSize: FONT_SIZES.sm,
  },

  // ─── Value Exchange horizontal cards ───
  valueCard: {
    width: W * 0.45,
    height: 150,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  valueCardBadge: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  valueCardBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textInverse,
    ...FONTS.bold,
  },

  // ─── Permission Bottom Sheet ───
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.medium,
  },
  sheetTitle: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text },
  sheetDesc: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sheetPrimary: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
  },
  sheetPrimaryText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
  },
  sheetSecondary: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
  },
  sheetSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },

  // ─── Bento Grid ───
  bentoGrid: { paddingHorizontal: SPACING.lg, gap: CARD_GAP },
  bentoRow: { flexDirection: "row", gap: CARD_GAP },
  bentoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  bentoHalf: { width: BENTO_W },
  bentoTall: { paddingVertical: 0, overflow: "hidden" },
  bentoLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    marginTop: SPACING.sm,
  },
  bentoSub: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },

  // ─── Progress rings ───
  ringValue: {
    fontSize: FONT_SIZES.xl,
    ...FONTS.extraBold,
    color: COLORS.text,
  },
  ringUnit: {
    fontSize: 9,
    color: COLORS.textMuted,
    ...FONTS.medium,
    marginTop: -2,
  },

  // ─── Macro strip ───
  macroStrip: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  macroCell: { flex: 1, alignItems: "center" },
  macroIndicator: { width: 6, height: 6, borderRadius: 3, marginBottom: 4 },
  macroVal: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.text },
  macroLbl: {
    fontSize: 9,
    color: COLORS.textMuted,
    ...FONTS.medium,
    marginTop: 1,
  },

  // ─── Value Exchange bento cards (Automate Tracking section) ───
  valueExchangeGradient: {
    flex: 1,
    width: "100%",
    borderRadius: BORDER_RADIUS.xl - 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  valueExchangeIcon: { fontSize: 26, marginBottom: SPACING.xs },
  valueExchangeContent: { alignItems: "center", marginBottom: SPACING.xs },
  valueExchangeTitle: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.bold,
    color: COLORS.text,
    textAlign: "center",
  },
  valueExchangeDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 2,
    lineHeight: 14,
  },
  valueExchangeButton: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    ...FONTS.bold,
  },

  // ─── Steps card ───
  stepsGradient: {
    flex: 1,
    width: "100%",
    borderRadius: BORDER_RADIUS.xl - 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
  },
  stepsIcon: { fontSize: 28 },
  stepsValue: {
    fontSize: 28,
    ...FONTS.extraBold,
    color: COLORS.textInverse,
    marginTop: 4,
  },
  stepsLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textInverse,
    ...FONTS.semiBold,
    opacity: 0.8,
  },
  stepsMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  stepsMetaItem: {
    fontSize: 10,
    color: COLORS.textInverse,
    opacity: 0.7,
    ...FONTS.medium,
  },
  stepsMetaDot: { fontSize: 10, color: COLORS.textInverse, opacity: 0.4 },
  stepsTap: {
    fontSize: 9,
    color: COLORS.textInverse,
    opacity: 0.5,
    marginTop: 4,
    ...FONTS.medium,
  },
  permissionBtn: {
    backgroundColor: COLORS.textInverse,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginTop: 6,
  },
  permissionBtnText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
  },

  // ─── Mood & Burn ───
  moodEmoji: { fontSize: 32 },
  burnValue: {
    fontSize: FONT_SIZES.xxl,
    ...FONTS.extraBold,
    color: COLORS.coral,
  },
  burnUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },

  // ─── Section container ───
  section: {
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // ─── Weekly bar chart ───
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  barCol: { alignItems: "center", flex: 1 },
  bar: { width: 22, borderRadius: 11, marginBottom: 6 },
  barLabel: { fontSize: 10, color: COLORS.textMuted, ...FONTS.medium },
  barDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 3,
  },

  // ─── Recent Activity rows ───
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
  },
  actIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  actInfo: { flex: 1 },
  actType: { fontSize: FONT_SIZES.md, ...FONTS.semiBold, color: COLORS.text },
  actMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  actDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
});

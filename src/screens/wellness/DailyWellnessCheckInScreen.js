import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
} from "../../theme";
import db from "../../services/database";
import sensorService from "../../services/SensorService";
import {
  Header,
  SectionHeader,
  StyledInput,
  Chip,
  AnimatedButton,
  GradientCard,
} from "../../components/common";
import { useAuth } from "../../services/AuthContext";
import SyncService from "../../services/SyncService";

function coerceNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function formatHours(n) {
  const v = coerceNumber(n, 0);
  return Number.isFinite(v) ? v.toFixed(1) : "0.0";
}

function ValueTag({ label, tone }) {
  const bg =
    tone === "auto"
      ? COLORS.accent + "22"
      : tone === "warn"
        ? COLORS.orange + "22"
        : COLORS.primary + "22";
  const fg =
    tone === "auto"
      ? COLORS.accentDark
      : tone === "warn"
        ? COLORS.orange
        : COLORS.primary;
  return (
    <View style={[styles.tag, { backgroundColor: bg, borderColor: fg + "33" }]}>
      <Text style={[styles.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function MetricCard({ title, subtitle, right, children }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.metricTitle}>{title}</Text>
          {!!subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export default function DailyWellnessCheckInScreen({ navigation }) {
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [profile, setProfile] = useState({ occupation: null, workMode: null });
  const [permissions, setPermissions] = useState({
    healthConnect: false,
    usageStats: false,
  }); // healthConnect always false — no HC bridge
  const [sources, setSources] = useState({
    steps: "manual",
    exerciseMins: "manual",
    walkedKm: "manual",
    sleepHrs: "manual",
  });

  // Dev mode bypass refs
  const headerPressTimer = useRef(null);
  const handleHeaderLongPress = () => {
    if (Platform.OS === "android") {
      ToastAndroid.show("Dev Mode: Check-in Unlocked", ToastAndroid.SHORT);
    }
    AsyncStorage.removeItem("@last_logged_date");
    AsyncStorage.removeItem("@last_checkin_date");
    setLocked(false);
  };

  const [form, setForm] = useState({
    steps: "",
    exerciseMins: "",
    walkedKm: "",
    sleepHrs: "",
    socialHrs: "",
    sleepQuality: 3,
    stressLevel: 5,
    productivity: 50,
    workScreenHrs: "",
    leisureScreenHrs: "",
    screenTimeHrs: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const last =
          (await AsyncStorage.getItem("@last_logged_date")) ||
          (await AsyncStorage.getItem("@last_checkin_date"));
        if (!mounted) return;
        setLocked(last === today);

        const profileRaw = await AsyncStorage.getItem("@wellness_profile");
        if (!mounted) return;
        if (profileRaw) {
          const p = JSON.parse(profileRaw);
          setProfile({
            occupation: p?.occupation || null,
            workMode: p?.workMode || null,
          });
        }

        const passive = await sensorService.fetchDailyMetrics();
        if (!mounted) return;
        setPermissions(passive.permissions);
        setSources(
          passive.sources || {
            steps: "manual",
            exerciseMins: "manual",
            walkedKm: "manual",
            sleepHrs: "manual",
          },
        );

        setForm((prev) => {
          const steps = coerceNumber(passive.data.steps, 0);
          const walkedKm = coerceNumber(passive.data.walkedKm, 0);
          const exerciseMins = coerceNumber(passive.data.exerciseMins, 0);
          const sleepHrs = coerceNumber(passive.data.sleepHrs, 0);
          const screenTimeHrs = coerceNumber(passive.data.screenTimeHrs, 0);
          const workScreenHrs = coerceNumber(passive.data.workScreenHrs, 0);
          const leisureScreenHrs = coerceNumber(
            passive.data.leisureScreenHrs,
            0,
          );

          return {
            ...prev,
            steps: steps > 0 ? String(steps) : prev.steps,
            exerciseMins:
              exerciseMins > 0 ? String(exerciseMins) : prev.exerciseMins,
            walkedKm: walkedKm > 0 ? String(walkedKm) : prev.walkedKm,
            sleepHrs: sleepHrs > 0 ? String(sleepHrs) : prev.sleepHrs,
            screenTimeHrs,
            workScreenHrs: passive.permissions.usageStats
              ? String(workScreenHrs)
              : prev.workScreenHrs,
            leisureScreenHrs: passive.permissions.usageStats
              ? String(leisureScreenHrs)
              : prev.leisureScreenHrs,
          };
        });
      } catch (e) {
        setPermissions({ healthConnect: false, usageStats: false });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [today]);

  const computedScreenTime = useMemo(() => {
    if (permissions.usageStats) return coerceNumber(form.screenTimeHrs, 0);
    const w = coerceNumber(form.workScreenHrs, 0);
    const l = coerceNumber(form.leisureScreenHrs, 0);
    return w + l;
  }, [
    form.leisureScreenHrs,
    form.screenTimeHrs,
    form.workScreenHrs,
    permissions.usageStats,
  ]);

  const canSubmit = useMemo(() => {
    if (locked) return false;
    const ex = clamp(coerceNumber(form.exerciseMins, 0), 0, 10000);
    const wk = clamp(coerceNumber(form.walkedKm, 0), 0, 200);
    const sl = clamp(coerceNumber(form.sleepHrs, 0), 0, 24);
    const sc = clamp(coerceNumber(form.socialHrs, 0), 0, 24);
    const ws = clamp(coerceNumber(form.workScreenHrs, 0), 0, 24);
    const ls = clamp(coerceNumber(form.leisureScreenHrs, 0), 0, 24);
    const sq = clamp(coerceNumber(form.sleepQuality, 3), 1, 5);
    const st = clamp(coerceNumber(form.stressLevel, 5), 1, 10);
    const pr = clamp(coerceNumber(form.productivity, 50), 0, 100);

    if (!permissions.usageStats && ws + ls > 24) return false;
    if (ex < 0 || wk < 0 || sl < 0 || sc < 0) return false;
    if (sq < 1 || sq > 5) return false;
    if (st < 1 || st > 10) return false;
    if (pr < 0 || pr > 100) return false;
    return true;
  }, [
    form.exerciseMins,
    form.leisureScreenHrs,
    form.productivity,
    form.sleepHrs,
    form.sleepQuality,
    form.socialHrs,
    form.stressLevel,
    form.walkedKm,
    form.workScreenHrs,
    locked,
    permissions.usageStats,
  ]);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const last =
        (await AsyncStorage.getItem("@last_logged_date")) ||
        (await AsyncStorage.getItem("@last_checkin_date"));
      if (last === today) {
        setLocked(true);
        setSubmitting(false);
        return;
      }

      const log = {
        date: today,
        timestamp: new Date().toISOString(),
        userId: user?.id || null,
        occupation: profile.occupation,
        workMode: profile.workMode,
        steps: clamp(coerceNumber(form.steps, 0), 0, 300000),
        exerciseMins: clamp(coerceNumber(form.exerciseMins, 0), 0, 10000),
        walkedKm: clamp(coerceNumber(form.walkedKm, 0), 0, 200),
        sleepHrs: clamp(coerceNumber(form.sleepHrs, 0), 0, 24),
        screenTimeHrs: clamp(coerceNumber(computedScreenTime, 0), 0, 24),
        socialHrs: clamp(coerceNumber(form.socialHrs, 0), 0, 24),
        workScreenHrs: clamp(coerceNumber(form.workScreenHrs, 0), 0, 24),
        leisureScreenHrs: clamp(coerceNumber(form.leisureScreenHrs, 0), 0, 24),
        sleepQuality: clamp(coerceNumber(form.sleepQuality, 3), 1, 5),
        stressLevel: clamp(coerceNumber(form.stressLevel, 5), 1, 10),
        productivity: clamp(coerceNumber(form.productivity, 50), 0, 100),
        sources: {
          ...sources,
          usageStats: permissions.usageStats,
        },
      };
      // Delegate to SyncService so the same payload can be handled in an
      // offline-first way: it always updates local history, and either
      // talks to the backend immediately (online) or enqueues for later
      // flush (offline) without blocking the UI.
      await SyncService.submitWellnessCheckin(log);
      await AsyncStorage.setItem("@last_logged_date", today);
      await AsyncStorage.setItem("@last_checkin_date", today);
      setLocked(true);
      navigation.navigate("WellnessMain");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading check-in…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.gradientDark}
        style={StyleSheet.absoluteFill}
      />
      <Header
        title="Daily Wellness"
        subtitle={format(new Date(), "EEEE, MMM d")}
        onBack={() => navigation.goBack()}
        onLongPress={handleHeaderLongPress}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <GradientCard
            gradient={COLORS.gradientCard}
            style={styles.noticeCard}
          >
            <Text style={styles.noticeTitle}>Privacy-first, opt-in</Text>
            <Text style={styles.noticeText}>
              Automatic tracking is optional. If you don’t enable it, you can
              still log manually.
            </Text>
          </GradientCard>

          {profile.occupation || profile.workMode ? (
            <View style={styles.profileRow}>
              {profile.occupation ? (
                <ValueTag label={profile.occupation} />
              ) : null}
              {profile.workMode ? <ValueTag label={profile.workMode} /> : null}
              {!profile.occupation && !profile.workMode ? null : (
                <View style={{ flex: 1 }} />
              )}
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Community", { screen: "Settings" })
                }
              >
                <Text style={styles.profileEdit}>Edit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.profilePrompt}
              onPress={() =>
                navigation.navigate("Community", { screen: "Settings" })
              }
            >
              <Text style={styles.profilePromptText}>
                Set Occupation & Work Mode in Settings
              </Text>
            </TouchableOpacity>
          )}

          {locked ? (
            <GradientCard
              gradient={COLORS.gradientAccent}
              style={styles.lockedCard}
            >
              <Text style={styles.lockedTitle}>
                Today’s check-in is already submitted.
              </Text>
              <AnimatedButton
                title="View Today’s Insights"
                onPress={() => navigation.navigate("WellnessMain")}
                style={{ marginTop: SPACING.md }}
              />
            </GradientCard>
          ) : null}

          <SectionHeader title="Auto / Manual Inputs" />

          <MetricCard
            title="Steps"
            subtitle={
              sources.steps === "sensor" ? "Auto from device sensor" : "Manual"
            }
            right={
              <ValueTag
                label={sources.steps === "manual" ? "Manual" : "Auto"}
                tone={sources.steps === "manual" ? "manual" : "auto"}
              />
            }
          >
            {sources.steps === "manual" ? (
              <StyledInput
                value={form.steps}
                onChangeText={(t) =>
                  setForm((prev) => ({
                    ...prev,
                    steps: t.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="0"
                keyboardType="number-pad"
                style={{ marginTop: SPACING.sm }}
              />
            ) : (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyValue}>
                  {coerceNumber(form.steps, 0).toLocaleString()} steps
                </Text>
              </View>
            )}
          </MetricCard>

          <MetricCard
            title="Exercise (mins)"
            subtitle={
              sources.exerciseMins === "sensor"
                ? "Auto from device sensor"
                : "Manual"
            }
            right={
              <ValueTag
                label={sources.exerciseMins === "manual" ? "Manual" : "Auto"}
                tone={sources.exerciseMins === "manual" ? "manual" : "auto"}
              />
            }
          >
            {sources.exerciseMins !== "manual" ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyValue}>
                  {coerceNumber(form.exerciseMins, 0)} mins
                </Text>
              </View>
            ) : (
              <StyledInput
                value={form.exerciseMins}
                onChangeText={(t) =>
                  setForm((prev) => ({
                    ...prev,
                    exerciseMins: t.replace(/[^0-9]/g, ""),
                  }))
                }
                placeholder="0"
                keyboardType="number-pad"
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </MetricCard>

          <MetricCard
            title="Walked distance (km)"
            subtitle={
              sources.walkedKm === "sensor"
                ? "Auto from device sensor"
                : "Manual"
            }
            right={
              <ValueTag
                label={sources.walkedKm === "manual" ? "Manual" : "Auto"}
                tone={sources.walkedKm === "manual" ? "manual" : "auto"}
              />
            }
          >
            {sources.walkedKm !== "manual" ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyValue}>
                  {coerceNumber(form.walkedKm, 0)} km
                </Text>
              </View>
            ) : (
              <StyledInput
                value={form.walkedKm}
                onChangeText={(t) =>
                  setForm((prev) => ({
                    ...prev,
                    walkedKm: t.replace(/[^0-9.]/g, ""),
                  }))
                }
                placeholder="0.0"
                keyboardType="decimal-pad"
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </MetricCard>

          <MetricCard
            title="Sleep (hrs)"
            subtitle="Manual"
            right={
              <ValueTag
                label={sources.sleepHrs === "manual" ? "Manual" : "Auto"}
                tone={sources.sleepHrs === "manual" ? "manual" : "auto"}
              />
            }
          >
            {sources.sleepHrs !== "manual" ? (
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyValue}>
                  {coerceNumber(form.sleepHrs, 0)} hrs
                </Text>
              </View>
            ) : (
              <StyledInput
                value={form.sleepHrs}
                onChangeText={(t) =>
                  setForm((prev) => ({
                    ...prev,
                    sleepHrs: t.replace(/[^0-9.]/g, ""),
                  }))
                }
                placeholder="0.0"
                keyboardType="decimal-pad"
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </MetricCard>

          <MetricCard
            title="Screen time"
            subtitle={
              permissions.usageStats
                ? `Auto: ${formatHours(form.screenTimeHrs)}h`
                : `Manual: ${formatHours(computedScreenTime)}h`
            }
            right={
              <ValueTag
                label={permissions.usageStats ? "Auto" : "Manual"}
                tone={permissions.usageStats ? "auto" : "manual"}
              />
            }
          >
            {permissions.usageStats ? (
              <View style={styles.readOnlyGrid}>
                <View style={styles.readOnlyCell}>
                  <Text style={styles.readOnlyCellLabel}>Work</Text>
                  <Text style={styles.readOnlyCellValue}>
                    {formatHours(form.workScreenHrs)}h
                  </Text>
                </View>
                <View style={styles.readOnlyCell}>
                  <Text style={styles.readOnlyCellLabel}>Leisure</Text>
                  <Text style={styles.readOnlyCellValue}>
                    {formatHours(form.leisureScreenHrs)}h
                  </Text>
                </View>
                <View style={[styles.readOnlyCell, { width: "100%" }]}>
                  <Text style={styles.readOnlyCellLabel}>Total</Text>
                  <Text style={styles.readOnlyCellValue}>
                    {formatHours(form.screenTimeHrs)}h
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.splitLabel}>Work screen (hrs)</Text>
                    <StyledInput
                      value={form.workScreenHrs}
                      onChangeText={(t) =>
                        setForm((prev) => ({
                          ...prev,
                          workScreenHrs: t.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      placeholder="0.0"
                      keyboardType="decimal-pad"
                      style={{ marginTop: SPACING.xs }}
                    />
                  </View>
                  <View style={{ width: SPACING.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.splitLabel}>Leisure screen (hrs)</Text>
                    <StyledInput
                      value={form.leisureScreenHrs}
                      onChangeText={(t) =>
                        setForm((prev) => ({
                          ...prev,
                          leisureScreenHrs: t.replace(/[^0-9.]/g, ""),
                        }))
                      }
                      placeholder="0.0"
                      keyboardType="decimal-pad"
                      style={{ marginTop: SPACING.xs }}
                    />
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatHours(computedScreenTime)}h
                  </Text>
                </View>
              </>
            )}
          </MetricCard>

          <SectionHeader title="Daily Feelings" />

          <MetricCard
            title="Social (hrs)"
            subtitle="Manual"
            right={<ValueTag label="Daily" />}
          >
            <StyledInput
              value={form.socialHrs}
              onChangeText={(t) =>
                setForm((prev) => ({
                  ...prev,
                  socialHrs: t.replace(/[^0-9.]/g, ""),
                }))
              }
              placeholder="0.0"
              keyboardType="decimal-pad"
              style={{ marginTop: SPACING.sm }}
            />
          </MetricCard>

          <MetricCard
            title="Sleep quality"
            subtitle="1 (bad) to 5 (great)"
            right={<ValueTag label="Daily" />}
          >
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Chip
                  key={v}
                  label={String(v)}
                  color={COLORS.primary}
                  selected={form.sleepQuality === v}
                  onPress={() =>
                    setForm((prev) => ({ ...prev, sleepQuality: v }))
                  }
                />
              ))}
            </View>
          </MetricCard>

          <MetricCard
            title="Stress level"
            subtitle="1 (low) to 10 (high)"
            right={<ValueTag label="Daily" />}
          >
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <Chip
                  key={v}
                  label={String(v)}
                  color={COLORS.orange}
                  selected={form.stressLevel === v}
                  onPress={() =>
                    setForm((prev) => ({ ...prev, stressLevel: v }))
                  }
                />
              ))}
            </View>
          </MetricCard>

          <MetricCard
            title="Productivity"
            subtitle="0 to 100"
            right={<ValueTag label="Daily" />}
          >
            <View style={styles.productivityRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  setForm((prev) => ({
                    ...prev,
                    productivity: clamp(
                      coerceNumber(prev.productivity, 50) - 5,
                      0,
                      100,
                    ),
                  }))
                }
              >
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <View style={styles.productivityValueWrap}>
                <Text style={styles.productivityValue}>
                  {form.productivity}
                </Text>
                <Text style={styles.productivityUnit}>/ 100</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  setForm((prev) => ({
                    ...prev,
                    productivity: clamp(
                      coerceNumber(prev.productivity, 50) + 5,
                      0,
                      100,
                    ),
                  }))
                }
              >
                <Text style={styles.stepText}>+</Text>
              </TouchableOpacity>
            </View>
          </MetricCard>

          <AnimatedButton
            title={
              locked
                ? "Submitted"
                : submitting
                  ? "Submitting…"
                  : "Submit Check-in"
            }
            onPress={submit}
            disabled={!canSubmit || submitting}
            style={{ marginTop: SPACING.lg }}
          />

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  noticeCard: { marginHorizontal: SPACING.lg, marginTop: SPACING.md },
  noticeTitle: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text },
  noticeText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  profileEdit: {
    color: COLORS.primary,
    ...FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
  },
  profilePrompt: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  profilePromptText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  lockedCard: { marginTop: SPACING.md, marginHorizontal: SPACING.lg },
  lockedTitle: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.small,
    marginTop: SPACING.md,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  metricTitle: { fontSize: FONT_SIZES.md, ...FONTS.bold, color: COLORS.text },
  metricSubtitle: {
    marginTop: 2,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  readOnlyRow: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  readOnlyValue: { fontSize: FONT_SIZES.lg, ...FONTS.bold, color: COLORS.text },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  tagText: { fontSize: FONT_SIZES.xs, ...FONTS.semiBold },
  twoCol: { flexDirection: "row", marginTop: SPACING.md },
  splitLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  totalValue: { fontSize: FONT_SIZES.md, color: COLORS.text, ...FONTS.bold },
  readOnlyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  readOnlyCell: {
    width: "48%",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  readOnlyCellLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.medium,
  },
  readOnlyCellValue: {
    marginTop: 2,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    ...FONTS.bold,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  productivityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  stepText: { fontSize: 22, color: COLORS.text, ...FONTS.bold },
  productivityValueWrap: { alignItems: "center" },
  productivityValue: {
    fontSize: 32,
    ...FONTS.extraBold,
    color: COLORS.primary,
  },
  productivityUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    ...FONTS.medium,
    marginTop: -2,
  },
});

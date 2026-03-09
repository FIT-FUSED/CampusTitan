import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONTS,
  BORDER_RADIUS,
  SHADOWS,
} from "../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import db from "../services/database";
import aiService from "../services/aiService";
import { getSimulatedEnvironment } from "../services/environmentMatrix";

export default function AIWellnessCoach() {
  const [loading, setLoading] = useState(true);
  const [tip, setTip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadTip() {
      setLoading(true);
      try {
        // First, show any cached tip so the card is never empty in offline demos.
        const cachedRaw = await AsyncStorage.getItem("@ai_student_tip_daily");
        if (cachedRaw && mounted) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.tip) {
              setTip(parsed.tip);
            }
          } catch {
            // ignore parse errors and fall through to fresh fetch
          }
        }

        const history = await db.getWellnessHistory(3);
        const environment = getSimulatedEnvironment(new Date());

        // We pass the last 3 days of logs plus the current simulated campus
        // environment so the LLM can inject precise, campus-aware context.
        const freshTip = await aiService.generateStudentActionPlan(
          history,
          environment,
        );
        if (mounted) {
          setTip(freshTip);
          setError(null);
        }
      } catch (e) {
        console.warn("AIWellnessCoach error:", e);
        if (mounted) {
          setError(
            "AI tips will appear here once you’ve logged a check-in and are online.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTip();

    return () => {
      mounted = false;
    };
  }, []);

  const showSkeleton = loading && !tip;

  return (
    <LinearGradient
      colors={COLORS.gradientCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>AI Wellness Coach</Text>
        <Text style={styles.badge}>Cohere</Text>
      </View>
      {showSkeleton ? (
        <View>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: "80%" }]} />
        </View>
      ) : (
        <Text style={styles.tipText}>
          {tip ||
            error ||
            "Once you submit a few daily check-ins, your personalised campus wellness tip will appear here."}
        </Text>
      )}
      {loading && !showSkeleton && (
        <ActivityIndicator
          size="small"
          color={COLORS.textInverse}
          style={{ marginTop: SPACING.sm }}
        />
      )}
      <Text style={styles.footerText}>Generated on-device from your recent logs and campus context.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
    color: COLORS.textInverse,
  },
  badge: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    color: COLORS.textInverse,
    opacity: 0.8,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    color: COLORS.textInverse,
    lineHeight: 20,
  },
  footerText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textInverse,
    opacity: 0.75,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 6,
  },
});


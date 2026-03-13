// OTP Login Screen — Email One-Time Password
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from "../../theme";
import { AnimatedButton, StyledInput } from "../../components/common";
import { useAuth } from "../../services/AuthContext";

const { height: H } = Dimensions.get("window");

export default function OtpLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // email | otp
  const [loading, setLoading] = useState(false);

  const { requestEmailOtp, verifyEmailOtp } = useAuth();

  function showAlert(title, message) {
    if (Platform.OS === "web") alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  }

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  async function handleSendOtp() {
    if (!normalizedEmail) {
      showAlert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await requestEmailOtp(normalizedEmail);
      setStep("otp");
      showAlert("OTP Sent", `Check ${normalizedEmail} for your verification code.`);
    } catch (e) {
      showAlert("Failed to send OTP", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!normalizedEmail) {
      showAlert("Error", "Email missing");
      return;
    }
    if (!otp.trim()) {
      showAlert("Error", "Please enter the OTP");
      return;
    }

    setLoading(true);
    try {
      await verifyEmailOtp(normalizedEmail, otp.trim());
      // AuthContext will set user; AppNavigator will transition to MainApp.
    } catch (e) {
      showAlert("OTP verification failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  const renderContent = () => (
    <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.brandSection}>
        <View style={s.accentCircle1} />
        <View style={s.accentCircle2} />

        <View style={s.brandMark}>
          <LinearGradient colors={COLORS.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.brandGradient}>
            <Text style={s.brandIcon}>CT</Text>
          </LinearGradient>
        </View>
        <Text style={s.brandName}>Campus{"\n"}Titan</Text>
        <Text style={s.brandTag}>EMAIL OTP SIGN IN</Text>
      </View>

      <View style={s.formCard}>
        <Text style={s.formTitle}>Sign in with OTP</Text>
        <Text style={s.formSub}>We’ll send a one-time code to your email</Text>

        <StyledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your.email@campus.edu"
          keyboardType="email-address"
        />

        {step === "otp" && (
          <StyledInput
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter the 8-digit code"
            keyboardType="number-pad"
          />
        )}

        {step === "email" ? (
          <AnimatedButton
            title={loading ? "Sending..." : "Send OTP"}
            onPress={handleSendOtp}
            disabled={loading}
            style={{ marginTop: SPACING.sm }}
          />
        ) : (
          <>
            <AnimatedButton
              title={loading ? "Verifying..." : "Verify & Sign In"}
              onPress={handleVerifyOtp}
              disabled={loading}
              style={{ marginTop: SPACING.sm }}
            />
            <TouchableOpacity
              style={s.secondaryLink}
              onPress={() => {
                setOtp("");
                setStep("email");
              }}
              disabled={loading}
            >
              <Text style={s.secondaryText}>Use a different email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryLink}
              onPress={() => {
                setOtp("");
                handleSendOtp();
              }}
              disabled={loading}
            >
              <Text style={s.secondaryText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()} disabled={loading}>
          <Text style={s.backText}>
            Back to <Text style={s.backBold}>Password Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={s.container}>
      {Platform.OS !== "web" ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {renderContent()}
        </KeyboardAvoidingView>
      ) : (
        renderContent()
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.huge,
  },

  brandSection: {
    paddingTop: H * 0.1,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.xxl,
    overflow: "hidden",
  },
  accentCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary + "08",
  },
  accentCircle2: {
    position: "absolute",
    top: 60,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent + "06",
  },
  brandMark: { marginBottom: SPACING.lg },
  brandGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  brandIcon: {
    fontSize: 22,
    ...FONTS.extraBold,
    color: COLORS.textInverse,
    letterSpacing: 1,
  },
  brandName: {
    fontSize: 44,
    ...FONTS.extraBold,
    color: COLORS.text,
    lineHeight: 48,
    letterSpacing: -1.5,
  },
  brandTag: {
    fontSize: 11,
    ...FONTS.semiBold,
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginTop: SPACING.md,
  },

  formCard: {
    marginHorizontal: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.small,
  },
  formTitle: {
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  formSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },

  secondaryLink: { alignItems: "center", marginTop: SPACING.md },
  secondaryText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },

  backLink: { alignItems: "center", marginTop: SPACING.xl },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  backBold: { color: COLORS.primary, ...FONTS.bold },
});

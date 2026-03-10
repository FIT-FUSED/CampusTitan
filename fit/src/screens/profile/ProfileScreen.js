// Profile Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, Avatar, GradientCard, StatCard, SectionHeader } from '../../components/common';
import { useAuth } from '../../services/AuthContext';

const { width } = Dimensions.get('window');

function capitalize(str) {
    if (!str) return '—';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ProfileScreen({ navigation }) {
    const { user } = useAuth();

    if (!user) return null;

    const bmi = user.weight && user.height
        ? (user.weight / ((user.height / 100) ** 2)).toFixed(1)
        : '—';

    const bmiCategory = bmi !== '—'
        ? parseFloat(bmi) < 18.5 ? 'Underweight'
            : parseFloat(bmi) < 25 ? 'Normal'
                : parseFloat(bmi) < 30 ? 'Overweight'
                    : 'Obese'
        : '';

    const bmiColor = parseFloat(bmi) < 18.5 ? COLORS.info
        : parseFloat(bmi) < 25 ? COLORS.success
            : parseFloat(bmi) < 30 ? COLORS.orange
                : COLORS.error;

    return (
        <View style={styles.container}>
            <Header title="Profile" onBack={() => navigation.goBack()} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <GradientCard gradient={COLORS.gradientPrimary} style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Avatar name={user.name} color="rgba(255,255,255,0.2)" size={70} />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user.name}</Text>
                            <Text style={styles.profileEmail}>{user.email}</Text>
                            {!!user.college && (
                                <View style={styles.collegeBadge}>
                                    <Text style={styles.collegeText}>🏛️ {user.college}</Text>
                                </View>
                            )}
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>{user.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}</Text>
                            </View>
                        </View>
                    </View>
                </GradientCard>

                {/* Body Stats */}
                <SectionHeader title="Body Profile" />
                <View style={styles.statsGrid}>
                    <StatCard title="Height" value={user.height || '—'} unit="cm" icon="📏" color={COLORS.primary} />
                    <StatCard title="Weight" value={user.weight || '—'} unit="kg" icon="⚖️" color={COLORS.accent} />
                </View>
                <View style={[styles.statsGrid, { marginTop: SPACING.md }]}>
                    <StatCard title="BMI" value={bmi} subtitle={bmiCategory} icon="📊" color={bmiColor} />
                    <StatCard title="Age" value={user.age || '—'} unit="yrs" icon="🎂" color={COLORS.orange} />
                </View>

                {/* Personal Info */}
                <SectionHeader title="Personal Information" />
                <View style={styles.infoCard}>
                    {[
                        { label: 'Gender', value: capitalize(user.gender), icon: user.gender === 'female' ? '👩' : '👨' },
                        { label: 'College', value: user.college, icon: '🏛️' },
                        { label: 'Fitness Level', value: capitalize(user.fitnessLevel), icon: '💪' },
                        { label: 'Dietary Preference', value: user.dietaryPreferences || '—', icon: '🥗' },
                    ].map((item, i) => (
                        <View key={i} style={[styles.infoRow, i === 3 && { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoIcon}>{item.icon}</Text>
                            <Text style={styles.infoLabel}>{item.label}</Text>
                            <Text style={styles.infoValue}>{item.value || '—'}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    content: { paddingBottom: SPACING.huge },
    profileCard: { marginHorizontal: SPACING.lg },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    profileInfo: { marginLeft: SPACING.lg, flex: 1 },
    profileName: { color: COLORS.text, fontSize: FONT_SIZES.xxl, ...FONTS.bold },
    profileEmail: { color: COLORS.text, fontSize: FONT_SIZES.sm, opacity: 0.7, marginTop: 2 },
    collegeBadge: {
        alignSelf: 'flex-start', marginTop: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round,
    },
    collegeText: { color: COLORS.text, fontSize: FONT_SIZES.xs, ...FONTS.semiBold },
    roleBadge: {
        alignSelf: 'flex-start', marginTop: SPACING.xs,
        backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round,
    },
    roleText: { color: COLORS.text, fontSize: FONT_SIZES.xs, ...FONTS.medium },
    statsGrid: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md },
    infoCard: {
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
    },
    infoIcon: { fontSize: 18, marginRight: SPACING.md },
    infoLabel: { flex: 1, color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
    infoValue: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.medium },
});


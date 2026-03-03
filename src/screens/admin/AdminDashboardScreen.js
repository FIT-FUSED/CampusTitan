// Admin Dashboard
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, GradientCard, SectionHeader, StatCard, Avatar, AnimatedButton, ProgressBar, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import db from '../../services/database';
import { generateCampusAnalytics } from '../../data/seedData';

export default function AdminDashboardScreen({ navigation }) {
    const { user, isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [allFoodLogs, setAllFoodLogs] = useState([]);
    const [allActivities, setAllActivities] = useState([]);
    const [allMoodLogs, setAllMoodLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [envTemp, setEnvTemp] = useState('');
    const [envAqi, setEnvAqi] = useState('');
    const [envHumidity, setEnvHumidity] = useState('');

    const analytics = useMemo(() => generateCampusAnalytics(), []);

    const loadData = useCallback(async () => {
        const u = await db.getUsers();
        setUsers(u.filter(usr => usr.role !== 'admin'));
        setAllFoodLogs(await db.getAllFoodLogs());
        setAllActivities(await db.getAllActivities());
        setAllMoodLogs(await db.getAllMoodLogs());
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    if (!isAdmin) {
        return (
            <View style={styles.container}>
                <Header title="Access Denied" onBack={() => navigation.goBack()} />
                <View style={styles.denied}>
                    <Text style={styles.deniedEmoji}>🔒</Text>
                    <Text style={styles.deniedText}>Admin access required</Text>
                </View>
            </View>
        );
    }

    const filteredUsers = users.filter(u =>
        !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalActivities = allActivities.length;
    const totalFoodLogs = allFoodLogs.length;
    const totalMoodLogs = allMoodLogs.length;

    async function handleAddEnvData() {
        if (!envTemp && !envAqi) {
            Alert.alert('Error', 'Please enter at least temperature or AQI');
            return;
        }
        try {
            const { format } = require('date-fns');
            await db.addEnvData({
                date: format(new Date(), 'yyyy-MM-dd'),
                temperature: parseInt(envTemp) || 30,
                aqi: parseInt(envAqi) || 80,
                humidity: parseInt(envHumidity) || 50,
                noiseLevel: 55,
                crowdDensity: 45,
                rainfall: 0,
                windSpeed: 10,
                uvIndex: 5,
            });
            Alert.alert('Success!', 'Environmental data added');
            setEnvTemp('');
            setEnvAqi('');
            setEnvHumidity('');
        } catch (e) {
            Alert.alert('Error', 'Failed to add data');
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    return (
        <View style={styles.container}>
            <Header title="Admin Dashboard" subtitle="Campus Overview" onBack={() => navigation.goBack()} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Admin welcome */}
                <GradientCard gradient={COLORS.gradientSunset} style={styles.welcomeCard}>
                    <Text style={styles.welcomeEmoji}>🛡️</Text>
                    <Text style={styles.welcomeTitle}>Welcome, {user?.name}</Text>
                    <Text style={styles.welcomeText}>You have full admin access to FitFusion</Text>
                </GradientCard>

                {/* Campus Stats */}
                <SectionHeader title="Campus Overview" />
                <View style={styles.statsGrid}>
                    <StatCard title="Total Users" value={users.length} icon="👥" color={COLORS.primary} />
                    <StatCard title="Activities" value={totalActivities} icon="🏃" color={COLORS.accent} />
                </View>
                <View style={[styles.statsGrid, { marginTop: SPACING.md }]}>
                    <StatCard title="Food Logs" value={totalFoodLogs} icon="🍽️" color={COLORS.coral} />
                    <StatCard title="Mood Logs" value={totalMoodLogs} icon="😊" color={COLORS.orange} />
                </View>

                {/* User Management */}
                <SectionHeader title="User Management" />
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                {filteredUsers.map((u, i) => (
                    <View key={u.id || i} style={styles.userCard}>
                        <Avatar name={u.name} color={u.avatarColor || COLORS.primary} size={40} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{u.name}</Text>
                            <Text style={styles.userMeta}>{u.email} · {u.hostel} · {u.year}</Text>
                        </View>
                        <View style={[styles.levelBadge, { backgroundColor: u.fitnessLevel === 'intermediate' ? COLORS.primary + '22' : COLORS.accent + '22' }]}>
                            <Text style={[styles.levelText, { color: u.fitnessLevel === 'intermediate' ? COLORS.primary : COLORS.accent }]}>
                                {u.fitnessLevel}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* Add Environmental Data */}
                <SectionHeader title="Add Environmental Data" />
                <View style={styles.envForm}>
                    <StyledInput label="Temperature (°C)" value={envTemp} onChangeText={setEnvTemp} keyboardType="numeric" placeholder="30" />
                    <StyledInput label="AQI" value={envAqi} onChangeText={setEnvAqi} keyboardType="numeric" placeholder="80" />
                    <StyledInput label="Humidity (%)" value={envHumidity} onChangeText={setEnvHumidity} keyboardType="numeric" placeholder="50" />
                    <AnimatedButton title="Add Environment Data" onPress={handleAddEnvData} gradient={COLORS.gradientAccent} />
                </View>

                {/* Campus Participation */}
                <SectionHeader title="Hostel Participation Rates" />
                <View style={styles.participationCard}>
                    {analytics.hostelStats.map((h, i) => (
                        <View key={i} style={styles.participationRow}>
                            <Text style={styles.participationLabel}>{h.hostel}</Text>
                            <ProgressBar progress={h.participationRate} color={COLORS.chartColors[i]} style={{ flex: 1, marginHorizontal: SPACING.md }} />
                            <Text style={styles.participationValue}>{h.participationRate}%</Text>
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
    denied: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    deniedEmoji: { fontSize: 48, marginBottom: SPACING.lg },
    deniedText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.lg },
    welcomeCard: { marginHorizontal: SPACING.lg, alignItems: 'center', paddingVertical: SPACING.xxl },
    welcomeEmoji: { fontSize: 40, marginBottom: SPACING.md },
    welcomeTitle: { color: COLORS.text, fontSize: FONT_SIZES.xxl, ...FONTS.bold },
    welcomeText: { color: COLORS.text, fontSize: FONT_SIZES.sm, opacity: 0.8, marginTop: SPACING.xs },
    statsGrid: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surfaceLight, borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md, marginBottom: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    searchIcon: { fontSize: 16, marginRight: SPACING.sm },
    searchInput: { flex: 1, color: COLORS.text, fontSize: FONT_SIZES.md, paddingVertical: SPACING.md },
    userCard: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg,
        paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder,
    },
    userInfo: { flex: 1, marginLeft: SPACING.md },
    userName: { color: COLORS.text, fontSize: FONT_SIZES.md, ...FONTS.medium },
    userMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    levelBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
    levelText: { fontSize: FONT_SIZES.xs, ...FONTS.medium },
    envForm: {
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    participationCard: {
        marginHorizontal: SPACING.lg, backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder,
    },
    participationRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md,
    },
    participationLabel: { color: COLORS.text, fontSize: FONT_SIZES.sm, ...FONTS.medium, minWidth: 70 },
    participationValue: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, minWidth: 35 },
});

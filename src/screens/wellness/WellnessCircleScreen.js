// Wellness Circle Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, AnimatedButton, ProgressBar, Chip } from '../../components/common';
import { useFocusEffect } from '@react-navigation/native';
import db from '../../services/database';

export default function WellnessCircleScreen({ navigation }) {
    const [circles, setCircles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [joinedCircles, setJoinedCircles] = useState([]);

    const loadData = useCallback(async () => {
        const c = await db.getWellnessCircles();
        setCircles(c);
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    const categories = ['All', 'Meditation', 'Yoga', 'Running', 'Study', 'Nutrition'];
    const filtered = selectedCategory === 'All' ? circles : circles.filter(c => c.category === selectedCategory);

    function handleJoin(circleId) {
        if (joinedCircles.includes(circleId)) {
            setJoinedCircles(prev => prev.filter(id => id !== circleId));
            Alert.alert('Left Circle', 'You have left this wellness circle');
        } else {
            setJoinedCircles(prev => [...prev, circleId]);
            Alert.alert('Joined! 🎉', 'You have joined this wellness circle');
        }
    }

    const gradients = [COLORS.gradientPrimary, COLORS.gradientAccent, COLORS.gradientSunset, COLORS.gradientOcean, COLORS.gradientCoral];

    return (
        <View style={styles.container}>
            <Header title="Wellness Circles" subtitle="Join a community" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
                    {categories.map(cat => (
                        <Chip key={cat} label={cat} selected={selectedCategory === cat} onPress={() => setSelectedCategory(cat)} color={COLORS.primary} />
                    ))}
                </ScrollView>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{circles.length}</Text>
                        <Text style={styles.statLabel}>Circles</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{joinedCircles.length}</Text>
                        <Text style={styles.statLabel}>Joined</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{circles.reduce((s, c) => s + c.participants, 0)}</Text>
                        <Text style={styles.statLabel}>Members</Text>
                    </View>
                </View>

                {/* Circles */}
                {filtered.map((circle, i) => {
                    const isJoined = joinedCircles.includes(circle.id);
                    const fillPercentage = (circle.participants / circle.maxParticipants) * 100;
                    return (
                        <View key={circle.id} style={styles.circleCard}>
                            <LinearGradient
                                colors={gradients[i % gradients.length]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.circleGradient}
                            >
                                <Text style={styles.circleCategory}>{circle.category}</Text>
                            </LinearGradient>
                            <View style={styles.circleBody}>
                                <Text style={styles.circleName}>{circle.name}</Text>
                                <Text style={styles.circleDesc}>{circle.description}</Text>
                                <View style={styles.circleDetail}>
                                    <Text style={styles.circleIcon}>📅</Text>
                                    <Text style={styles.circleDetailText}>{circle.schedule}</Text>
                                </View>
                                <View style={styles.circleDetail}>
                                    <Text style={styles.circleIcon}>📍</Text>
                                    <Text style={styles.circleDetailText}>{circle.location}</Text>
                                </View>
                                <View style={styles.circleDetail}>
                                    <Text style={styles.circleIcon}>👥</Text>
                                    <Text style={styles.circleDetailText}>{circle.participants}/{circle.maxParticipants} members</Text>
                                </View>
                                <ProgressBar progress={fillPercentage} color={gradients[i % gradients.length][0]} height={4} style={{ marginTop: SPACING.sm }} />
                                <TouchableOpacity
                                    style={[styles.joinBtn, isJoined && styles.joinedBtn]}
                                    onPress={() => handleJoin(circle.id)}
                                >
                                    <Text style={[styles.joinBtnText, isJoined && styles.joinedBtnText]}>
                                        {isJoined ? '✓ Joined' : 'Join Circle'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    content: { paddingBottom: SPACING.huge },
    catScroll: { marginBottom: SPACING.lg },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: SPACING.lg,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: SPACING.lg,
    },
    statItem: { alignItems: 'center' },
    statValue: { color: COLORS.text, fontSize: FONT_SIZES.xxl, ...FONTS.bold },
    statLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
    circleCard: {
        marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1, borderColor: COLORS.glassBorder, overflow: 'hidden',
    },
    circleGradient: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
    circleCategory: { color: COLORS.text, fontSize: FONT_SIZES.xs, ...FONTS.bold, textTransform: 'uppercase' },
    circleBody: { padding: SPACING.lg },
    circleName: { color: COLORS.text, fontSize: FONT_SIZES.lg, ...FONTS.bold },
    circleDesc: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm, lineHeight: 20 },
    circleDetail: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
    circleIcon: { fontSize: 14, marginRight: SPACING.sm },
    circleDetailText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
    joinBtn: {
        marginTop: SPACING.lg, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary,
        alignItems: 'center',
    },
    joinedBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    joinBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
    joinedBtnText: { color: COLORS.text },
});

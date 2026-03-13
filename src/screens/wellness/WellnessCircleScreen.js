// Wellness Circle Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, AnimatedButton, ProgressBar, Chip } from '../../components/common';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function WellnessCircleScreen({ navigation }) {
    const [circles, setCircles] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [joinedCircles, setJoinedCircles] = useState([]);

    const loadData = useCallback(async () => {
        // Demo wellness circles with WhatsApp group links
        const demoCircles = [
            {
                id: 1,
                name: 'Morning Yoga Warriors',
                category: 'Yoga',
                description: 'Start your day with energizing yoga sessions. All levels welcome!',
                schedule: 'Daily 6:00 AM',
                location: 'Online + Campus Garden',
                participants: 45,
                maxParticipants: 50,
                whatsappLink: 'https://chat.whatsapp.com/L8Y7K2M9N1O'
            },
            {
                id: 2,
                name: 'Campus Runners Club',
                category: 'Running',
                description: 'Join us for morning and evening runs around campus. Track progress together!',
                schedule: 'Mon/Wed/Fri 7:00 AM',
                location: 'Main Gate',
                participants: 32,
                maxParticipants: 40,
                whatsappLink: 'https://chat.whatsapp.com/H3J8K4N2O5P'
            },
            {
                id: 3,
                name: 'Mindful Meditation',
                category: 'Meditation',
                description: 'Guided meditation sessions for stress relief and mental clarity.',
                schedule: 'Daily 8:00 PM',
                location: 'Wellness Center',
                participants: 28,
                maxParticipants: 35,
                whatsappLink: 'https://chat.whatsapp.com/K4L9M5N3O6Q'
            },
            {
                id: 4,
                name: 'Study Buddies',
                category: 'Study',
                description: 'Focused study sessions with breaks. Perfect for exam preparation!',
                schedule: 'Daily 2:00 PM - 5:00 PM',
                location: 'Library Room 201',
                participants: 18,
                maxParticipants: 25,
                whatsappLink: 'https://chat.whatsapp.com/M5N6O7P8Q9R'
            },
            {
                id: 5,
                name: 'Healthy Eating Hub',
                category: 'Nutrition',
                description: 'Share recipes, meal prep tips, and nutrition advice.',
                schedule: 'Weekly Meetups',
                location: 'Mess Hall',
                participants: 67,
                maxParticipants: 80,
                whatsappLink: 'https://chat.whatsapp.com/N7O8P9Q0R1S'
            },
            {
                id: 6,
                name: 'Evening Yoga Flow',
                category: 'Yoga',
                description: 'Relaxing evening yoga to unwind after a long day.',
                schedule: 'Daily 6:00 PM',
                location: 'Online',
                participants: 23,
                maxParticipants: 30,
                whatsappLink: 'https://chat.whatsapp.com/O8P9Q0R1S2T'
            },
            {
                id: 7,
                name: '5K Challenge Group',
                category: 'Running',
                description: 'Training together for upcoming 5K campus marathon.',
                schedule: 'Tue/Thu/Sat 6:30 AM',
                location: 'Athletics Track',
                participants: 41,
                maxParticipants: 50,
                whatsappLink: 'https://chat.whatsapp.com/P9Q0R1S2T3U'
            },
            {
                id: 8,
                name: 'Breathing & Relaxation',
                category: 'Meditation',
                description: 'Learn breathing techniques for instant stress relief.',
                schedule: 'Daily 1:00 PM',
                location: 'Quiet Room',
                participants: 15,
                maxParticipants: 20,
                whatsappLink: 'https://chat.whatsapp.com/Q0R1S2T3U4V'
            },
            {
                id: 9,
                name: 'Nutrition Science',
                category: 'Nutrition',
                description: 'Deep dive into nutritional science and meal planning.',
                schedule: 'Wednesday 5:00 PM',
                location: 'Seminar Hall A',
                participants: 34,
                maxParticipants: 40,
                whatsappLink: 'https://chat.whatsapp.com/R1S2T3U4V5W'
            }
        ];
        setCircles(demoCircles);
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

    function handleWhatsAppJoin(whatsappLink, circleName) {
        Linking.openURL(whatsappLink).catch(() => {
            Alert.alert('Error', 'Could not open WhatsApp. Please make sure WhatsApp is installed.');
        });
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
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={[styles.joinBtn, isJoined && styles.joinedBtn]}
                                        onPress={() => handleJoin(circle.id)}
                                    >
                                        <Text style={[styles.joinBtnText, isJoined && styles.joinedBtnText]}>
                                            {isJoined ? '✓ Joined' : 'Join Circle'}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.whatsappBtn}
                                        onPress={() => handleWhatsAppJoin(circle.whatsappLink, circle.name)}
                                    >
                                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                        <Text style={styles.whatsappBtnText}>Join WhatsApp</Text>
                                    </TouchableOpacity>
                                </View>
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
        alignItems: 'center', flex: 1,
    },
    joinedBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    joinBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
    joinedBtnText: { color: COLORS.text },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.lg,
    },
    whatsappBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D36615',
        borderWidth: 1,
        borderColor: '#25D36630',
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        flex: 1,
        gap: SPACING.xs,
    },
    whatsappBtnText: {
        color: '#25D366',
        fontSize: FONT_SIZES.sm,
        ...FONTS.semiBold,
    },
});

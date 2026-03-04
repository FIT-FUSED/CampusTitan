// College Health Leaderboard Screen
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';
import { Header, Avatar } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';

const { width } = Dimensions.get('window');

const RANK_BADGES = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [COLORS.orange, '#C0C0C0', '#CD7F32'];

export default function LeaderboardScreen({ navigation }) {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadLeaderboard = useCallback(async () => {
        if (!user?.college) {
            setLeaderboard([]);
            setLoading(false);
            return;
        }
        try {
            const data = await db.getLeaderboard(user.college);
            setLeaderboard(data);
        } catch (e) {
            console.error('Leaderboard error:', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadLeaderboard();
    }, [loadLeaderboard]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLeaderboard();
        setRefreshing(false);
    };

    const renderItem = ({ item, index }) => {
        const isCurrentUser = item.id === user?.id;
        const rank = index + 1;

        return (
            <View style={[
                styles.rankCard,
                isCurrentUser && styles.rankCardCurrent,
                rank <= 3 && styles.rankCardTop,
            ]}>
                {/* Rank */}
                <View style={[styles.rankBadge, { backgroundColor: rank <= 3 ? RANK_COLORS[rank - 1] + '22' : COLORS.surfaceLight }]}>
                    {rank <= 3 ? (
                        <Text style={styles.rankEmoji}>{RANK_BADGES[rank - 1]}</Text>
                    ) : (
                        <Text style={styles.rankNumber}>{rank}</Text>
                    )}
                </View>

                {/* Avatar + Info */}
                <Avatar name={item.name} color={isCurrentUser ? COLORS.primary : COLORS.surfaceElevated} size={42} />
                <View style={styles.rankInfo}>
                    <Text style={[styles.rankName, isCurrentUser && styles.rankNameCurrent]}>
                        {item.name} {isCurrentUser ? '(You)' : ''}
                    </Text>
                    <Text style={styles.rankMeta}>
                        {item.activeDays || 0} active days • BMI {item.bmi || '—'}
                    </Text>
                </View>

                {/* Score */}
                <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreValue, rank <= 3 && { color: RANK_COLORS[rank - 1] }]}>
                        {item.healthScore}
                    </Text>
                    <Text style={styles.scoreLabel}>pts</Text>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerCard}
            >
                <Text style={styles.bannerEmoji}>🏆</Text>
                <Text style={styles.bannerTitle}>Campus Champion</Text>
                <Text style={styles.bannerSubtitle}>
                    {user?.college || 'Your College'}
                </Text>
                <Text style={styles.bannerDesc}>
                    Who's living the healthiest life on campus?
                </Text>
            </LinearGradient>

            {/* Score Breakdown */}
            <View style={styles.scoringCard}>
                <Text style={styles.scoringTitle}>How Scores Work</Text>
                <View style={styles.scoringRow}>
                    <Text style={styles.scoringItem}>🏃 Activity Minutes</Text>
                    <Text style={styles.scoringItem}>🥗 Food Logging</Text>
                </View>
                <View style={styles.scoringRow}>
                    <Text style={styles.scoringItem}>😊 Mood Tracking</Text>
                    <Text style={styles.scoringItem}>📊 Healthy BMI</Text>
                </View>
            </View>

            <Text style={styles.listTitle}>
                Rankings • {leaderboard.length} {leaderboard.length === 1 ? 'member' : 'members'}
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏫</Text>
            <Text style={styles.emptyTitle}>No College Peers Yet</Text>
            <Text style={styles.emptyMsg}>
                Be the first from {user?.college || 'your college'} to track your health and top the leaderboard!
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header title="Leaderboard" onBack={() => navigation.goBack()} />
            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={!loading ? renderEmpty : null}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    listContent: {
        paddingBottom: SPACING.huge,
    },
    headerSection: {
        paddingHorizontal: SPACING.lg,
    },
    bannerCard: {
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.medium,
    },
    bannerEmoji: { fontSize: 48, marginBottom: SPACING.sm },
    bannerTitle: {
        fontSize: FONT_SIZES.xxl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: FONT_SIZES.md,
        ...FONTS.semiBold,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: SPACING.sm,
    },
    bannerDesc: {
        fontSize: FONT_SIZES.sm,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
    },
    scoringCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        marginBottom: SPACING.xl,
    },
    scoringTitle: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.semiBold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    scoringRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: SPACING.xs,
    },
    scoringItem: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        ...FONTS.medium,
    },
    listTitle: {
        fontSize: FONT_SIZES.lg,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    rankCardCurrent: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    rankCardTop: {
        ...SHADOWS.small,
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    rankEmoji: { fontSize: 18 },
    rankNumber: {
        fontSize: FONT_SIZES.md,
        ...FONTS.bold,
        color: COLORS.textMuted,
    },
    rankInfo: {
        flex: 1,
        marginLeft: SPACING.sm,
    },
    rankName: {
        fontSize: FONT_SIZES.md,
        ...FONTS.semiBold,
        color: COLORS.text,
    },
    rankNameCurrent: {
        color: COLORS.primary,
    },
    rankMeta: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    scoreContainer: {
        alignItems: 'center',
        minWidth: 50,
    },
    scoreValue: {
        fontSize: FONT_SIZES.xl,
        ...FONTS.bold,
        color: COLORS.accent,
    },
    scoreLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: SPACING.huge,
        paddingHorizontal: SPACING.xl,
    },
    emptyEmoji: { fontSize: 48, marginBottom: SPACING.lg },
    emptyTitle: {
        fontSize: FONT_SIZES.xl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptyMsg: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

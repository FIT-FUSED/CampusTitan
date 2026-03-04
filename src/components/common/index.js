import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, SHADOWS } from '../../theme';

const { width } = Dimensions.get('window');

// Gradient Card
export function GradientCard({ children, gradient, style, onPress }) {
    const content = (
        <View style={styles.cardContainer}>
            <LinearGradient
                colors={gradient || COLORS.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientCard, style]}
            >
                {children}
            </LinearGradient>
        </View>
    );
    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
            >
                {content}
            </TouchableOpacity>
        );
    }
    return content;
}

// Stat Card
export function StatCard({ title, value, unit, icon, color, subtitle, onPress }) {
    return (
        <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={() => {
                if (onPress) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }
            }}
            style={[styles.statCard, { borderLeftColor: color || COLORS.primary, borderLeftWidth: 3 }]}
        >

            <View style={styles.statCardHeader}>
                <Text style={[styles.statCardTitle, { color: COLORS.textSecondary }]}>{title}</Text>
                {!!icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
            </View>
            <View style={styles.statCardValueRow}>
                <Text style={[styles.statCardValue, { color: color || COLORS.text }]}>{value}</Text>
                {!!unit && <Text style={styles.statCardUnit}>{unit}</Text>}
            </View>
            {!!subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
        </TouchableOpacity>
    );
}

// Animated Button
export function AnimatedButton({ title, onPress, gradient, style, textStyle, disabled, icon }) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onPress && onPress();
            }}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1 }}
        >
            <LinearGradient
                colors={gradient || COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.animatedButton, style]}
            >
                {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
                <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

// Header
export function Header({ title, subtitle, onBack, rightAction }) {
    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                )}
                <View>
                    <Text style={styles.headerTitle}>{title}</Text>
                    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {rightAction && rightAction}
        </View>
    );
}

// Input Field
export function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, style }) {
    return (
        <View style={[styles.inputContainer, style]}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[styles.input, multiline && styles.inputMultiline]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    autoCapitalize="none"
                />
            </View>
        </View>
    );
}

export function StyledInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, style, icon }) {
    return (
        <View style={[styles.inputContainer, style]}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <View style={styles.inputWrapper}>
                {icon && <Text style={styles.inputIcon}>{icon}</Text>}
                <TextInput
                    style={[styles.input, multiline && styles.inputMultiline, icon && { paddingLeft: 40 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    autoCapitalize="none"
                />
            </View>
        </View>
    );
}

// Empty State
export function EmptyState({ icon, title, message, action, actionLabel }) {
    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{icon || '📭'}</Text>
            <Text style={styles.emptyTitle}>{title || 'Nothing here yet'}</Text>
            <Text style={styles.emptyMessage}>{message || 'Start by adding some data'}</Text>
            {action && (
                <AnimatedButton title={actionLabel || 'Get Started'} onPress={action} style={{ marginTop: SPACING.lg }} />
            )}
        </View>
    );
}

// Section Header
export function SectionHeader({ title, action, actionLabel }) {
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={action}>
                    <Text style={styles.sectionAction}>{actionLabel || 'See All'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// Chip / Tag
export function Chip({ label, color, selected, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.chip,
                selected && { backgroundColor: color || COLORS.primary, borderColor: color || COLORS.primary },
            ]}
        >
            <Text style={[styles.chipText, selected && { color: COLORS.text }]}>{label}</Text>
        </TouchableOpacity>
    );
}

// Progress Bar
export function ProgressBar({ progress, color, height = 6, style }) {
    return (
        <View style={[styles.progressBarBg, { height }, style]}>
            <LinearGradient
                colors={[color || COLORS.primary, color ? color + '99' : COLORS.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, height }]}
            />
        </View>
    );
}

// Avatar
export function Avatar({ name, color, size = 40 }) {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color || COLORS.primary }]}>
            <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    gradientCard: {
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        ...SHADOWS.small,
    },
    statCard: {
        backgroundColor: 'rgba(20, 20, 40, 0.4)',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        minWidth: (width - SPACING.lg * 3) / 2,
        flex: 1,
        overflow: 'hidden',
    },
    statCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    statCardTitle: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: COLORS.textSecondary,
    },
    statCardValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statCardValue: {
        fontSize: FONT_SIZES.xxl,
        ...FONTS.bold,
        color: COLORS.text,
    },
    statCardUnit: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.regular,
        color: COLORS.textMuted,
        marginLeft: SPACING.xs,
    },
    statCardSubtitle: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        marginTop: SPACING.xs,
    },
    animatedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md + 2,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOWS.medium,
    },
    buttonText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        ...FONTS.semiBold,
    },
    buttonIcon: {
        fontSize: 18,
        marginRight: SPACING.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SPACING.md,
        padding: SPACING.sm,
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.text,
    },
    headerTitle: {
        fontSize: FONT_SIZES.xxl,
        ...FONTS.bold,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    inputLabel: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    inputWrapper: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: SPACING.md,
        top: 14,
        fontSize: 16,
        zIndex: 1,
    },
    input: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md + 2,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    inputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.huge,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: FONT_SIZES.xl,
        ...FONTS.bold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    emptyMessage: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.lg,
        ...FONTS.bold,
        color: COLORS.text,
    },
    sectionAction: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.primary,
        ...FONTS.semiBold,
    },
    chip: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        backgroundColor: COLORS.surface,
        marginRight: SPACING.sm,
    },
    chipText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.medium,
    },
    progressBarBg: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.round,
        overflow: 'hidden',
    },
    progressBarFill: {
        borderRadius: BORDER_RADIUS.round,
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: COLORS.text,
        ...FONTS.bold,
    },
    scrollPickerContainer: {
        marginVertical: SPACING.md,
        width: '100%',
    },
    scrollPickerLabel: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    scrollPickerFrame: {
        flex: 1,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        overflow: 'hidden',
    },
    scrollPickerSelection: {
        position: 'absolute',
        top: '50%',
        marginTop: -20,
        height: 40,
        width: '100%',
        backgroundColor: COLORS.primary + '15',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: COLORS.primary + '33',
    },
    scrollPickerItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollPickerText: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.textMuted,
        ...FONTS.medium,
    },
    scrollPickerTextActive: {
        fontSize: FONT_SIZES.xl,
        color: COLORS.primary,
        ...FONTS.bold,
    },
});

// Scroll Picker for numeric values
export function ScrollPicker({ data, value, onValueChange, label, height = 150 }) {
    const itemHeight = 40;
    const padding = (height - itemHeight) / 2;
    const flatListRef = useRef(null);

    useEffect(() => {
        const index = data.indexOf(value);
        if (index !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
        }
    }, [data, value]);

    const onMomentumScrollEnd = (event) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);
        if (data[index] !== undefined && data[index] !== value) {
            onValueChange(data[index]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    return (
        <View style={[styles.scrollPickerContainer, { height }]}>
            {label && <Text style={styles.scrollPickerLabel}>{label}</Text>}
            <View style={styles.scrollPickerFrame}>
                <View style={styles.scrollPickerSelection} />
                <FlatList
                    ref={flatListRef}
                    data={data}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    contentContainerStyle={{ paddingVertical: padding }}
                    getItemLayout={(_, index) => ({
                        length: itemHeight,
                        offset: itemHeight * index,
                        index,
                    })}
                    renderItem={({ item }) => (
                        <View style={[styles.scrollPickerItem, { height: itemHeight }]}>
                            <Text style={[
                                styles.scrollPickerText,
                                item === value && styles.scrollPickerTextActive
                            ]}>
                                {item}
                            </Text>
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

// Onboarding Screen
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { AnimatedButton } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        emoji: '💪',
        title: 'Track Your\nFitness Journey',
        subtitle: 'Log workouts, monitor progress, and stay motivated with personalized insights for campus life.',
        gradient: COLORS.gradientPrimary,
    },
    {
        id: '2',
        emoji: '🥗',
        title: 'Smart\nNutrition',
        subtitle: 'Log mess meals, track calories and macros, and make informed decisions about your campus diet.',
        gradient: COLORS.gradientAccent,
    },
    {
        id: '3',
        emoji: '🧘',
        title: 'Mental\nWellness',
        subtitle: 'Track your mood, journal your thoughts, and join wellness circles to thrive on campus.',
        gradient: COLORS.gradientCoral,
    },
    {
        id: '4',
        emoji: '🧠',
        title: 'Personalize\nYour Insights',
        subtitle: 'Set your occupation and work mode. You can change these anytime in Settings.',
        gradient: COLORS.gradientCard,
        type: 'profile',
    },
];

export default function OnboardingScreen({ navigation }) {
    const { setIsOnboarded } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const [occupation, setOccupation] = useState('Student');
    const [workMode, setWorkMode] = useState('Onsite');

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    function renderSlide({ item }) {
        if (item.type === 'profile') {
            return (
                <View style={styles.slide}>
                    <View style={styles.emojiContainer}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                    </View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>

                    <View style={styles.formCard}>
                        <Text style={styles.formLabel}>Occupation</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={occupation} onValueChange={setOccupation}>
                                <Picker.Item label="Student" value="Student" />
                                <Picker.Item label="Corporate" value="Corporate" />
                                <Picker.Item label="Freelancer" value="Freelancer" />
                                <Picker.Item label="Other" value="Other" />
                            </Picker>
                        </View>

                        <Text style={[styles.formLabel, { marginTop: SPACING.md }]}>Work Mode</Text>
                        <View style={styles.pickerWrap}>
                            <Picker selectedValue={workMode} onValueChange={setWorkMode}>
                                <Picker.Item label="Onsite" value="Onsite" />
                                <Picker.Item label="Remote" value="Remote" />
                                <Picker.Item label="Hybrid" value="Hybrid" />
                            </Picker>
                        </View>
                    </View>
                </View>
            );
        }
        return (
            <View style={styles.slide}>
                <View style={styles.emojiContainer}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        );
    }

    async function handleNext() {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await AsyncStorage.setItem('@wellness_profile', JSON.stringify({ occupation, workMode }));
            setIsOnboarded(true);
        }
    }

    return (
        <LinearGradient colors={COLORS.gradientDark} style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
            />

            {/* Dots */}
            <View style={styles.dotsContainer}>
                {slides.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });
                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });
                    return (
                        <Animated.View
                            key={i}
                            style={[styles.dot, { width: dotWidth, opacity, backgroundColor: COLORS.primary }]}
                        />
                    );
                })}
            </View>

            <View style={styles.buttonContainer}>
                <AnimatedButton
                    title={currentIndex === slides.length - 1 ? "Get Started" : "Next"}
                    onPress={handleNext}
                    style={{ width: width - SPACING.lg * 2 }}
                />
                {currentIndex < slides.length - 1 && (
                    <Text
                        style={styles.skipText}
                        onPress={() => setIsOnboarded(true)}
                    >
                        Skip
                    </Text>
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xxl,
        paddingTop: height * 0.15,
    },
    emojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.glass,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xxxl,
    },
    emoji: {
        fontSize: 56,
    },
    title: {
        fontSize: FONT_SIZES.hero,
        ...FONTS.extraBold,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: SPACING.lg,
        lineHeight: 44,
    },
    subtitle: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: SPACING.lg,
    },
    formCard: {
        marginTop: SPACING.xxl,
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    formLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.semiBold, marginBottom: SPACING.xs },
    pickerWrap: { borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.surfaceLight },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    buttonContainer: {
        alignItems: 'center',
        paddingBottom: height * 0.08,
    },
    skipText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.lg,
        ...FONTS.medium,
    },
});

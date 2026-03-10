// Log Activity Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS, ACTIVITY_TYPES } from '../../theme';
import { Header, AnimatedButton, StyledInput } from '../../components/common';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';
import { format } from 'date-fns';
import { CAMPUS_ZONES } from '../../data/seedData';

export default function LogActivityScreen({ navigation }) {
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState(null);
    const [duration, setDuration] = useState('30');
    const [selectedZone, setSelectedZone] = useState('Gym');
    const [exercises, setExercises] = useState([
        { name: '', sets: '3', reps: '12', weight: '' },
    ]);
    const [distance, setDistance] = useState('');
    const [saving, setSaving] = useState(false);

    function addExercise() {
        setExercises(prev => [...prev, { name: '', sets: '3', reps: '12', weight: '' }]);
    }

    function updateExercise(index, field, value) {
        setExercises(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }

    async function handleSave() {
        if (!selectedType) {
            Alert.alert('Select Activity', 'Please select an activity type');
            return;
        }
        setSaving(true);
        const dur = parseInt(duration) || 30;
        const caloriesBurned = Math.round(dur * (selectedType === 'gym' ? 8 : selectedType === 'running' ? 11 : selectedType === 'cycling' ? 9 : selectedType === 'swimming' ? 10 : 7));

        try {
            await db.addActivity({
                userId: user.id,
                date: format(new Date(), 'yyyy-MM-dd'),
                type: selectedType,
                duration: dur,
                caloriesBurned,
                zone: selectedZone,
                details: selectedType === 'gym' ? {
                    exercises: exercises.filter(e => e.name).map(e => ({
                        name: e.name,
                        sets: parseInt(e.sets) || 3,
                        reps: parseInt(e.reps) || 12,
                        weight: parseInt(e.weight) || 0,
                    })),
                } : selectedType === 'running' || selectedType === 'cycling' ? {
                    distance: parseFloat(distance) || 0,
                } : {},
            });
            Alert.alert('Activity Logged! 💪', `${ACTIVITY_TYPES.find(t => t.id === selectedType)?.label} for ${dur} minutes`, [
                { text: 'Done', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            Alert.alert('Error', 'Failed to log activity');
        }
        setSaving(false);
    }

    return (
        <View style={styles.container}>
            <Header title="Log Activity" subtitle="What did you do today?" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {/* Activity Type */}
                <Text style={styles.label}>Activity Type</Text>
                <View style={styles.activityGrid}>
                    {ACTIVITY_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.activityCard, selectedType === type.id && { borderColor: type.color, backgroundColor: type.color + '15' }]}
                            onPress={() => setSelectedType(type.id)}
                        >
                            <Text style={styles.activityEmoji}>
                                {type.id === 'gym' ? '🏋️' : type.id === 'running' ? '🏃' : type.id === 'cycling' ? '🚴' : type.id === 'sports' ? '⚽' : type.id === 'yoga' ? '🧘' : type.id === 'swimming' ? '🏊' : type.id === 'walking' ? '🚶' : '🏅'}
                            </Text>
                            <Text style={[styles.activityLabel, selectedType === type.id && { color: type.color }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Duration */}
                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                    {['15', '30', '45', '60', '90'].map(d => (
                        <TouchableOpacity
                            key={d}
                            style={[styles.durationBtn, duration === d && styles.durationBtnActive]}
                            onPress={() => setDuration(d)}
                        >
                            <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>{d}m</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <StyledInput
                    label="Custom Duration (minutes)"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    placeholder="30"
                />

                {/* Location */}
                <Text style={styles.label}>Location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.lg }}>
                    {CAMPUS_ZONES.map(zone => (
                        <TouchableOpacity
                            key={zone}
                            style={[styles.zoneChip, selectedZone === zone && styles.zoneChipActive]}
                            onPress={() => setSelectedZone(zone)}
                        >
                            <Text style={[styles.zoneText, selectedZone === zone && styles.zoneTextActive]}>{zone}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Gym-specific: Exercise details */}
                {selectedType === 'gym' && (
                    <>
                        <Text style={styles.label}>Exercises</Text>
                        {exercises.map((ex, i) => (
                            <View key={i} style={styles.exerciseRow}>
                                <StyledInput
                                    placeholder="Exercise name"
                                    value={ex.name}
                                    onChangeText={(v) => updateExercise(i, 'name', v)}
                                    style={{ flex: 2, marginRight: SPACING.sm, marginBottom: 0 }}
                                />
                                <StyledInput
                                    placeholder="Sets"
                                    value={ex.sets}
                                    onChangeText={(v) => updateExercise(i, 'sets', v)}
                                    keyboardType="numeric"
                                    style={{ flex: 1, marginRight: SPACING.sm, marginBottom: 0 }}
                                />
                                <StyledInput
                                    placeholder="Reps"
                                    value={ex.reps}
                                    onChangeText={(v) => updateExercise(i, 'reps', v)}
                                    keyboardType="numeric"
                                    style={{ flex: 1, marginRight: SPACING.sm, marginBottom: 0 }}
                                />
                                <StyledInput
                                    placeholder="kg"
                                    value={ex.weight}
                                    onChangeText={(v) => updateExercise(i, 'weight', v)}
                                    keyboardType="numeric"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addExBtn} onPress={addExercise}>
                            <Text style={styles.addExText}>+ Add Exercise</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Running/Cycling: Distance */}
                {(selectedType === 'running' || selectedType === 'cycling') && (
                    <StyledInput
                        label="Distance (km)"
                        value={distance}
                        onChangeText={setDistance}
                        keyboardType="decimal-pad"
                        placeholder="5.0"
                    />
                )}

                {/* Calorie Estimate */}
                {selectedType && (
                    <View style={styles.estimateCard}>
                        <Text style={styles.estimateLabel}>Estimated Calories Burned</Text>
                        <Text style={styles.estimateValue}>
                            🔥 {Math.round((parseInt(duration) || 30) * (selectedType === 'gym' ? 8 : selectedType === 'running' ? 11 : selectedType === 'cycling' ? 9 : selectedType === 'swimming' ? 10 : 7))} kcal
                        </Text>
                    </View>
                )}

                <AnimatedButton
                    title={saving ? "Saving..." : "Log Activity"}
                    onPress={handleSave}
                    disabled={saving}
                    icon="💪"
                    style={{ marginTop: SPACING.lg }}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
    content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.huge },
    label: { fontSize: FONT_SIZES.sm, ...FONTS.semiBold, color: COLORS.textSecondary, marginTop: SPACING.lg, marginBottom: SPACING.md },
    activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    activityCard: {
        width: (width - SPACING.lg * 2 - SPACING.md * 3) / 4,
        aspectRatio: 1,
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
        borderWidth: 1, borderColor: COLORS.glassBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    activityEmoji: { fontSize: 24, marginBottom: SPACING.xs },
    activityLabel: { color: COLORS.textSecondary, fontSize: 10, ...FONTS.medium, textAlign: 'center' },
    durationRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
    durationBtn: {
        flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center',
    },
    durationBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    durationText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
    durationTextActive: { color: COLORS.text },
    zoneChip: {
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.surface,
        borderWidth: 1, borderColor: COLORS.glassBorder, marginRight: SPACING.sm,
    },
    zoneChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    zoneText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
    zoneTextActive: { color: COLORS.textInverse },
    exerciseRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
    addExBtn: { alignSelf: 'flex-start', paddingVertical: SPACING.sm },
    addExText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
    estimateCard: {
        backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.glassBorder,
        alignItems: 'center', marginTop: SPACING.lg,
    },
    estimateLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    estimateValue: { color: COLORS.coral, fontSize: FONT_SIZES.xxl, ...FONTS.bold, marginTop: SPACING.sm },
});


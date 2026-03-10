import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, AnimatedButton } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';
import NutritionScoreCard from '../../components/nutrition/NutritionScoreCard';
import nutritionAnalysis from '../../services/nutritionAnalysis';
import { useAuth } from '../../services/AuthContext';
import db from '../../services/database';

const { width, height } = Dimensions.get('window');

export default function FoodScannerScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [nutritionResult, setNutritionResult] = useState(null);
    const [showContextModal, setShowContextModal] = useState(false);
    const [userContext, setUserContext] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const scanAnim = useRef(new Animated.Value(0)).current;
    const cameraRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        if (scanning) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [scanning]);

    if (!permission) {
        return <View style={styles.container}><Text>Requesting permissions...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>No access to camera</Text>
                <AnimatedButton title="Grant Permission" onPress={requestPermission} />
            </View>
        );
    }

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, width * 0.7],
    });

    const capturePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setCapturedImage(photo.uri);
                setScanned(true);
                setScanning(false);
                setShowContextModal(true);
            } catch (error) {
                console.error('Camera capture error:', error);
                Alert.alert('Error', 'Failed to capture photo');
            }
        }
    };

    const analyzeFood = async () => {
        if (!capturedImage) return;
        
        setAnalyzing(true);
        try {
            const result = await nutritionAnalysis.analyzeFoodImage(capturedImage, userContext);
            const formattedData = nutritionAnalysis.formatNutritionScore(result);
            setNutritionResult({
                ...formattedData,
                foodName: result.food_name || 'Detected Food',
                raw: result,
            });
        } catch (error) {
            console.error('Analysis error:', error);
            Alert.alert('Analysis Failed', 'Could not analyze the food image. Please try again.');
        } finally {
            setAnalyzing(false);
            setShowContextModal(false);
        }
    };

    const getMealTypeByTime = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'breakfast';
        if (hour >= 11 && hour < 15) return 'lunch';
        if (hour >= 15 && hour < 18) return 'snack';
        return 'dinner';
    };

    const logFood = async () => {
        if (!nutritionResult || !user) return;
        
        try {
            console.log('Logging food with data:', nutritionResult);
            
            const foodLogData = {
                foodName: nutritionResult.foodName,
                calories: nutritionResult.calories,
                protein: nutritionResult.protein,
                carbs: nutritionResult.carbs,
                fat: nutritionResult.fat,
                fiber: nutritionResult.fiber,
                nutritionScore: nutritionResult.score,
                grade: nutritionResult.grade,
                date: new Date().toISOString().split('T')[0],
                mealType: getMealTypeByTime(), // Auto-detect meal type based on time
                isVeg: true, // Default, could be enhanced
                userId: user.id,
            };
            
            console.log('Final food log data:', foodLogData);
            
            await db.addFoodLog(foodLogData);
            
            Alert.alert('Success!', 'Food logged successfully', [
                { text: 'Scan Another', onPress: resetScanner },
                { text: 'View Nutrition', onPress: () => navigation.navigate('Nutrition') }
            ]);
        } catch (error) {
            console.error('Logging error details:', error);
            Alert.alert('Error', `Failed to log food: ${error.message}`);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setScanning(true);
        setNutritionResult(null);
        setCapturedImage(null);
        setUserContext('');
    };

    return (
        <View style={styles.container}>
            <Header title="Smart Scanner" subtitle="Scan your meal" onBack={() => navigation.goBack()} transparent />

            {!nutritionResult ? (
                <>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        barcodeScannerSettings={{
                            barcodeTypes: [], // Disable barcode scanning
                        }}
                    >
                        <View style={styles.overlay}>
                            <View style={styles.unfocusedContainer} />
                            <View style={styles.middleContainer}>
                                <View style={styles.unfocusedContainer} />
                                <View style={styles.focusedContainer}>
                                    {/* Scanning Animation Line */}
                                    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />

                                    {/* Corner Borders */}
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>
                                <View style={styles.unfocusedContainer} />
                            </View>
                            <View style={styles.unfocusedContainer} />
                        </View>

                        {/* UI Elements */}
                        <View style={[styles.footer, { bottom: Math.max(insets.bottom + 20, 40) }]}>
                            <Text style={styles.hintText}>Point at food and tap capture</Text>
                            <View style={styles.controls}>
                                <TouchableOpacity style={styles.controlBtn}>
                                    <Ionicons name="flash-off" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.captureBtn}
                                    onPress={capturePhoto}
                                    disabled={scanned}
                                >
                                    <View style={styles.captureInner} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.controlBtn}>
                                    <Ionicons name="images" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>

                    {/* Context Input Modal */}
                    <Modal
                        visible={showContextModal}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowContextModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Add Context (Optional)</Text>
                                <Text style={styles.modalSubtitle}>
                                    Help us get better results with additional information
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., '2 rotis', '1 bowl rice', 'medium portion'"
                                    value={userContext}
                                    onChangeText={setUserContext}
                                    multiline
                                    maxLength={100}
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.cancelBtn]}
                                        onPress={() => setShowContextModal(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Skip</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.analyzeBtn]}
                                        onPress={analyzeFood}
                                        disabled={analyzing}
                                    >
                                        <Text style={styles.analyzeBtnText}>
                                            {analyzing ? 'Analyzing...' : 'Analyze'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </>
            ) : (
                <ScrollView style={styles.resultContainer}>
                    <NutritionScoreCard nutritionData={nutritionResult} foodName={nutritionResult.foodName} />
                    
                    <View style={styles.actionButtons}>
                        <AnimatedButton
                            title="Log This Food"
                            onPress={logFood}
                            style={styles.logBtn}
                        />
                        <TouchableOpacity
                            style={styles.retakeBtn}
                            onPress={resetScanner}
                        >
                            <Text style={styles.retakeBtnText}>Scan Another</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    unfocusedContainer: { flex: 1 },
    middleContainer: { flexDirection: 'row', height: width * 0.7 },
    focusedContainer: { width: width * 0.7, height: width * 0.7, position: 'relative' },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 10,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: COLORS.primary,
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    footer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    hintText: {
        color: '#FFF',
        fontSize: FONT_SIZES.md,
        ...FONTS.medium,
        marginBottom: SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: SPACING.xxl,
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 4,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
    },
    text: { color: '#FFF' },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        margin: SPACING.lg,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        width: width - SPACING.xl * 2,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        ...FONTS.semiBold,
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    modalSubtitle: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.lg,
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: COLORS.surfaceElevated,
        marginRight: SPACING.sm,
    },
    cancelBtnText: {
        color: COLORS.textSecondary,
        ...FONTS.semiBold,
    },
    analyzeBtn: {
        backgroundColor: COLORS.primary,
        marginLeft: SPACING.sm,
    },
    analyzeBtnText: {
        color: '#FFF',
        ...FONTS.semiBold,
    },
    // Result styles
    resultContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    actionButtons: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    logBtn: {
        marginBottom: SPACING.sm,
    },
    retakeBtn: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    retakeBtnText: {
        color: COLORS.primary,
        ...FONTS.semiBold,
    },
});

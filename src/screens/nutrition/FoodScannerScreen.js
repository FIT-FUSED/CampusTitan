import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, AnimatedButton } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';
import NutritionScoreCard from '../../components/nutrition/NutritionScoreCard';
import backendAPI from '../../services/backendAPI';
import db from '../../services/database';
import { useAuth } from '../../services/AuthContext';

const { width, height } = Dimensions.get('window');

export default function FoodScannerScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    
    // Fix ref initialization
    const cameraRef = useRef(null);
    const scanAnim = useRef(new Animated.Value(0)).current;
    
    const [capturedImage, setCapturedImage] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [nutritionData, setNutritionData] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    
    const handleCameraReady = useCallback(() => {
        console.log('[FoodScanner] Camera is ready');
        setCameraReady(true);
    }, []);

    const handleCameraError = useCallback((error) => {
        console.error('[FoodScanner] Camera error:', error);
        setCameraReady(false);
        Alert.alert('Camera Error', 'Camera initialization failed. Please restart app.');
    }, []);

    const normalizeNutritionResult = useCallback((result) => {
        if (!result) return null;

        // Some backends may return the original python dict keys
        const calories =
            result.calories ??
            result["Caloric Value"] ??
            result["calories"] ??
            0;
        const protein =
            result.protein ??
            result["Protein( in g)"] ??
            result["protein"] ??
            0;
        const carbs =
            result.carbs ??
            result["Carbohydrates( in g)"] ??
            result["carbs"] ??
            0;
        const fat =
            result.fat ??
            result["Fat( in g)"] ??
            result["fat"] ??
            0;

        const foodName =
            result.food_name ??
            result.foodName ??
            result.name ??
            result["Food"] ??
            result["food"] ??
            "Unknown Food";

        // Keep raw result for debugging / future UI expansion
        return {
            ...result,
            food_name: foodName,
            calories: Number(calories) || 0,
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fat: Number(fat) || 0,
        };
    }, []);

    const analyzeFood = useCallback(async (imageUri) => {
        setAnalyzing(true);
        setScanning(false);
        try {
            console.log('[FoodScanner] Analyzing food...');
            const result = await backendAPI.analyzeFoodImage(imageUri, 'Campus meal');
            console.log('[FoodScanner] Analysis result:', result);

            if (result?.error) {
                throw new Error(result.error);
            }

            const normalized = normalizeNutritionResult(result);
            if (!normalized) {
                throw new Error('Analysis returned empty result');
            }

            setNutritionData(normalized);
        } catch (error) {
            console.error('[FoodScanner] Analysis error:', error);
            Alert.alert(
                'Analysis Failed',
                error.message || 'Failed to analyze food. Please try again.',
                [
                    { text: 'Cancel', onPress: () => resetScanner() },
                    { text: 'Retake', onPress: () => resetScanner() },
                ],
            );
        } finally {
            setAnalyzing(false);
        }
    }, [normalizeNutritionResult]);

    const capturePhoto = useCallback(async () => {
        if (!cameraRef.current || !cameraReady) {
            Alert.alert('Error', 'Camera not ready. Please wait a moment and try again.');
            return;
        }

        try {
            console.log('[FoodScanner] Attempting to capture photo...');

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: false,
            });

            if (!photo?.uri) {
                console.error('[FoodScanner] Invalid photo object:', photo);
                throw new Error('Photo capture returned invalid result');
            }

            console.log('[FoodScanner] Photo captured successfully:', photo.uri);

            setScanning(false);
            setCapturedImage(photo.uri);
            await analyzeFood(photo.uri);
        } catch (error) {
            console.error('[FoodScanner] Error capturing photo:', error);
            Alert.alert('Camera Error', `Failed to capture photo: ${error.message || 'Unknown error'}`);
            setScanning(true);
        }
    }, [analyzeFood, cameraReady]);

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

    // analyzeFood is defined above via useCallback so capturePhoto can safely call it

    const resetScanner = () => {
        setCapturedImage(null);
        setNutritionData(null);
        setAnalyzing(false);
        setScanning(true);
    };

    const logFood = async (foodData) => {
        if (!user) {
            Alert.alert('Error', 'Please log in to save food data.');
            return;
        }

        try {
            console.log('[FoodScanner] Attempting to save food data:', foodData);
            
            const normalized = normalizeNutritionResult(foodData);
            const dateStr = new Date().toISOString().split('T')[0];

            await db.addFoodLog({
                food_name: normalized.food_name,
                calories: Math.round(normalized.calories || 0),
                protein: Math.round(normalized.protein || 0),
                carbs: Math.round(normalized.carbs || 0),
                fat: Math.round(normalized.fat || 0),
                meal_type: 'detected',
                date: dateStr,
                portion: 1,
            });

            Alert.alert(
                'Success!',
                `${normalized.food_name} has been logged to your nutrition tracker.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('[FoodScanner] Error logging food:', error);
            console.error('[FoodScanner] Error details:', error.message);
            Alert.alert('Error', `Failed to save food data: ${error.message}`);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Smart Scanner" subtitle="Scan your meal" onBack={() => navigation.goBack()} transparent />

            {!capturedImage && (
                <View style={styles.cameraContainer}>
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                        onCameraReady={handleCameraReady}
                        onMountError={handleCameraError}
                    />
                    <View style={styles.overlay}>
                        <View style={styles.unfocusedContainer} />
                        <View style={styles.middleContainer}>
                            <View style={styles.unfocusedContainer} />
                            <View style={styles.focusedContainer}>
                                {/* Scanning Animation Line */}
                                {scanning && (
                                    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                                )}

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
                        <Text style={styles.footerText}>
                            Position your meal in frame and tap capture
                        </Text>
                        <TouchableOpacity
                            style={[styles.captureButton, !cameraReady && styles.captureButtonDisabled]}
                            onPress={capturePhoto}
                            activeOpacity={0.7}
                            disabled={!cameraReady}
                        >
                            <View style={styles.captureButtonInner} />
                        </TouchableOpacity>
                        {!cameraReady && (
                            <Text style={styles.cameraStatusText}>Initializing camera...</Text>
                        )}
                    </View>
                </View>
            )}

            {/* Show captured image while analyzing */}
            {capturedImage && !nutritionData && (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                    <View style={styles.analyzingOverlay}>
                        <Text style={styles.analyzingText}>Analyzing food...</Text>
                        <Text style={styles.analyzingSubtext}>Using AI to identify nutrients</Text>
                    </View>
                </View>
            )}

            {/* Show nutrition results */}
            {nutritionData && (
                <NutritionScoreCard
                    nutritionData={nutritionData}
                    onLogFood={logFood}
                    onRetake={resetScanner}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraContainer: { flex: 1, position: 'relative' },
    camera: { flex: 1 },
    overlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
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
    footerText: {
        color: '#FFF',
        fontSize: FONT_SIZES.md,
        ...FONTS.medium,
        marginBottom: SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    captureButtonDisabled: {
        opacity: 0.5,
        backgroundColor: 'rgba(128,128,128,0.3)',
        borderColor: 'rgba(255,255,255,0.5)',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
    },
    cameraStatusText: {
        color: '#FFF',
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        marginTop: SPACING.sm,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.round,
    },
    previewContainer: {
        flex: 1,
        position: 'relative',
    },
    previewImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    analyzingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    analyzingText: {
        fontSize: FONT_SIZES.lg,
        ...FONTS.bold,
        color: '#FFF',
        marginBottom: SPACING.sm,
    },
    analyzingSubtext: {
        fontSize: FONT_SIZES.sm,
        ...FONTS.medium,
        color: 'rgba(255,255,255,0.8)',
    },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../theme';
import { Header, AnimatedButton } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';
import { FOOD_DATABASE } from '../../data/seedData';

const { width, height } = Dimensions.get('window');

export default function FoodScannerScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(true);
    const scanAnim = useRef(new Animated.Value(0)).current;

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

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        setScanning(false);
        // In a real app, we'd lookup 'data' in an API. 
        // For hackathon "WOW", we simulate detection.
        const randomFood = FOOD_DATABASE[Math.floor(Math.random() * FOOD_DATABASE.length)];
        Alert.alert(
            "Food Identified! 🍲",
            `Identified: ${randomFood.name}\nApprox ${randomFood.calories} kcal`,
            [
                { text: "Retake", onPress: () => { setScanned(false); setScanning(true); } },
                { text: "Log This", onPress: () => navigation.navigate('FoodLog', { preselectedFood: randomFood }) }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Header title="Smart Scanner" subtitle="Scan your meal" onBack={() => navigation.goBack()} transparent />

            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "code128"],
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
                    <Text style={styles.hintText}>Point at a food item or barcode</Text>
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.controlBtn}>
                            <Ionicons name="flash-off" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.captureBtn}
                            onPress={() => handleBarCodeScanned({ data: 'manual' })}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlBtn}>
                            <Ionicons name="images" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
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
    text: { color: '#FFF' }
});

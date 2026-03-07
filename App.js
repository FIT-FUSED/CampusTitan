import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/services/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import sensorService from './src/services/SensorService';

function AppRoot() {
  useEffect(() => {
    // Start step tracking as early as possible
    sensorService.startTracking();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppRoot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

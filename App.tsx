import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { HabitProvider, useHabits } from './src/store/HabitContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { IntroScreen } from './src/components/IntroScreen';

// Keep native splash visible until hydration completes
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [introVisible, setIntroVisible] = useState(true);

  return (
    <SafeAreaProvider>
      <HabitProvider>
        <HydrationGate>
          {/* Main app renders in the background while the intro plays */}
          <NavigationContainer>
            <TabNavigator />
            <StatusBar style="light" />
          </NavigationContainer>

          {/* Intro overlay — unmounted once its fade-out completes */}
          {introVisible && (
            <IntroScreen onFinish={() => setIntroVisible(false)} />
          )}
        </HydrationGate>
      </HabitProvider>
    </SafeAreaProvider>
  );
}

function HydrationGate({ children }: { children: React.ReactNode }) {
  const { state } = useHabits();
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (state.loaded && !hiddenRef.current) {
      hiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [state.loaded]);

  // Safety net: force-hide after 3s if hydration stalls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hiddenRef.current) {
        hiddenRef.current = true;
        SplashScreen.hideAsync().catch(() => {});
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}

import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitProvider } from './src/store/HabitContext';
import { TabNavigator } from './src/navigation/TabNavigator';
import { Colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitProvider>
        <NavigationContainer>
          <TabNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
      </HabitProvider>
    </SafeAreaProvider>
  );
}

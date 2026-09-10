import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { StrideLogo } from './StrideLogo';

interface IntroScreenProps {
  onFinish: () => void;
}

/**
 * Branded intro overlay that animates in the Stride logo,
 * holds briefly, then cross-fades out to reveal the app.
 * Renders on top of the NavigationContainer so the tab
 * navigator loads in the background while it plays.
 */
export function IntroScreen({ onFinish }: IntroScreenProps) {
  const logoScale   = useRef(new Animated.Value(0.25)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo springs + fades in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 45,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // 2. App name fades in
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      // 3. Tagline fades in
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      // 4. Hold so the user can read it
      Animated.delay(850),
      // 5. Whole screen fades out → reveals the app underneath
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 480,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      {/* Subtle radial glow behind the logo */}
      <Animated.View
        style={[
          styles.glow,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      />

      <Animated.View
        style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
      >
        <StrideLogo size={88} color="#fff" />
      </Animated.View>

      <Animated.Text style={[styles.name, { opacity: nameOpacity }]}>
        Stride
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Build habits that stick
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4A6CF7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  name: {
    marginTop: 22,
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.2,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.15,
  },
});

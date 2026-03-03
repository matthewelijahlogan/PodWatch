import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ImageBackground, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }) {
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(120)).current;
  const logoRotate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.timing(splashOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000),
    ]);

    sequence.start(() => {
      navigation.replace('MainTabs');
    });
  }, [navigation, logoOpacity, logoRotate, logoTranslateY, splashOpacity]);

  const rollInRotate = logoRotate.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-360deg', '0deg'],
  });

  return (
    <ImageBackground source={require('../../assets/images/splash.png')} style={styles.root} resizeMode="cover">
      <Animated.View style={[styles.overlay, { opacity: splashOpacity }]}>
        <Animated.Image
          source={require('../../assets/images/logo.png')}
          style={[
            styles.logo,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }, { rotate: rollInRotate }],
            },
          ]}
        />
        <Text style={styles.title}>PodWatch</Text>
        <Text style={styles.sub}>Mobile Edition</Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sub: {
    color: '#94a3b8',
    marginTop: 8,
  },
});

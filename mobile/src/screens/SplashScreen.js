import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen({ navigation }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 1600);

    return () => clearTimeout(timer);
  }, [navigation, spin]);

  const spinRotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <Animated.Image source={require('../../assets/images/logo.png')} style={[styles.logo, { transform: [{ rotate: spinRotate }] }]} />
      <Text style={styles.title}>PodWatch</Text>
      <Text style={styles.sub}>Mobile Edition</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
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
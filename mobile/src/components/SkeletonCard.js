import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.topRow}>
        <View style={styles.thumb} />
        <View style={styles.lines}>
          <View style={styles.lineLong} />
          <View style={styles.lineShort} />
        </View>
      </View>
      <View style={styles.chip} />
      <View style={styles.chip} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  topRow: { flexDirection: 'row' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
  },
  lines: { flex: 1, marginLeft: 10, justifyContent: 'center' },
  lineLong: { height: 12, borderRadius: 6, backgroundColor: '#cbd5e1', marginBottom: 8 },
  lineShort: { width: '70%', height: 10, borderRadius: 5, backgroundColor: '#cbd5e1' },
  chip: {
    marginTop: 10,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
});
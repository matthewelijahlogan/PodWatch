import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScreenContainer({ title, subtitle, children }) {
  return (
    <LinearGradient colors={['#060b1a', '#111d3b', '#0f172a']} style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 4,
    color: '#cbd5e1',
  },
  content: {
    marginTop: 12,
    flex: 1,
  },
});

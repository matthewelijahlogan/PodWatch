import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function FavoriteButton({ active, onPress }) {
  return (
    <Pressable style={[styles.button, active && styles.active]} onPress={onPress}>
      <Text style={[styles.icon, active && styles.iconActive]}>{active ? '\u2605' : '\u2606'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  active: {
    backgroundColor: '#172554',
    borderColor: '#60a5fa',
  },
  icon: {
    color: '#94a3b8',
    fontSize: 16,
  },
  iconActive: {
    color: '#fbbf24',
  },
});

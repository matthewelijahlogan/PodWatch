import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SegmentedControl({ value, options, onChange }) {
  return (
    <View style={styles.root}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: '#0b1328',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: '#2563eb',
  },
  label: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  labelSelected: {
    color: '#eff6ff',
  },
});

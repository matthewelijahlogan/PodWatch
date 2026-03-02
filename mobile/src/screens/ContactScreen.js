import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function onSubmit() {
    if (!name || !email || !message) {
      Alert.alert('Missing fields', 'Please complete all fields before sending.');
      return;
    }
    const mailto = `mailto:contact@podwatch.app?subject=${encodeURIComponent(`PodWatch contact from ${name}`)}&body=${encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`)}`;
    Linking.openURL(mailto);
  }

  return (
    <ScreenContainer title="Contact" subtitle="Questions, requests, and feedback">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your Name" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <TextInput value={message} onChangeText={setMessage} style={[styles.input, styles.textarea]} placeholder="Your Message" multiline numberOfLines={5} />
        </View>
        <Pressable style={styles.button} onPress={onSubmit}>
          <Text style={styles.buttonText}>Send Message</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 20 },
  field: { marginBottom: 12 },
  label: { color: '#0f172a', fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '800' },
});
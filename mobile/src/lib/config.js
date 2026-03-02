import { Platform } from 'react-native';

const fallbackBaseUrl = Platform.select({
  // Use localhost so adb reverse can serve physical Android devices over USB during development.
  android: 'http://127.0.0.1:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || fallbackBaseUrl;

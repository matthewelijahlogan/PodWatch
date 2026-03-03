import { Platform } from 'react-native';

const PROD_BASE_URL = 'https://podwatch.onrender.com';

const devLocalBaseUrl = Platform.select({
  android: 'http://127.0.0.1:5000',
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

function normalizeBaseUrl(value) {
  return (value || '').trim().replace(/\/+$/, '');
}

const envBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
const devBaseUrl = normalizeBaseUrl(devLocalBaseUrl);

// Priority:
// 1) EXPO_PUBLIC_API_BASE_URL (explicit override)
// 2) Hosted Render API (works out of the box for production users)
// 3) Local dev base URL (only if production URL is removed)
export const API_BASE_URL = envBaseUrl || PROD_BASE_URL || devBaseUrl;

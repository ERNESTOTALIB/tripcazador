/**
 * Auth helpers — SecureStore para tokens sensibles, AsyncStorage para flags.
 *
 * Esquema:
 *   - `tc_premium_token`     SecureStore (Keychain iOS / EncryptedSharedPrefs Android)
 *   - `tc_concierge_token`   SecureStore (magic-link HMAC token)
 *   - `tc_email`             AsyncStorage (no sensible, solo display)
 *   - `tc_premium_active`    AsyncStorage (boolean cached)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PREMIUM_TOKEN: 'tc_premium_token',
  CONCIERGE_TOKEN: 'tc_concierge_token',
  EMAIL: 'tc_email',
  PREMIUM_ACTIVE: 'tc_premium_active',
  ONBOARDING_DONE: 'tc_onboarding_done',
} as const;

// ---------- Secure tokens ----------

export async function setPremiumToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.PREMIUM_TOKEN, token);
}

export async function getPremiumToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.PREMIUM_TOKEN);
  } catch {
    return null;
  }
}

export async function clearPremiumToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.PREMIUM_TOKEN);
}

export async function setConciergeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.CONCIERGE_TOKEN, token);
}

export async function getConciergeToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.CONCIERGE_TOKEN);
  } catch {
    return null;
  }
}

export async function clearConciergeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.CONCIERGE_TOKEN);
}

// ---------- Display flags ----------

export async function setEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.EMAIL, email);
}

export async function getEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.EMAIL);
}

export async function setPremiumActive(active: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREMIUM_ACTIVE, active ? '1' : '0');
}

export async function getPremiumActive(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.PREMIUM_ACTIVE);
  return v === '1';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, '1');
}

export async function isOnboardingDone(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return v === '1';
}

export async function clearAll(): Promise<void> {
  await Promise.all([
    clearPremiumToken(),
    clearConciergeToken(),
    AsyncStorage.removeItem(KEYS.EMAIL),
    AsyncStorage.removeItem(KEYS.PREMIUM_ACTIVE),
  ]);
}

// ---------- Auth headers builder ----------

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const premiumToken = await getPremiumToken();
  if (premiumToken) {
    headers['Authorization'] = `Bearer ${premiumToken}`;
  }
  return headers;
}

/**
 * Tracking client — POST eventos al backend track endpoint.
 *
 * Fire-and-forget. No bloquea UI. Consent-aware: si user deshabilitó
 * tracking (settings → privacy → analytics), no enviamos.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Config } from '@/constants/config';

const CONSENT_KEY = 'tc_analytics_consent';

export async function setAnalyticsConsent(consent: boolean): Promise<void> {
  await AsyncStorage.setItem(CONSENT_KEY, consent ? '1' : '0');
}

export async function getAnalyticsConsent(): Promise<boolean> {
  // Default: true (opt-out model — common en mobile apps con privacy
  // disclosure en el onboarding). Si quisiéramos opt-in lo cambiamos.
  const v = await AsyncStorage.getItem(CONSENT_KEY);
  return v !== '0';
}

let cachedConsent: boolean | null = null;

export function tcTrack(event: string, props: Record<string, string | number | boolean | null | undefined> = {}): void {
  void (async () => {
    if (cachedConsent === null) {
      cachedConsent = await getAnalyticsConsent();
    }
    if (!cachedConsent) return;
    try {
      await fetch(`${Config.API_BASE}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          props: {
            ...props,
            platform: Platform.OS,
            app_version: Config.APP_VERSION,
          },
          ts: Date.now(),
        }),
        keepalive: true,
      });
    } catch {
      // Fire-and-forget
    }
  })();
}

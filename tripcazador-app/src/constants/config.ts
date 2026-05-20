/**
 * Runtime config — leído de env vars Expo o defaults seguros.
 *
 * En dev, Expo lee de app.json `extra`. En prod, EAS Build inyecta via
 * `eas.json` env config. Para overrides locales: cp .env.example .env y
 * el plugin de Expo CLI las recoge en `process.env.EXPO_PUBLIC_*`.
 */

import Constants from 'expo-constants';

const extra = (Constants?.expoConfig?.extra ?? {}) as Record<string, string>;

function envOr(key: string, fallback: string): string {
  const expoEnv = process.env[`EXPO_PUBLIC_${key}`];
  if (expoEnv && expoEnv.length > 0) return expoEnv;
  if (extra[key]) return extra[key];
  return fallback;
}

export const Config = {
  API_BASE: envOr('API_BASE', 'https://tripcazador.com'),
  WEB_BASE: envOr('WEB_BASE', 'https://tripcazador.com'),
  TELEGRAM_URL: 'https://t.me/TripCazador',
  TELEGRAM_BOT: 'https://t.me/tripcazador_bot',
  SUPPORT_EMAIL: 'soporte@tripcazador.com',
  PRESS_EMAIL: 'prensa@tripcazador.com',
  // Versión legible (npm version semver) — Expo Constants tiene la
  // versión completa pero esta es la que mostramos en /settings.
  APP_VERSION: Constants?.expoConfig?.version ?? '0.1.0',
  BUILD_VERSION:
    Constants?.expoConfig?.ios?.buildNumber ??
    String(Constants?.expoConfig?.android?.versionCode ?? '1'),
  // Sentry DSN cliente — si está set se inicializa en _layout root.
  SENTRY_DSN: envOr('SENTRY_DSN', ''),
} as const;

export type AppConfig = typeof Config;

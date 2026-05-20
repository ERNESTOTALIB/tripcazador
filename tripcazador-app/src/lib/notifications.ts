/**
 * Push notifications — Expo Notifications API.
 *
 * Flujo:
 *  1. Solicitar permisos (iOS muestra prompt, Android 13+ también)
 *  2. Obtener Expo push token
 *  3. Registrar el token contra `/api/push/register` en backend
 *  4. Listener para foreground notifications (Expo gestiona background automáticamente)
 *
 * Tipos de push:
 *  - "deal" → tap → /deals/[id]
 *  - "alert" → tap → /panel/premium/alertas
 *  - "concierge" → tap → /concierge/mis-pedidos
 *  - "milestone" → tap → /panel/premium (celebra ROI)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Config } from '@/constants/config';
import { registerPushToken } from './api';

// Default handler — mostrar siempre las notificaciones en foreground.
// Si quisiéramos silenciar algunas categorías, gestionamos aquí.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // SDK 53+ requiere shouldShowBanner/shouldShowList. Mantenemos los
    // legacy hasta que el SDK lo exija.
  }),
});

export interface RegisterResult {
  ok: boolean;
  token?: string;
  reason?: 'denied' | 'simulator' | 'error';
}

export async function registerForPushNotifications(): Promise<RegisterResult> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'simulator' };
  }

  // Android: crear canal antes de pedir permiso (best practice)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TripCazador',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
      sound: 'default',
    });
    // Canal específico para deals hot (prioridad MAX)
    await Notifications.setNotificationChannelAsync('hot-deals', {
      name: 'Chollos en vivo',
      description:
        'Notificaciones de error fares cazados en tiempo real. Stock limitado.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 100, 300],
      lightColor: '#f59e0b',
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { ok: false, reason: 'denied' };
  }

  try {
    const projectId =
      // expo-constants infiere el projectId desde eas.json en runtime
      // Fallback null: en dev se genera token "ExponentPushToken[xxx]"
      undefined;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const expoToken = token.data;

    // Best-effort register al backend — no bloquea si falla
    void registerPushToken({
      token: expoToken,
      platform: Platform.OS as 'ios' | 'android',
      app_version: Config.APP_VERSION,
    }).catch(() => null);

    return { ok: true, token: expoToken };
  } catch (e) {
    console.warn('[notifications] getExpoPushTokenAsync failed', e);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Listener para tap en notificación — gestionar deep-link a la pantalla
 * correspondiente. Llamar desde el _layout root.
 */
export function addNotificationResponseListener(
  handler: (data: Record<string, unknown>) => void,
): { remove: () => void } {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    handler(data || {});
  });
  return sub;
}

export function addForegroundNotificationListener(
  handler: (notification: Notifications.Notification) => void,
): { remove: () => void } {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Reset badge count — llamar cuando user abre la app desde notif.
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0).catch(() => null);
}

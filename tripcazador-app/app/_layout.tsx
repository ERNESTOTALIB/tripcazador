/**
 * Root layout — wraps todo en StatusBar dark + Stack navigator.
 *
 * Responsabilidades:
 *  - StatusBar style según userInterfaceStyle (dark forced)
 *  - SplashScreen hide después de hydration
 *  - Notification response listener para deep-link
 *  - Track app_open en startup
 */

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { addNotificationResponseListener, clearBadge } from '@/lib/notifications';
import { tcTrack } from '@/lib/track';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore: splash already hidden */
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Track app open
    tcTrack('app_open', {});
    // Clear badge counter (iOS muestra rojo en icon)
    void clearBadge();

    // Hide splash después de hidratación (un tick)
    const splashTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => null);
    }, 50);

    // Listener para tap en notificación → deep link
    const sub = addNotificationResponseListener((data) => {
      const kind = typeof data.kind === 'string' ? data.kind : '';
      const dealId = typeof data.deal_id === 'string' ? data.deal_id : '';
      tcTrack('notification_tap', { kind });

      if (kind === 'deal' && dealId) {
        router.push({ pathname: '/deal/[id]', params: { id: dealId } });
      } else if (kind === 'alert') {
        router.push('/(tabs)/alerts');
      } else if (kind === 'concierge') {
        router.push('/concierge');
      } else if (kind === 'milestone') {
        router.push('/(tabs)/account');
      }
    });

    return () => {
      clearTimeout(splashTimer);
      sub.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.bg },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: Colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="deal/[id]"
            options={{ title: 'Chollo', presentation: 'card' }}
          />
          <Stack.Screen
            name="premium"
            options={{ title: 'TripCazador Premium', presentation: 'modal' }}
          />
          <Stack.Screen
            name="concierge"
            options={{ title: 'Concierge', presentation: 'modal' }}
          />
          <Stack.Screen name="settings" options={{ title: 'Ajustes' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

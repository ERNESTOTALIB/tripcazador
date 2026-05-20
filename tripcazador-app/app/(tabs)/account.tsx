/**
 * Account screen — perfil del user.
 *
 * Sections:
 *  - Header con email + status (Premium/Free)
 *  - ROI widget si Premium
 *  - Settings menu:
 *     - Premium / billing
 *     - Concierge
 *     - Notificaciones
 *     - Ajustes
 *     - Soporte
 *     - Sobre TripCazador
 *     - Cerrar sesión
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { usePremium } from '@/hooks/usePremium';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PremiumBanner } from '@/components/PremiumBanner';
import { formatEur } from '@/lib/format';
import { clearAll } from '@/lib/auth';
import { tcTrack } from '@/lib/track';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function AccountScreen() {
  const router = useRouter();
  const { active: isPremium, email, stats, loading, refresh } = usePremium();

  if (loading) return <LoadingScreen label="Cargando cuenta…" />;

  const menuItems: MenuItem[] = [
    {
      icon: 'card-outline',
      label: isPremium ? 'Gestionar Premium' : 'Probar Premium',
      onPress: () => {
        tcTrack('account_menu_click', { item: 'premium' });
        router.push('/premium');
      },
    },
    {
      icon: 'briefcase-outline',
      label: 'Concierge — reservas asistidas',
      onPress: () => {
        tcTrack('account_menu_click', { item: 'concierge' });
        router.push('/concierge');
      },
    },
    {
      icon: 'notifications-outline',
      label: 'Notificaciones',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Centro de ayuda',
      onPress: () => {
        void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/faq`);
      },
    },
    {
      icon: 'mail-outline',
      label: 'Contactar soporte',
      onPress: () => {
        void WebBrowser.openBrowserAsync(`mailto:${Config.SUPPORT_EMAIL}`);
      },
    },
    {
      icon: 'information-circle-outline',
      label: 'Sobre TripCazador',
      onPress: () => router.push('/settings'),
    },
    {
      icon: 'log-out-outline',
      label: 'Cerrar sesión',
      destructive: true,
      onPress: async () => {
        tcTrack('account_logout', {});
        await clearAll();
        await refresh();
      },
    },
  ];

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{email ? email[0]?.toUpperCase() : '?'}</Text>
          </View>
          <Text style={styles.email}>{email || 'No has iniciado sesión'}</Text>
          <View style={[styles.tierBadge, isPremium && styles.tierBadgePremium]}>
            <Text style={[styles.tierBadgeText, isPremium && styles.tierBadgeTextPremium]}>
              {isPremium ? '✨ Premium activo' : 'Free'}
            </Text>
          </View>
        </View>

        {isPremium && stats && (
          <View style={styles.roiCard}>
            <Text style={styles.roiLabel}>Has ahorrado</Text>
            <Text style={styles.roiAmount}>{formatEur(stats.total_savings_eur)}</Text>
            <View style={styles.roiStats}>
              <View style={styles.roiStat}>
                <Text style={styles.roiStatValue}>{stats.alerts_triggered}</Text>
                <Text style={styles.roiStatLabel}>chollos cazados</Text>
              </View>
              <View style={styles.roiStat}>
                <Text style={styles.roiStatValue}>{stats.days_active}</Text>
                <Text style={styles.roiStatLabel}>días activo</Text>
              </View>
              <View style={styles.roiStat}>
                <Text style={styles.roiStatValue}>{stats.watchlist_count}</Text>
                <Text style={styles.roiStatLabel}>watch list</Text>
              </View>
            </View>
          </View>
        )}

        {!isPremium && <PremiumBanner variant="full" reason="account_tab" />}

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                i === menuItems.length - 1 && { borderBottomWidth: 0 },
                pressed && { backgroundColor: Colors.surfaceAlt },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={item.destructive ? Colors.error : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.menuLabel,
                  item.destructive && { color: Colors.error },
                ]}
              >
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSubtle} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.versionLabel}>
          TripCazador v{Config.APP_VERSION} ({Config.BUILD_VERSION})
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14, paddingBottom: 50 },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { color: Colors.bg, fontSize: 30, fontWeight: '800' },
  email: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 6 },
  tierBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierBadgePremium: {
    backgroundColor: Colors.amberSubtle,
    borderColor: Colors.amberBorder,
  },
  tierBadgeText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  tierBadgeTextPremium: { color: Colors.amber },
  roiCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginBottom: 18,
  },
  roiLabel: { color: Colors.textMuted, fontSize: 13 },
  roiAmount: { color: Colors.success, fontSize: 36, fontWeight: '800', marginVertical: 4 },
  roiStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  roiStat: { alignItems: 'center', flex: 1 },
  roiStatValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  roiStatLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  menu: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  menuLabel: { color: Colors.textPrimary, fontSize: 15, flex: 1 },
  versionLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    textAlign: 'center',
  },
});

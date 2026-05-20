/**
 * Alerts screen — solo Premium. Para no-Premium muestra paywall.
 *
 * Lista alertas activas + botón "Crear alerta". Cada alerta es swipeable
 * para borrar (gesture-handler).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { usePremium } from '@/hooks/usePremium';
import { listAlerts, deleteAlert } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PremiumBanner } from '@/components/PremiumBanner';
import type { Alert } from '@/types/premium';
import { tcTrack } from '@/lib/track';

export default function AlertsScreen() {
  const { active: isPremium, loading: premiumLoading } = usePremium();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await listAlerts();
    if (res.data?.alerts) setAlerts(res.data.alerts);
    setLoading(false);
  }

  useEffect(() => {
    if (isPremium) void refresh();
    else setLoading(false);
  }, [isPremium]);

  function onDelete(id: string) {
    RNAlert.alert(
      '¿Borrar alerta?',
      'No volverás a recibir avisos para esta búsqueda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            tcTrack('alert_delete', { id });
            await deleteAlert(id);
            await refresh();
          },
        },
      ],
    );
  }

  if (premiumLoading || loading) {
    return <LoadingScreen label="Cargando alertas…" />;
  }

  if (!isPremium) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.container}>
        <View style={styles.paywall}>
          <Text style={styles.paywallEmoji}>🔔</Text>
          <Text style={styles.paywallTitle}>Alertas Premium</Text>
          <Text style={styles.paywallDescription}>
            Recibe los chollos en menos de 60 segundos. Sin filtro, sin esperas,
            sin perder el stock limitado.
          </Text>
          <PremiumBanner variant="full" reason="alerts_tab" />
          <Pressable
            onPress={() => router.push('/premium')}
            style={styles.paywallCta}
          >
            <Text style={styles.paywallCtaText}>Probar 14 días gratis</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Mis alertas</Text>
              <Text style={styles.subheading}>
                {alerts.length} {alerts.length === 1 ? 'alerta activa' : 'alertas activas'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                tcTrack('alert_create_open', {});
                // TODO: open create-alert modal screen
              }}
              style={styles.addBtn}
              accessibilityLabel="Crear alerta"
            >
              <Ionicons name="add" size={22} color={Colors.bg} />
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertName}>
                {item.name || `${item.origin || '*'} → ${item.destination || 'cualquiera'}`}
              </Text>
              <Text style={styles.alertMeta}>
                {item.max_price_eur ? `≤${item.max_price_eur}€` : 'sin tope'}
                {item.nights_min || item.nights_max
                  ? ` · ${item.nights_min ?? 0}-${item.nights_max ?? '∞'} noches`
                  : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
              accessibilityLabel="Borrar alerta"
            >
              <Ionicons name="trash" size={18} color={Colors.error} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title="Aún no tienes alertas"
            description="Crea tu primera alerta para recibir chollos personalizados en cuanto aparezcan."
            ctaLabel="Crear primera alerta"
            onCtaPress={() => {
              tcTrack('alert_create_open', { from: 'empty_state' });
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    padding: 14,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subheading: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  alertName: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  alertMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywall: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  paywallEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  paywallTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  paywallDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  paywallCta: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  paywallCtaText: {
    color: Colors.bg,
    fontSize: 15,
    fontWeight: '800',
  },
});

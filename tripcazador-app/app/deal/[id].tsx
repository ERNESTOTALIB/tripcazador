/**
 * Deal detail — abre con tap en DealCard. Muestra:
 *  - Hero con destino + savings
 *  - Precio breakdown
 *  - Datos vuelo (fechas, aerolínea, nights, escalas)
 *  - CTA "Reservar ahora" → in-app browser a booking_url
 *  - Affiliate cross-sells (Heymondo, Holafly, GYG) — wired al backend
 *  - Watch deal button (Premium)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { getDealById } from '@/lib/api';
import { formatEur, formatDateRange, relativeTimeAgo } from '@/lib/format';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmptyState } from '@/components/EmptyState';
import { tcTrack } from '@/lib/track';
import { usePremium } from '@/hooks/usePremium';
import type { Deal } from '@/types/deal';

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { active: isPremium } = usePremium();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const res = await getDealById(id);
      if (res.data) setDeal(res.data);
      if (res.error) setError(res.error);
      setLoading(false);
      tcTrack('deal_view', { id });
    })();
  }, [id]);

  if (loading) return <LoadingScreen label="Cargando chollo…" />;

  if (error || !deal) {
    return (
      <EmptyState
        icon="🤷‍♂️"
        title="Chollo no encontrado"
        description="Este deal puede haber expirado. Mira los chollos activos."
        ctaLabel="Volver al feed"
        onCtaPress={() => router.replace('/')}
      />
    );
  }

  async function onReserve() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    tcTrack('deal_booking_click', { id: deal!.id, destination: deal!.destination });
    void WebBrowser.openBrowserAsync(deal!.booking_url, {
      controlsColor: Colors.amber,
      toolbarColor: Colors.bg,
    });
  }

  async function onShare() {
    tcTrack('deal_share', { id: deal!.id });
    await Share.share({
      message: `${deal!.headline} — ${formatEur(deal!.price_eur)}\n${Config.WEB_BASE}/deals/${deal!.id}`,
      url: `${Config.WEB_BASE}/deals/${deal!.id}`,
    });
  }

  function onWatch() {
    if (!isPremium) {
      router.push('/premium');
      return;
    }
    setWatching((v) => !v);
    tcTrack('deal_watch_toggle', { id: deal!.id, watching: !watching });
  }

  const isHot = deal.hot_until ? new Date(deal.hot_until).getTime() > Date.now() : false;

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✈️</Text>
          {isHot && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>🔥 EN VIVO</Text>
            </View>
          )}
        </View>

        <View style={styles.routeRow}>
          <Text style={styles.iata}>{deal.origin}</Text>
          <Ionicons name="airplane" size={18} color={Colors.amber} />
          <Text style={styles.iata}>{deal.destination}</Text>
          <Text style={styles.city}>{deal.city_to}</Text>
        </View>

        <Text style={styles.headline}>{deal.headline}</Text>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total ida y vuelta</Text>
          <Text style={styles.price}>{formatEur(deal.price_eur)}</Text>
          {deal.savings_eur && (
            <Text style={styles.savings}>
              Ahorras {formatEur(deal.savings_eur)} ({deal.savings_pct}%)
            </Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onReserve}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            accessibilityLabel="Reservar este vuelo"
          >
            <Ionicons name="open-outline" size={18} color={Colors.bg} />
            <Text style={styles.primaryBtnText}>Reservar ahora</Text>
          </Pressable>
          <Pressable onPress={onWatch} style={styles.iconBtn} accessibilityLabel="Vigilar precio">
            <Ionicons name={watching ? 'eye' : 'eye-outline'} size={20} color={Colors.amber} />
          </Pressable>
          <Pressable onPress={onShare} style={styles.iconBtn} accessibilityLabel="Compartir chollo">
            <Ionicons name="share-outline" size={20} color={Colors.amber} />
          </Pressable>
        </View>

        {/* Datos */}
        <View style={styles.metaCard}>
          {deal.airline_name && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Aerolínea</Text>
              <Text style={styles.metaVal}>{deal.airline_name}</Text>
            </View>
          )}
          {deal.date_out && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Fechas</Text>
              <Text style={styles.metaVal}>{formatDateRange(deal.date_out, deal.date_ret)}</Text>
            </View>
          )}
          {deal.nights && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Duración</Text>
              <Text style={styles.metaVal}>
                {deal.nights} {deal.nights === 1 ? 'noche' : 'noches'}
              </Text>
            </View>
          )}
          {deal.cabin && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Clase</Text>
              <Text style={styles.metaVal}>{deal.cabin}</Text>
            </View>
          )}
          {deal.hot_until && (
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Cazado</Text>
              <Text style={styles.metaVal}>{relativeTimeAgo(deal.hot_until)}</Text>
            </View>
          )}
        </View>

        {/* Cross-sells affiliate */}
        <View style={styles.affBox}>
          <Text style={styles.affTitle}>Completa tu viaje</Text>
          <Pressable
            onPress={() => {
              tcTrack('affiliate_click_mobile', { partner: 'heymondo', deal_id: deal.id });
              void WebBrowser.openBrowserAsync(
                `${Config.WEB_BASE}/api/aff/heymondo?dest=${deal.destination}`,
              );
            }}
            style={styles.affItem}
          >
            <Text style={styles.affItemTitle}>🛡️ Seguro viaje · Heymondo</Text>
            <Text style={styles.affItemSub}>desde 1,87€/día · 5% off TripCazador</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tcTrack('affiliate_click_mobile', { partner: 'holafly', deal_id: deal.id });
              void WebBrowser.openBrowserAsync(
                `${Config.WEB_BASE}/api/aff/holafly?dest=${deal.destination}`,
              );
            }}
            style={styles.affItem}
          >
            <Text style={styles.affItemTitle}>📡 eSIM datos · Holafly</Text>
            <Text style={styles.affItemSub}>sin roaming · activa en 5min</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              tcTrack('affiliate_click_mobile', { partner: 'getyourguide', deal_id: deal.id });
              void WebBrowser.openBrowserAsync(
                `${Config.WEB_BASE}/api/aff/getyourguide?city=${encodeURIComponent(deal.city_to)}`,
              );
            }}
            style={styles.affItem}
          >
            <Text style={styles.affItemTitle}>🗺️ Tours en {deal.city_to}</Text>
            <Text style={styles.affItemSub}>GetYourGuide · cancelación gratis</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimer}>
          Los precios cambian rápido. Verifica siempre en la web de la aerolínea
          antes de reservar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14, paddingBottom: 40 },
  hero: {
    height: 180,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  heroEmoji: { fontSize: 80, opacity: 0.4 },
  hotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.amber,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  hotBadgeText: { color: Colors.bg, fontWeight: '800', fontSize: 11 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iata: { color: Colors.textMuted, fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  city: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14, marginLeft: 'auto' },
  headline: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  priceBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginBottom: 16,
  },
  priceLabel: { color: Colors.textMuted, fontSize: 12 },
  price: { color: Colors.amber, fontSize: 38, fontWeight: '800', marginVertical: 4 },
  savings: { color: Colors.success, fontSize: 14, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.amber,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 15 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  metaKey: { color: Colors.textMuted, fontSize: 13 },
  metaVal: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  affBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  affTitle: {
    color: Colors.amber,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  affItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  affItemTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  affItemSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  disclaimer: {
    color: Colors.textSubtle,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

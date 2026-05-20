/**
 * DealCard — versión nativa del componente DealCard de la web. Layout
 * optimizado para listas verticales mobile, con:
 *  - Hero image (city silhouette)
 *  - Origin → Destination
 *  - Precio destacado + savings %
 *  - Airline + nights badges
 *  - Hot badge si hot_until > now
 *  - Tap → navigate a deal detail
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { formatEur, formatDateRange, truncate } from '@/lib/format';
import { tcTrack } from '@/lib/track';
import type { Deal } from '@/types/deal';

interface Props {
  deal: Deal;
  variant?: 'card' | 'compact';
}

export function DealCard({ deal, variant = 'card' }: Props) {
  const router = useRouter();
  const isHot = deal.hot_until ? new Date(deal.hot_until).getTime() > Date.now() : false;

  function onPress() {
    tcTrack('deal_card_click', { id: deal.id, destination: deal.destination });
    router.push({ pathname: '/deal/[id]', params: { id: deal.id } });
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        variant === 'compact' && styles.cardCompact,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Vuelo a ${deal.city_to} desde ${formatEur(deal.price_eur)}`}
    >
      {/* Hero gradient with destination */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>✈️</Text>
        <View style={styles.heroOverlay}>
          {isHot && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>🔥 EN VIVO</Text>
            </View>
          )}
          {deal.savings_pct && deal.savings_pct >= 40 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>-{deal.savings_pct}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.body}>
        <View style={styles.routeRow}>
          <Text style={styles.iata}>{deal.origin}</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
          <Text style={styles.iata}>{deal.destination}</Text>
        </View>

        <Text style={styles.headline} numberOfLines={2}>
          {truncate(deal.headline, 64)}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {deal.airline_name || deal.airline || 'Múltiples aerolíneas'}
          </Text>
          {deal.nights ? (
            <>
              <Text style={styles.metaDivider}>·</Text>
              <Text style={styles.metaText}>
                {deal.nights} {deal.nights === 1 ? 'noche' : 'noches'}
              </Text>
            </>
          ) : null}
        </View>

        {deal.date_out && (
          <Text style={styles.dates}>{formatDateRange(deal.date_out, deal.date_ret)}</Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>desde</Text>
          <Text style={styles.price}>{formatEur(deal.price_eur)}</Text>
          {deal.savings_eur && (
            <Text style={styles.savings}>ahorras {formatEur(deal.savings_eur)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardCompact: {
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  hero: {
    height: 110,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 48,
    opacity: 0.4,
  },
  heroOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hotBadge: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: Colors.bg,
    fontSize: 11,
    fontWeight: '800',
  },
  savingsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)', // emerald
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  savingsBadgeText: {
    color: Colors.bg,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  iata: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headline: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  metaDivider: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  dates: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  priceLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  price: {
    color: Colors.amber,
    fontSize: 22,
    fontWeight: '800',
  },
  savings: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
});

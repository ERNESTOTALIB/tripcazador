/**
 * Home screen — feed de chollos.
 *
 * Pull-to-refresh, banner Premium si user no es Premium, lista ordenada
 * por score+savings_pct, FlatList con keyExtractor para performance.
 */

import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useDeals } from '@/hooks/useDeals';
import { usePremium } from '@/hooks/usePremium';
import { DealCard } from '@/components/DealCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PremiumBanner } from '@/components/PremiumBanner';

export default function HomeScreen() {
  const { deals, loading, refreshing, error, refresh } = useDeals({ limit: 50 });
  const { active: isPremium } = usePremium();

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => {
      // Hot deals primero
      const aHot = a.hot_until && new Date(a.hot_until).getTime() > Date.now() ? 1 : 0;
      const bHot = b.hot_until && new Date(b.hot_until).getTime() > Date.now() ? 1 : 0;
      if (aHot !== bHot) return bHot - aHot;
      // Después por savings_pct
      return (b.savings_pct ?? 0) - (a.savings_pct ?? 0);
    });
  }, [deals]);

  if (loading && deals.length === 0) {
    return <LoadingScreen />;
  }

  if (error && deals.length === 0) {
    return (
      <EmptyState
        icon="⚠️"
        title="No hemos podido cargar los chollos"
        description={`Reintenta en unos segundos. Si persiste, comprueba tu conexión. (${error})`}
        ctaLabel="Reintentar"
        onCtaPress={refresh}
      />
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <FlatList
        data={sortedDeals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Chollos cazados hoy</Text>
            <Text style={styles.subheading}>
              {sortedDeals.length} {sortedDeals.length === 1 ? 'oferta verificada' : 'ofertas verificadas'}
            </Text>
            {!isPremium && <PremiumBanner variant="compact" reason="list_cta" />}
          </View>
        }
        renderItem={({ item }) => <DealCard deal={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.amber}
            colors={[Colors.amber]}
            progressBackgroundColor={Colors.surface}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔎"
            title="Aún no hay chollos activos"
            description="Estamos cazando. Vuelve en unos minutos o crea una alerta para que te avisemos en cuanto aparezca uno a tu destino."
            ctaLabel="Crear alerta gratis"
            onCtaPress={() => {}}
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
  heading: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subheading: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 14,
  },
});

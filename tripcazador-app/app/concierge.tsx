/**
 * Concierge — reserva asistida.
 *
 * MVP: 4 tiers (Express €9 / Standard €19 / Premium €49 / Pro €99) +
 * formulario simple para iniciar. Submit abre Stripe Checkout web.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { tcTrack } from '@/lib/track';

interface Tier {
  slug: 'express' | 'standard' | 'premium' | 'pro';
  name: string;
  price: number;
  sla: string;
  features: string[];
  highlighted?: boolean;
}

const TIERS: Tier[] = [
  {
    slug: 'express',
    name: 'Express',
    price: 9,
    sla: '12h',
    features: ['1 ruta + 2 fechas', 'Resumen en 12h', 'Email'],
  },
  {
    slug: 'standard',
    name: 'Standard',
    price: 19,
    sla: '24h',
    features: ['3 rutas + 4 fechas', 'Resumen + alternativas', 'Garantía mejor opción'],
    highlighted: true,
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 49,
    sla: '48h',
    features: ['Itinerario completo', 'Hotel + traslados', 'Soporte 1:1'],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price: 99,
    sla: '120h',
    features: ['Full trip plan', '+ visado/eSIM info', 'Plan B contingencia'],
  },
];

export default function ConciergeScreen() {
  const [selected, setSelected] = useState<Tier['slug']>('standard');
  function onCheckout(tier: Tier) {
    tcTrack('concierge_checkout_click', { tier: tier.slug, price: tier.price });
    void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/concierge/${tier.slug}`, {
      controlsColor: Colors.amber,
      toolbarColor: Colors.bg,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Concierge</Text>
        <Text style={styles.subtitle}>
          ¿No tienes tiempo de cazar? Nosotros lo hacemos por ti.
        </Text>

        {TIERS.map((tier) => {
          const isSelected = selected === tier.slug;
          return (
            <Pressable
              key={tier.slug}
              onPress={() => setSelected(tier.slug)}
              style={[
                styles.tierCard,
                tier.highlighted && styles.tierCardHighlighted,
                isSelected && styles.tierCardSelected,
              ]}
            >
              {tier.highlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Más popular</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPrice}>{tier.price}€</Text>
              </View>
              <Text style={styles.tierSla}>Entrega en {tier.sla}</Text>
              {tier.features.map((f, i) => (
                <Text key={i} style={styles.tierFeature}>
                  ✓ {f}
                </Text>
              ))}
              <Pressable
                onPress={() => onCheckout(tier)}
                style={[
                  styles.tierCta,
                  tier.highlighted && styles.tierCtaHighlighted,
                ]}
              >
                <Text
                  style={[
                    styles.tierCtaText,
                    tier.highlighted && styles.tierCtaTextHighlighted,
                  ]}
                >
                  Empezar — {tier.price}€
                </Text>
              </Pressable>
            </Pressable>
          );
        })}

        <View style={styles.guarantee}>
          <Text style={styles.guaranteeTitle}>🛡️ Garantía "Opción mejor"</Text>
          <Text style={styles.guaranteeBody}>
            Si encuentras un vuelo mejor (mismas fechas + ruta + bagaje) por menos
            precio, devolvemos el doble de la diferencia. Aplica a tiers Standard+.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 40 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  tierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    position: 'relative',
  },
  tierCardHighlighted: { borderColor: Colors.amberBorder },
  tierCardSelected: { borderColor: Colors.amber, borderWidth: 2 },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    backgroundColor: Colors.amber,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: { color: Colors.bg, fontSize: 10, fontWeight: '800' },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  tierName: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  tierPrice: { color: Colors.amber, fontSize: 22, fontWeight: '800' },
  tierSla: { color: Colors.textMuted, fontSize: 12, marginBottom: 12, marginTop: 2 },
  tierFeature: { color: Colors.textSecondary, fontSize: 13, marginVertical: 3 },
  tierCta: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  tierCtaHighlighted: { backgroundColor: Colors.amber },
  tierCtaText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  tierCtaTextHighlighted: { color: Colors.bg },
  guarantee: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginTop: 8,
  },
  guaranteeTitle: { color: Colors.amber, fontSize: 14, fontWeight: '800', marginBottom: 6 },
  guaranteeBody: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
});

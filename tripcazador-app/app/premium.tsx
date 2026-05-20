/**
 * Premium paywall screen — muestra pricing toggle monthly/annual,
 * features, CTA "Probar 14 días gratis" → in-app browser a Stripe Checkout.
 *
 * Mirror del componente PremiumPricingToggle de la web.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { startCheckout } from '@/lib/api';
import { tcTrack } from '@/lib/track';
import { setEmail } from '@/lib/auth';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: '⚡',
    title: 'Alertas en <60s',
    description: 'Recibe los chollos antes que el resto. En vuelos con stock limitado, esos segundos cuentan.',
  },
  {
    icon: '🎯',
    title: 'Filtros pro',
    description: 'Horas de vuelo máx, escalas, día semana, alianza, clase. Sin ruido.',
  },
  {
    icon: '🔒',
    title: 'Secret deals',
    description: 'Chollos exclusivos Premium 24h antes que el resto. Stock limitado.',
  },
  {
    icon: '📊',
    title: 'Histórico + predictor',
    description: 'Ve precio últimos 30 días + predicción "¿es buen momento?".',
  },
  {
    icon: '👀',
    title: 'Watch this deal',
    description: 'Vigila precios concretos y te avisamos si bajan.',
  },
  {
    icon: '🎁',
    title: 'Referidos',
    description: 'Cada amigo que se suscribe = 1 mes gratis para ti. Sin límite.',
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('annual');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubscribe() {
    if (!emailInput.includes('@')) {
      tcTrack('premium_checkout_invalid_email', {});
      return;
    }
    setLoading(true);
    tcTrack('premium_checkout_start', { cycle });
    await setEmail(emailInput);
    const res = await startCheckout({ email: emailInput, cycle });
    setLoading(false);
    if (res.data?.url) {
      void WebBrowser.openBrowserAsync(res.data.url, {
        controlsColor: Colors.amber,
        toolbarColor: Colors.bg,
      });
    } else {
      // TODO: show error toast
      console.warn('Premium checkout failed', res.error);
    }
  }

  const monthlyPrice = 9.99;
  const annualPrice = 99;
  const annualMonthlyEq = (annualPrice / 12).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>TripCazador Premium</Text>
          <Text style={styles.subtitle}>14 días gratis · cancela cuando quieras</Text>
        </View>

        {/* Pricing toggle */}
        <View style={styles.toggleWrap}>
          <Pressable
            onPress={() => setCycle('monthly')}
            style={[styles.toggleBtn, cycle === 'monthly' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, cycle === 'monthly' && styles.toggleTextActive]}>
              Mensual
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCycle('annual')}
            style={[styles.toggleBtn, cycle === 'annual' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, cycle === 'annual' && styles.toggleTextActive]}>
              Anual
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>-17%</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.priceCard}>
          {cycle === 'monthly' ? (
            <>
              <Text style={styles.priceAmount}>9,99€</Text>
              <Text style={styles.pricePer}>/mes · sin permanencia</Text>
            </>
          ) : (
            <>
              <Text style={styles.priceAmount}>99€</Text>
              <Text style={styles.pricePer}>/año · {annualMonthlyEq}€/mes</Text>
              <Text style={styles.priceSavings}>Ahorras 20€ vs mensual</Text>
            </>
          )}
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDescription}>{f.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Email + CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaLabel}>Tu email</Text>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textSubtle}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />
          <Pressable
            onPress={onSubscribe}
            disabled={loading || !emailInput.includes('@')}
            style={({ pressed }) => [
              styles.primaryBtn,
              (loading || !emailInput.includes('@')) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Abriendo Stripe…' : '🚀 Probar 14 días gratis'}
            </Text>
          </Pressable>
          <Text style={styles.smallNote}>
            Sin compromiso. Se te cobra el primer pago al cumplirse el día 14.
          </Text>
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Text style={styles.trustValue}>+24k</Text>
            <Text style={styles.trustLabel}>cazadores</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustValue}>4.7★</Text>
            <Text style={styles.trustLabel}>valoración</Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustValue}>850k€</Text>
            <Text style={styles.trustLabel}>ahorrados</Text>
          </View>
        </View>

        {/* Gift link */}
        <Pressable
          onPress={() => {
            tcTrack('premium_gift_click', {});
            void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/premium/regalo`);
          }}
          style={styles.giftLink}
        >
          <Ionicons name="gift-outline" size={18} color={Colors.amber} />
          <Text style={styles.giftLinkText}>🎁 Regalar Premium a alguien</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18, paddingBottom: 40 },
  header: { marginBottom: 18, alignItems: 'center' },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  subtitle: { color: Colors.amber, fontSize: 14, fontWeight: '600', marginTop: 4 },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: Colors.amber },
  toggleText: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },
  toggleTextActive: { color: Colors.bg },
  savingsBadge: { backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  savingsBadgeText: { color: Colors.bg, fontWeight: '800', fontSize: 10 },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginBottom: 20,
  },
  priceAmount: { color: Colors.amber, fontSize: 48, fontWeight: '800' },
  pricePer: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  priceSavings: { color: Colors.success, fontSize: 13, fontWeight: '600', marginTop: 8 },
  featureList: { marginBottom: 22 },
  featureItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  featureIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  featureBody: { flex: 1 },
  featureTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 },
  featureDescription: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  ctaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  ctaLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.amber,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bg, fontSize: 15, fontWeight: '800' },
  smallNote: { color: Colors.textSubtle, fontSize: 11, textAlign: 'center', marginTop: 10 },
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  trustItem: { alignItems: 'center' },
  trustValue: { color: Colors.amber, fontWeight: '800', fontSize: 18 },
  trustLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  giftLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  giftLinkText: { color: Colors.amber, fontWeight: '700', fontSize: 14 },
});

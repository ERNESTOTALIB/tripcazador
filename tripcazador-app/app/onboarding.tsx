/**
 * Onboarding 3-step + push permission prompt + email signup.
 * Se muestra una sola vez (flag tc_onboarding_done).
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { registerForPushNotifications } from '@/lib/notifications';
import { subscribeNewsletter } from '@/lib/api';
import { setEmail } from '@/lib/auth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { tcTrack } from '@/lib/track';

interface Step {
  emoji: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    emoji: '🎯',
    title: 'Caza-chollos de vuelos',
    body: 'Encontramos errores de precio reales. Tokio a 99€, NYC a 199€, Bali a 369€. No marketing, ofertas verificadas.',
  },
  {
    emoji: '⚡',
    title: 'Alertas en <60s',
    body: 'Con Premium recibes los chollos antes que el resto. En vuelos con stock limitado, esos segundos cuentan.',
  },
  {
    emoji: '🔔',
    title: 'Activa notificaciones',
    body: 'Te avisamos solo cuando hay un chollo de verdad. Sin spam. Sin permanencia.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { complete } = useOnboarding();
  const [step, setStep] = useState(0);
  const [email, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function next() {
    if (step === STEPS.length - 1) {
      // Last step: try register push + save email
      setLoading(true);
      tcTrack('onboarding_complete', { had_email: email.length > 0 });
      if (email.includes('@')) {
        await setEmail(email);
        void subscribeNewsletter({ email, source: 'onboarding', locale: 'es' });
      }
      const result = await registerForPushNotifications();
      if (!result.ok && result.reason === 'denied') {
        Alert.alert(
          'Notificaciones desactivadas',
          'Sin notificaciones recibirás chollos por email solamente. Puedes activarlas más tarde en Ajustes.',
          [{ text: 'Entendido' }],
        );
      }
      await complete();
      setLoading(false);
      router.replace('/');
    } else {
      setStep((s) => s + 1);
      tcTrack('onboarding_step', { step: step + 1 });
    }
  }

  function skip() {
    tcTrack('onboarding_skip', { step });
    void complete().then(() => router.replace('/'));
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Saltar</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {isLast && (
          <View style={styles.emailWrap}>
            <Text style={styles.emailLabel}>
              Tu email (opcional, para chollos por correo):
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmailInput}
              placeholder="tu@email.com"
              placeholderTextColor={Colors.textSubtle}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {/* Dots indicator */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          onPress={next}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryBtn,
            (loading || pressed) && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Activando…' : isLast ? '🚀 Activar notificaciones' : 'Siguiente'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  skipBtn: { alignSelf: 'flex-end', padding: 20 },
  skipText: { color: Colors.textMuted, fontSize: 14 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 340,
  },
  emailWrap: { width: '100%', marginTop: 32, maxWidth: 360 },
  emailLabel: { color: Colors.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
  },
  footer: { padding: 24, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceAlt,
  },
  dotActive: { backgroundColor: Colors.amber, width: 20 },
  primaryBtn: {
    backgroundColor: Colors.amber,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bg, fontSize: 16, fontWeight: '800' },
});

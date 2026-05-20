/**
 * /login — SSS368 (21 may 2026)
 *
 * Magic-link login flow para mobile app.
 *
 * Flow:
 *   1. User entra email → POST /api/mobile/login/request
 *   2. Backend manda email con magic link tripcazador://login?token=xxx
 *   3. Universal/App link abre la app con el token
 *   4. App POST /api/mobile/login/verify → recibe JWT + saved a SecureStore
 *   5. Redirect a /(tabs)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { setEmail } from '@/lib/auth';
import { tcTrack } from '@/lib/track';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onRequest() {
    if (!email.includes('@')) {
      Alert.alert('Email inválido', 'Introduce un email válido');
      return;
    }
    setLoading(true);
    tcTrack('mobile_login_request', { email_domain: email.split('@')[1] || '' });

    try {
      const res = await fetch(`${Config.API_BASE}/api/mobile/login/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, platform: Platform.OS }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        await setEmail(email);
        setSent(true);
        tcTrack('mobile_login_email_sent', {});
      } else {
        Alert.alert('Error', json.error || 'No se pudo enviar el email');
      }
    } catch {
      Alert.alert('Error', 'No hay conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.sentContent}>
          <Text style={styles.icon}>📬</Text>
          <Text style={styles.title}>Email enviado</Text>
          <Text style={styles.body}>
            Te hemos mandado un link mágico a{' '}
            <Text style={styles.email}>{email}</Text>. Ábrelo desde el móvil para
            iniciar sesión automáticamente.
          </Text>
          <Pressable
            onPress={() => setSent(false)}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Usar otro email</Text>
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={styles.linkBtn}
          >
            <Text style={styles.linkBtnText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={28} color={Colors.textMuted} />
          </Pressable>

          <Text style={styles.icon}>🎯</Text>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.body}>
            Recibirás un link mágico al email. Sin contraseñas, sin código SMS.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmailInput}
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textSubtle}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={onRequest}
          />

          <Pressable
            onPress={onRequest}
            disabled={loading || !email.includes('@')}
            style={({ pressed }) => [
              styles.primaryBtn,
              (loading || !email.includes('@')) && { opacity: 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Enviando…' : '✉️ Enviar link mágico'}
            </Text>
          </Pressable>

          <Text style={styles.smallNote}>
            Si eres suscriptor Premium, el link te llevará directamente a tu cuenta.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  sentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backBtn: { position: 'absolute', top: 16, right: 16 },
  icon: { fontSize: 64, marginBottom: 16, textAlign: 'center' },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 340,
  },
  email: { color: Colors.amber, fontWeight: '700' },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: Colors.amber,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bg, fontSize: 16, fontWeight: '800' },
  smallNote: {
    color: Colors.textSubtle,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  secondaryBtn: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.textPrimary, fontWeight: '600' },
  linkBtn: { marginTop: 14, padding: 10 },
  linkBtnText: { color: Colors.textMuted, fontSize: 14 },
});

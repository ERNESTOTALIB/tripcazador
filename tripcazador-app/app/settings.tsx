/**
 * Settings screen — privacy, notifications, analytics, version, links legales.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { getAnalyticsConsent, setAnalyticsConsent } from '@/lib/track';

export default function SettingsScreen() {
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    void (async () => {
      const v = await getAnalyticsConsent();
      setAnalyticsOn(v);
    })();
  }, []);

  async function toggleAnalytics(value: boolean) {
    setAnalyticsOn(value);
    await setAnalyticsConsent(value);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Privacidad</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Analítica anónima</Text>
              <Text style={styles.rowSub}>
                Eventos sin PII para mejorar la app. Puedes desactivar.
              </Text>
            </View>
            <Switch
              value={analyticsOn}
              onValueChange={toggleAnalytics}
              trackColor={{ false: Colors.surfaceAlt, true: Colors.amber }}
              thumbColor={Colors.textPrimary}
            />
          </View>
        </View>

        <Text style={styles.section}>Información</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.row}
            onPress={() => void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/legal`)}
          >
            <Text style={styles.linkLabel}>Aviso legal</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/legal#privacidad`)}
          >
            <Text style={styles.linkLabel}>Política de privacidad</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/prensa`)}
          >
            <Text style={styles.linkLabel}>Prensa</Text>
          </Pressable>
          <Pressable
            style={styles.row}
            onPress={() => void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}/faq`)}
          >
            <Text style={styles.linkLabel}>FAQ</Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>
          TripCazador v{Config.APP_VERSION} (build {Config.BUILD_VERSION}){'\n'}
          © 2026 TripCazador
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 18 },
  section: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  rowSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  linkLabel: { color: Colors.textPrimary, fontSize: 15 },
  versionText: {
    color: Colors.textSubtle,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
  },
});

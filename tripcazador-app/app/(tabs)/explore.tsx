/**
 * Explore — descubre destinos + cuando viajar.
 *
 * Grid de regiones top (Europa, Asia, América, África, Oceanía) +
 * link a /comparar-aerolineas y /cuando-viajar via WebView en futuro.
 * MVP: links a la web tripcazador.com en in-app browser.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';
import { tcTrack } from '@/lib/track';

interface Region {
  emoji: string;
  name: string;
  slug: string;
  fromEur: number;
}

const REGIONS: Region[] = [
  { emoji: '🇪🇸', name: 'Mediterráneo', slug: 'mediterraneo', fromEur: 39 },
  { emoji: '🌴', name: 'Caribe', slug: 'caribe', fromEur: 369 },
  { emoji: '🏯', name: 'Asia', slug: 'asia', fromEur: 399 },
  { emoji: '🗽', name: 'Norteamérica', slug: 'norteamerica', fromEur: 199 },
  { emoji: '🏔️', name: 'Europa Norte', slug: 'europa-norte', fromEur: 59 },
  { emoji: '🐘', name: 'África', slug: 'africa', fromEur: 79 },
  { emoji: '🦘', name: 'Oceanía', slug: 'oceania', fromEur: 899 },
  { emoji: '🏝️', name: 'Islas', slug: 'islas', fromEur: 99 },
];

const QUICK_LINKS = [
  { icon: '📅', label: 'Cuándo viajar', path: '/cuando-viajar' },
  { icon: '⚔️', label: 'Aerolíneas vs.', path: '/comparar-aerolineas' },
  { icon: '🏘️', label: 'Barrios dónde dormir', path: '/comparar-barrios' },
  { icon: '🎯', label: 'Black Friday 2026', path: '/black-friday' },
  { icon: '🎁', label: 'Regalar Premium', path: '/premium/regalo' },
  { icon: '📡', label: 'Equipaje aerolíneas', path: '/equipaje' },
];

export default function ExploreScreen() {
  function openWebLink(path: string, label: string) {
    tcTrack('explore_link_click', { path, label });
    void WebBrowser.openBrowserAsync(`${Config.WEB_BASE}${path}`, {
      controlsColor: Colors.amber,
      toolbarColor: Colors.bg,
    });
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Explorar</Text>
        <Text style={styles.subheading}>Descubre destinos y herramientas</Text>

        {/* Regiones */}
        <Text style={styles.section}>Por región</Text>
        <View style={styles.grid}>
          {REGIONS.map((r) => (
            <Pressable
              key={r.slug}
              onPress={() => openWebLink(`/regiones/${r.slug}`, r.name)}
              style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={styles.tileEmoji}>{r.emoji}</Text>
              <Text style={styles.tileName}>{r.name}</Text>
              <Text style={styles.tilePrice}>desde {r.fromEur}€</Text>
            </Pressable>
          ))}
        </View>

        {/* Quick links */}
        <Text style={styles.section}>Herramientas</Text>
        <View style={styles.linksList}>
          {QUICK_LINKS.map((link) => (
            <Pressable
              key={link.path}
              onPress={() => openWebLink(link.path, link.label)}
              style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 14, paddingBottom: 30 },
  heading: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 12 },
  subheading: { color: Colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 18 },
  section: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  tile: {
    flexBasis: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tileEmoji: { fontSize: 28, marginBottom: 8 },
  tileName: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  tilePrice: { color: Colors.amber, fontSize: 12, marginTop: 4 },
  linksList: { gap: 8 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkIcon: { fontSize: 20 },
  linkLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
});

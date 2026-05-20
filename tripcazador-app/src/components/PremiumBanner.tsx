import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { tcTrack } from '@/lib/track';

interface Props {
  variant?: 'compact' | 'full';
  reason?: 'onboarding' | 'list_cta' | 'detail_cta';
}

export function PremiumBanner({ variant = 'compact', reason = 'list_cta' }: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        tcTrack('premium_banner_click', { reason, variant });
        router.push('/premium');
      }}
      style={({ pressed }) => [
        styles.container,
        variant === 'full' && styles.containerFull,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Probar Premium 14 días gratis"
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>🎯</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>
          {variant === 'full' ? 'TripCazador Premium' : 'Probar Premium'}
        </Text>
        <Text style={styles.subtitle}>
          {variant === 'full'
            ? '14 días gratis · alertas en <60s · cancela cuando quieras'
            : '14 días gratis · alertas instantáneas'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.bg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.amber,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  containerFull: {
    padding: 16,
    borderRadius: 18,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(3, 7, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
  },
  title: {
    color: Colors.bg,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.bg,
    fontSize: 12,
    opacity: 0.78,
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatEur } from '@/lib/format';

interface Props {
  amount: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'amber' | 'success' | 'muted';
}

export function PriceBadge({ amount, label, size = 'medium', variant = 'amber' }: Props) {
  const color =
    variant === 'amber'
      ? Colors.amber
      : variant === 'success'
      ? Colors.success
      : Colors.textPrimary;
  const fontSize = size === 'large' ? 32 : size === 'small' ? 14 : 20;
  return (
    <View style={styles.row}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Text style={[styles.price, { color, fontSize }]}>{formatEur(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  price: {
    fontWeight: '800',
  },
});

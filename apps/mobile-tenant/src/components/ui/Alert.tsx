import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type Tone = 'info' | 'success' | 'warning' | 'error';

interface Props {
  title: string;
  message: string;
  tone?: Tone;
}

export const Alert: React.FC<Props> = ({ title, message, tone = 'info' }) => {
  const { colors, spacing } = useTheme();
  const palette = {
    info: { bg: colors.accentAlt, border: colors.accent },
    success: { bg: '#ECFDF3', border: colors.success },
    warning: { bg: '#FFF7ED', border: colors.warning },
    error: { bg: '#FEF2F2', border: colors.error }
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: palette.bg, borderColor: palette.border, padding: spacing(1.5) }]}
    >
      <Text style={[styles.title, { color: palette.border }]}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1
  },
  title: {
    fontWeight: '700',
    marginBottom: 4
  },
  message: {
    fontSize: 14
  }
});

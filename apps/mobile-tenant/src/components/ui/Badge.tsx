import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

type Tone = 'info' | 'success' | 'warning' | 'error' | 'muted';

interface Props {
  label: string;
  tone?: Tone;
}

export const Badge: React.FC<Props> = ({ label, tone = 'info' }) => {
  const { colors, typography, spacing } = useTheme();
  const palette = {
    info: { bg: colors.accent, text: colors.secondary },
    success: { bg: colors.success, text: '#FFFFFF' },
    warning: { bg: colors.warning, text: '#FFFFFF' },
    error: { bg: colors.error, text: '#FFFFFF' },
    muted: { bg: colors.border, text: colors.text }
  }[tone];

  return (
    <View
      accessibilityRole="text"
      style={[styles.container, { backgroundColor: palette.bg, paddingHorizontal: spacing(1.25) }]}
    >
      <Text style={{ color: palette.text, fontSize: typography.caption.fontSize, fontWeight: '700' }}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  }
});

import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme';

interface Props extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
}

export const TextField: React.FC<Props> = ({ label, hint, error, ...props }) => {
  const { colors, spacing } = useTheme();
  const borderColor = error ? colors.error : colors.border;

  return (
    <View style={{ marginBottom: spacing(1.5) }}>
      <Text style={[styles.label, { color: colors.text }]} accessibilityRole="text" accessibilityLabel={label}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            borderColor,
            color: colors.text,
            backgroundColor: colors.surface
          }
        ]}
        {...props}
      />
      {hint && !error && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  hint: {
    marginTop: 6,
    fontSize: 13
  },
  error: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600'
  }
});

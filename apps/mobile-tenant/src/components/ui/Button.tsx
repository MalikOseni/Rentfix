import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  fullWidth = false,
  style,
  ...pressableProps
}) => {
  const theme = useTheme();
  const { colors, typography } = theme;
  const palette = getPalette(colors, variant, disabled);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? palette.pressed : palette.background, borderColor: palette.border },
        fullWidth && styles.fullWidth,
        style as ViewStyle
      ]}
      android_ripple={{ color: palette.ripple }}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text
          style={{
            color: palette.text,
            fontWeight: typography.h3.fontWeight,
            fontSize: typography.body.fontSize
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const getPalette = (colors: ReturnType<typeof useTheme>['colors'], variant: ButtonVariant, disabled?: boolean) => {
  if (disabled) {
    return {
      background: colors.border,
      border: colors.border,
      text: colors.textMuted,
      ripple: colors.textMuted,
      pressed: colors.border
    };
  }

  switch (variant) {
    case 'secondary':
      return {
        background: colors.surface,
        border: colors.border,
        text: colors.primary,
        ripple: colors.border,
        pressed: colors.background
      };
    case 'ghost':
      return {
        background: 'transparent',
        border: 'transparent',
        text: colors.primary,
        ripple: colors.border,
        pressed: colors.border
      };
    default:
      return {
        background: colors.primary,
        border: colors.primaryAlt,
        text: '#FFFFFF',
        ripple: colors.primaryAlt,
        pressed: colors.primaryAlt
      };
  }
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48
  },
  fullWidth: {
    alignSelf: 'stretch'
  }
});

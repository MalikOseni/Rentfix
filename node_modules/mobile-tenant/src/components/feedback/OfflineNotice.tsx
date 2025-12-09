import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';

interface Props {
  onRetry?: () => void;
}

export const OfflineNotice: React.FC<Props> = ({ onRetry }) => {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.warning, padding: spacing(1.5) }]}
      accessibilityRole="status"
      accessibilityLabel="Offline banner"
    >
      <Text style={[styles.text, { color: '#FFFFFF' }]}>You are offline. Actions will sync automatically.</Text>
      {onRetry && <Button variant="ghost" label="Retry" onPress={onRetry} accessibilityLabel="Retry syncing" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  text: {
    fontWeight: '600'
  }
});

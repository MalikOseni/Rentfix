import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { OfflineNotice } from '../components/feedback/OfflineNotice';
import { useTheme } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useOfflineQueue } from '../state/offlineQueue';

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();
  const isOnline = useOnlineStatus();
  const { items } = useOfflineQueue();

  return (
    <Screen>
      {!isOnline && <OfflineNotice />}
      {items.length > 0 && (
        <Card style={{ marginBottom: spacing(1.5), borderColor: colors.warning }}>
          <Text style={{ color: colors.warning, fontWeight: '700' }}>Pending sync</Text>
          <Text style={{ color: colors.text }}>You have {items.length} report(s) queued. We will send them once you are online.</Text>
        </Card>
      )}

      <Text style={{ ...typography.h1, color: colors.text }} accessibilityRole="header">
        Welcome back
      </Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing(2) }}>
        Report maintenance issues, upload evidence, and track progress in real time.
      </Text>

      <Card style={{ marginBottom: spacing(2) }}>
        <Text style={{ ...typography.h3, color: colors.text }}>Quick actions</Text>
        <View style={{ marginTop: spacing(1.5) }}>
          <Button
            label="Report an issue"
            onPress={() => navigation.navigate('ReportIssue')}
            accessibilityHint="Start the guided flow to report a maintenance issue"
            fullWidth
          />
          <View style={{ marginTop: spacing(1) }}>
            <Button
              label="Track existing ticket"
              variant="secondary"
              onPress={() => navigation.navigate('TrackingTimeline')}
              accessibilityHint="View progress for your submitted tickets"
              fullWidth
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
};

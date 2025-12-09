import React from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../components/layout/Screen';
import { Timeline } from '../components/timeline/Timeline';
import { Button } from '../components/ui/Button';
import { RootStackParamList } from '../navigation/types';
import { getTimeline } from '../api/issues';
import { useTheme } from '../theme';

export type TrackingTimelineScreenProps = NativeStackScreenProps<RootStackParamList, 'TrackingTimeline'>;

export const TrackingTimelineScreen: React.FC<TrackingTimelineScreenProps> = ({ navigation, route }) => {
  const ticketId = route.params?.ticketId ?? 'demo-ticket';
  const { colors, typography, spacing } = useTheme();

  const timelineQuery = useQuery({
    queryKey: ['timeline', ticketId],
    queryFn: () => getTimeline(ticketId),
    initialData: {
      events: [
        {
          id: '1',
          title: 'Ticket created',
          status: 'new',
          note: 'We logged your issue and notified your agent.',
          timestamp: 'Today 9:02 AM'
        },
        {
          id: '2',
          title: 'Triaged',
          status: 'triaged',
          note: 'AI classified issue as plumbing (routine).',
          timestamp: 'Today 9:05 AM'
        },
        {
          id: '3',
          title: 'Assigned to contractor',
          status: 'assigned',
          note: 'SwiftFix Plumbing scheduled for tomorrow 10:00 AM.',
          timestamp: 'Today 10:12 AM'
        }
      ]
    }
  });

  return (
    <Screen scrollable>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...typography.h2, color: colors.text }}>Ticket timeline</Text>
        <Button label="Report new" variant="secondary" onPress={() => navigation.navigate('ReportIssue')} />
      </View>
      <Text style={{ color: colors.textMuted, marginTop: 4, marginBottom: spacing(1.5) }}>
        Ticket ID: {ticketId}. Status updates include SLA clocks and AI recommendations.
      </Text>

      <Timeline items={timelineQuery.data.events.map((event) => ({
        ...event,
        status: (event.status as any) || 'new'
      }))} />
    </Screen>
  );
};

import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../theme';

export type TimelineItem = {
  id: string;
  title: string;
  timestamp: string;
  status: 'new' | 'triaged' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  note?: string;
};

interface Props {
  items: TimelineItem[];
}

export const Timeline: React.FC<Props> = ({ items }) => {
  const { colors, spacing, typography } = useTheme();

  const renderItem = ({ item }: { item: TimelineItem }) => (
    <View style={{ flexDirection: 'row', marginBottom: spacing(1.5) }}>
      <View style={{ width: 12, alignItems: 'center' }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
            marginTop: 6
          }}
        />
        <View style={{ flex: 1, width: 2, backgroundColor: colors.border }} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing(1.5) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: typography.body.fontSize, color: colors.text }}>{item.title}</Text>
          <View style={{ marginLeft: spacing(0.75) }}>
            <Badge label={formatStatus(item.status)} tone={statusTone(item.status)} />
          </View>
        </View>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>{item.timestamp}</Text>
        {item.note && <Text style={{ color: colors.text, marginTop: 6 }}>{item.note}</Text>}
      </View>
    </View>
  );

  return (
    <FlatList
      accessibilityRole="list"
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
    />
  );
};

const statusTone = (status: TimelineItem['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'assigned':
    case 'in_progress':
      return 'info';
    default:
      return 'muted';
  }
};

const formatStatus = (status: TimelineItem['status']) =>
  status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

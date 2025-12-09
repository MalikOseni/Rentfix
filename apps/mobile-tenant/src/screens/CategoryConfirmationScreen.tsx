import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RootStackParamList } from '../navigation/types';
import { useIssueStore } from '../state/issueStore';
import { useTheme } from '../theme';

const categories = ['Plumbing', 'Electrical', 'Heating', 'Appliance', 'Pest control'];

export type CategoryConfirmationScreenProps = NativeStackScreenProps<RootStackParamList, 'CategoryConfirmation'>;

export const CategoryConfirmationScreen: React.FC<CategoryConfirmationScreenProps> = ({ navigation }) => {
  const { draft, setField } = useIssueStore();
  const { colors, typography, spacing } = useTheme();

  return (
    <Screen scrollable>
      <Text style={{ ...typography.h2, color: colors.text, marginBottom: spacing(1) }}>Confirm category</Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing(1.5) }}>
        We used AI to suggest a category. You can keep it or pick another option.
      </Text>

      {draft.aiCategory && (
        <Card style={{ marginBottom: spacing(1.5) }}>
          <Text style={{ fontWeight: '700', marginBottom: spacing(0.5), color: colors.text }}>Suggested</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Badge label={draft.aiCategory} tone="info" />
            {draft.aiUrgency && (
              <View style={{ marginLeft: spacing(0.75) }}>
                <Badge label={draft.aiUrgency} tone={draft.aiUrgency === 'emergency' ? 'warning' : 'muted'} />
              </View>
            )}
          </View>
        </Card>
      )}

      <Text style={{ fontWeight: '600', color: colors.text, marginBottom: spacing(1) }}>Pick a category</Text>
      <View>
        {categories.map((category, index) => (
          <Card
            key={category}
            style={{
              borderColor: draft.category === category ? colors.primary : colors.border,
              marginBottom: index === categories.length - 1 ? 0 : spacing(1)
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{category}</Text>
              <Button
                label={draft.category === category ? 'Selected' : 'Choose'}
                variant={draft.category === category ? 'secondary' : 'ghost'}
                accessibilityLabel={`Select ${category}`}
                onPress={() => setField('category', category)}
              />
            </View>
          </Card>
        ))}
      </View>

      <View style={{ flexDirection: 'row', marginTop: spacing(2) }}>
        <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
        <View style={{ marginLeft: spacing(1) }}>
          <Button label="Continue" onPress={() => navigation.navigate('ReportIssue')} />
        </View>
      </View>
    </Screen>
  );
};

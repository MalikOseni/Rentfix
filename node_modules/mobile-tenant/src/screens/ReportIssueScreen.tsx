import React, { useState } from 'react';
import { View, Text, Switch, Alert as RNAlert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import { TextField } from '../components/ui/TextField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { RootStackParamList } from '../navigation/types';
import { useIssueStore } from '../state/issueStore';
import { useIssueSubmission } from '../hooks/useIssueSubmission';
import { useTheme } from '../theme';

export type ReportIssueScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportIssue'>;

type FormErrors = Partial<Record<'description' | 'category' | 'address', string>>;

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ navigation }) => {
  const { draft, setField } = useIssueStore();
  const { submit, isSubmitting } = useIssueSubmission();
  const [errors, setErrors] = useState<FormErrors>({});
  const { colors, typography, spacing } = useTheme();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!draft.description) newErrors.description = 'Describe the issue to help the contractor prepare.';
    if (!draft.category) newErrors.category = 'Select a category so we route this correctly.';
    if (!draft.address) newErrors.address = 'Address is required for dispatching help.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await submit();
    if (result.queued) {
      RNAlert.alert('Saved offline', 'We will submit this ticket when connectivity returns.');
      navigation.navigate('Home');
      return;
    }
    navigation.navigate('TrackingTimeline', { ticketId: result.ticketId });
  };

  return (
    <Screen scrollable>
      <Text style={{ ...typography.h2, color: colors.text }} accessibilityRole="header">
        Report an issue
      </Text>
      <Text style={{ color: colors.textMuted, marginBottom: spacing(2) }}>
        Capture details so we can classify the issue and dispatch the right contractor.
      </Text>

      {draft.aiCategory && (
        <Alert
          title="AI suggestion"
          message={`We think this is a ${draft.aiCategory} issue${draft.aiUrgency ? ` with ${draft.aiUrgency} urgency` : ''}. You can override below.`}
          tone="info"
        />
      )}

      <TextField
        label="Issue description"
        placeholder="e.g. Leaking tap in the kitchen"
        multiline
        numberOfLines={3}
        value={draft.description}
        onChangeText={(text) => setField('description', text)}
        error={errors.description}
      />

      <TextField
        label="Category"
        placeholder="Plumbing, Electrical, Heating..."
        value={draft.category}
        onChangeText={(text) => setField('category', text)}
        hint="You can override the AI suggestion if needed."
        error={errors.category}
      />

      <TextField
        label="Property address"
        placeholder="123 Main Street, Unit 4"
        value={draft.address}
        onChangeText={(text) => setField('address', text)}
        error={errors.address}
      />

      <TextField
        label="Access instructions"
        placeholder="Doormen name, lockbox code, pet info"
        value={draft.accessNotes}
        onChangeText={(text) => setField('accessNotes', text)}
        hint="We share this with the contractor to minimise reschedules."
      />

      <Card style={{ marginBottom: spacing(1.5) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '600', color: colors.text }}>Is this an emergency?</Text>
          <Switch
            accessibilityLabel="Emergency toggle"
            value={draft.emergency}
            onValueChange={(value) => setField('emergency', value)}
            thumbColor={draft.emergency ? colors.primary : colors.border}
          />
        </View>
        <Text style={{ color: colors.textMuted, marginTop: spacing(1) }}>
          Emergency issues dispatch immediately and notify your agent.
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', marginTop: spacing(1) }}>
        <Button
          label="Add photos"
          variant="secondary"
          onPress={() => navigation.navigate('PhotoCapture')}
          accessibilityHint="Open camera or gallery to add evidence"
        />
        <View style={{ marginLeft: spacing(1) }}>
          <Button label="Submit" onPress={handleSubmit} loading={isSubmitting} accessibilityHint="Submit issue" />
        </View>
      </View>
    </Screen>
  );
};

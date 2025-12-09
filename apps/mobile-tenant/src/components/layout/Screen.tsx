import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
}

export const Screen: React.FC<Props> = ({ children, scrollable = false }) => {
  const { colors } = useTheme();
  const content = scrollable ? <ScrollView contentContainerStyle={{ padding: 16 }}>{children}</ScrollView> : children;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.background === '#0B1220' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        accessible
        accessibilityLiveRegion="polite"
      >
        <View style={{ flex: 1, padding: 16 }}>{content}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

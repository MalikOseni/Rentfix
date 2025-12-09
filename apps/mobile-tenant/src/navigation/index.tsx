import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportIssueScreen } from '../screens/ReportIssueScreen';
import { PhotoCaptureScreen } from '../screens/PhotoCaptureScreen';
import { CategoryConfirmationScreen } from '../screens/CategoryConfirmationScreen';
import { TrackingTimelineScreen } from '../screens/TrackingTimelineScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ title: 'Report Issue' }} />
        <Stack.Screen name="PhotoCapture" component={PhotoCaptureScreen} options={{ title: 'Add Photos' }} />
        <Stack.Screen
          name="CategoryConfirmation"
          component={CategoryConfirmationScreen}
          options={{ title: 'Confirm Category' }}
        />
        <Stack.Screen
          name="TrackingTimeline"
          component={TrackingTimelineScreen}
          options={{ title: 'Track Progress' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

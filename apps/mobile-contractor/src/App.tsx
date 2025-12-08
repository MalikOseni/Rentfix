import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#022c22' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ padding: 24 }}>
        <Text style={{ color: '#f0fdf4', fontSize: 20, fontWeight: '600' }}>Rentfix Contractor</Text>
        <Text style={{ color: '#bbf7d0', marginTop: 8 }}>
          Work offline, sync tasks, and confirm appointments with real-time updates when online.
        </Text>
      </View>
    </SafeAreaView>
  );
}

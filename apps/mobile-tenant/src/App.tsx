import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" />
      <View style={{ padding: 24 }}>
        <Text style={{ color: '#f8fafc', fontSize: 20, fontWeight: '600' }}>Rentfix Tenant</Text>
        <Text style={{ color: '#e2e8f0', marginTop: 8 }}>
          Capture issues, upload evidence, and stay updated on progress even while offline.
        </Text>
      </View>
    </SafeAreaView>
  );
}

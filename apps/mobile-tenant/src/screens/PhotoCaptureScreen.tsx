import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Alert as RNAlert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, CameraType, useCameraPermissions } from 'expo-camera';
import { Button } from '../components/ui/Button';
import { Screen } from '../components/layout/Screen';
import { useIssueStore } from '../state/issueStore';
import { useTheme } from '../theme';
import { RootStackParamList } from '../navigation/types';

export type PhotoCaptureScreenProps = NativeStackScreenProps<RootStackParamList, 'PhotoCapture'>;

export const PhotoCaptureScreen: React.FC<PhotoCaptureScreenProps> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const { draft, addPhoto } = useIssueStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [isCapturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const takePhoto = async () => {
    if (!permission?.granted) {
      RNAlert.alert('Camera permission', 'Please enable camera access to capture evidence.');
      return;
    }
    if (!cameraRef.current) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      addPhoto(photo.uri);
    } catch (error) {
      RNAlert.alert('Capture failed', (error as Error).message);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <Screen>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: spacing(1), color: colors.text }}>
        Capture or upload photos
      </Text>
      {permission?.granted ? (
        <Camera
          ref={(ref) => (cameraRef.current = ref)}
          style={{ height: 260, borderRadius: 16, overflow: 'hidden', marginBottom: spacing(1.5) }}
          type={CameraType.back}
          ratio="16:9"
          accessibilityLabel="Camera preview"
        />
      ) : (
        <Button label="Enable camera" onPress={requestPermission} />
      )}

      <View style={{ flexDirection: 'row' }}>
        <Button label="Take photo" onPress={takePhoto} loading={isCapturing} />
        <View style={{ marginLeft: spacing(1) }}>
          <Button label="Done" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </View>

      <Text style={{ marginTop: spacing(2), fontWeight: '600', color: colors.text }}>Preview</Text>
      <ScrollView horizontal contentContainerStyle={{ marginTop: spacing(1) }}>
        {draft.photos.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            accessibilityLabel="Captured photo preview"
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              marginRight: spacing(1)
            }}
          />
        ))}
      </ScrollView>
    </Screen>
  );
};

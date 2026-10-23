import * as ImagePicker from 'expo-image-picker';

export type PickSource = 'camera' | 'library';

export type PickResult =
  | { status: 'picked'; uri: string }
  | { status: 'cancelled' }
  | { status: 'denied' };

/** Takes a photo or picks one from the gallery for a verification document.
 * Selfies open the front camera. The gallery needs no permission prompt on
 * current iOS and Android (it uses the system picker). */
export async function pickDocumentImage(source: PickSource, options?: { front?: boolean }): Promise<PickResult> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      cameraType: options?.front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });
    if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
    return { status: 'picked', uri: result.assets[0].uri };
  }

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled || !result.assets[0]) return { status: 'cancelled' };
  return { status: 'picked', uri: result.assets[0].uri };
}

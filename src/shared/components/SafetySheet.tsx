import * as Linking from 'expo-linking';
import { LifeBuoy, MapPin, Phone } from 'lucide-react-native';
import { View } from 'react-native';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { Button } from '@/src/ui/Button';
import { Sheet } from '@/src/ui/Sheet';

interface SafetySheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * "Are you in danger?" sheet — reachable from the one-tap Safety button on
 * the active-delivery screen at every stage. Calling emergency services is
 * the one filled, full-size action; the rest are secondary. Share location
 * and Contact support are still mock (no telephony or backend to call out
 * to) and simply close the sheet, as before.
 */
export function SafetySheet({ visible, onClose }: SafetySheetProps) {
  const { t } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title="Are you in danger?">
      <View style={{ gap: 12, paddingTop: 4 }}>
        <Txt variant="body" tone="secondary">
          Choose what you need. If you're in immediate danger, call emergency services first.
        </Txt>
        <Button
          title="Call emergency services"
          variant="destructive"
          size="lg"
          fullWidth
          icon={<Phone size={20} color={t.onAlert} />}
          onPress={() => {
            Linking.openURL('tel:191').catch(() => {});
            onClose();
          }}
        />
        <Button
          title="Share my location"
          variant="secondary"
          fullWidth
          icon={<MapPin size={18} color={t.ink} />}
          onPress={onClose}
        />
        <Button
          title="Contact Fastermall support"
          variant="secondary"
          fullWidth
          icon={<LifeBuoy size={18} color={t.ink} />}
          onPress={onClose}
        />
        <Button title="Cancel" variant="quiet" fullWidth onPress={onClose} />
      </View>
    </Sheet>
  );
}

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  Camera,
  CreditCard,
  FileText,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/src/shared/components/AnimatedPressable';
import { BackButton } from '@/src/shared/components/BackButton';
import { Button } from '@/src/shared/components/Button';
import { GlassView } from '@/src/shared/components/GlassView';
import { IconCircle } from '@/src/shared/components/IconCircle';
import { PhotoSourceSheet } from '@/src/shared/components/PhotoSourceSheet';
import { StatusChip } from '@/src/shared/components/StatusChip';
import { useResolvedTheme } from '@/src/shared/hooks/useResolvedTheme';
import { useToast } from '@/src/shared/toast/ToastProvider';
import { haptics } from '@/src/shared/utils/haptics';
import { selectVerificationSummary, useDocumentsStore } from '@/src/stores/documentsStore';
import { colors } from '@/src/theme';
import type { DocumentStatus, DocumentType, PartnerDocument } from '@/src/types/document';
import { daysUntil, formatDate } from '@/src/utils/date';

const TYPE_ICON: Record<DocumentType, typeof CreditCard> = {
  GHANA_CARD: CreditCard,
  DRIVERS_LICENCE: FileText,
  VEHICLE_REGISTRATION: Car,
  SELFIE: Camera,
};

// Status chips read entirely from `color` now (StatusChip derives its own
// border/dot tint from the one hex value) — no separate hardcoded tint per
// status to drift out of sync with the semantic color tokens.
const STATUS_META: Record<DocumentStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  VERIFIED: { label: 'Verified', icon: CheckCircle2, color: colors.semantic.success },
  EXPIRING_SOON: { label: 'Expiring soon', icon: AlertTriangle, color: colors.semantic.warning },
  EXPIRED: { label: 'Expired', icon: XCircle, color: colors.semantic.error },
  REJECTED: { label: 'Rejected', icon: XCircle, color: colors.semantic.error },
  PENDING: { label: 'Under review', icon: Clock, color: colors.semantic.info },
  NOT_UPLOADED: { label: 'Not uploaded', icon: Clock, color: colors.neutral[500] },
};

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();
  const theme = isDark ? colors.dark : colors.light;
  const documents = useDocumentsStore((s) => s.documents);
  const summary = selectVerificationSummary(documents);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 48, gap: 16 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackButton />
        <Text className="text-h1 font-bold" style={{ color: theme.text }}>Documents</Text>
      </View>

      <StatusBanner summary={summary} theme={theme} />

      <View style={{ gap: 12 }}>
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} theme={theme} />
        ))}
      </View>

      <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 8 }}>
        Keeping every document current lets you stay online without interruption. We'll remind you before
        anything expires.
      </Text>
    </ScrollView>
  );
}

function StatusBanner({
  summary,
  theme,
}: {
  summary: ReturnType<typeof selectVerificationSummary>;
  theme: { text: string; textSecondary: string };
}) {
  if (summary.isBlocked) {
    return (
      <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <XCircle size={22} color={colors.semantic.error} />
        <View style={{ flex: 1 }}>
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.error }}>
            Action needed
          </Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            {summary.blockingCount === 1
              ? 'One document has expired or was rejected. Renew it to keep receiving jobs.'
              : `${summary.blockingCount} documents have expired or were rejected. Renew them to keep receiving jobs.`}
          </Text>
        </View>
      </GlassView>
    );
  }

  if (summary.attentionCount > 0) {
    return (
      <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AlertTriangle size={22} color={colors.semantic.warning} />
        <View style={{ flex: 1 }}>
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.warning }}>
            Expiring soon
          </Text>
          <Text className="text-caption" style={{ color: theme.textSecondary }}>
            {summary.attentionCount === 1
              ? 'One document expires soon. Renew it early to avoid any gap in going online.'
              : `${summary.attentionCount} documents expire soon. Renew them early to avoid any gap in going online.`}
          </Text>
        </View>
      </GlassView>
    );
  }

  return (
    <GlassView radius="card" style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ShieldCheck size={22} color={colors.semantic.success} />
      <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.success }}>
        Your account is verified
      </Text>
    </GlassView>
  );
}

function DocumentCard({
  document,
  theme,
}: {
  document: PartnerDocument;
  theme: { text: string; textSecondary: string; border: string; surface: string };
}) {
  const reupload = useDocumentsStore((s) => s.reuploadDocument);
  const { show } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const Icon = TYPE_ICON[document.type];
  const meta = STATUS_META[document.status];
  const StatusIcon = meta.icon;
  const needsAction = document.status === 'EXPIRED' || document.status === 'REJECTED' || document.status === 'NOT_UPLOADED';
  const isPending = document.status === 'PENDING';

  const expiryText = (() => {
    if (!document.expiresAt) return null;
    if (document.status === 'EXPIRED') return `Expired ${formatDate(document.expiresAt)}`;
    if (document.status === 'EXPIRING_SOON') return `Expires in ${daysUntil(document.expiresAt)} days`;
    return `Expires ${formatDate(document.expiresAt)}`;
  })();

  return (
    <GlassView radius="card" style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {document.fileUri ? (
          <Image
            source={{ uri: document.fileUri }}
            accessibilityLabel={`Photo you uploaded for ${document.label}`}
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.border }}
          />
        ) : (
          <IconCircle tint={colors.partner.orange} size={44}>
            <Icon size={20} color={colors.partner.orange} />
          </IconCircle>
        )}
        <View style={{ flex: 1 }}>
          <Text className="text-body-lg font-semibold" style={{ color: theme.text }}>{document.label}</Text>
          {expiryText && (
            <Text className="text-caption" style={{ color: theme.textSecondary }}>{expiryText}</Text>
          )}
        </View>
      </View>

      <StatusChip label={meta.label} tone={meta.color} icon={<StatusIcon size={12} color={meta.color} />} />

      {document.status === 'REJECTED' && document.rejectionReason ? (
        <Text className="text-caption" style={{ color: theme.textSecondary }}>
          Reason: {document.rejectionReason}
        </Text>
      ) : null}

      {needsAction && (
        <Button
          title={document.status === 'NOT_UPLOADED' ? 'Upload document' : 'Renew document'}
          variant="partner"
          size="sm"
          onPress={() => setSheetOpen(true)}
        />
      )}
      {document.status === 'EXPIRING_SOON' && (
        <AnimatedPressable onPress={() => setSheetOpen(true)} scaleTo={0.98}>
          <Text className="text-caption font-semibold" style={{ color: colors.partner.orange, textAlign: 'center' }}>
            Renew early
          </Text>
        </AnimatedPressable>
      )}
      {isPending && (
        <Text className="text-caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>
          We're reviewing your document — usually within 24–48 hours.
        </Text>
      )}

      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={document.label}
        front={document.type === 'SELFIE'}
        guidance={
          document.type === 'SELFIE'
            ? 'Take a clear photo of your face in good light, with no hat or sunglasses.'
            : 'Place the document flat in good light, with all four corners and every word readable.'
        }
        onPicked={(uri) => {
          reupload(document.id, uri);
          haptics.success();
          show('Sent for review', 'success');
        }}
      />
    </GlassView>
  );
}

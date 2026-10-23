import { Car, Camera, CircleAlert, CircleCheck, Clock, CreditCard, FileText, TriangleAlert } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/src/ds/Txt';
import { useTheme } from '@/src/ds/useTheme';
import { selectVerificationSummary, useDocumentsStore } from '@/src/stores/documentsStore';
import type { DocumentStatus, DocumentType, PartnerDocument } from '@/src/types/document';
import { daysUntil, formatDate } from '@/src/utils/date';
import { Button } from '@/src/ui/Button';
import { Notice } from '@/src/ui/Notice';
import { Panel } from '@/src/ui/Panel';
import { ScreenHeader } from '@/src/ui/ScreenHeader';
import { Tag } from '@/src/ui/Tag';

const TYPE_ICON: Record<DocumentType, typeof CreditCard> = {
  GHANA_CARD: CreditCard,
  DRIVERS_LICENCE: FileText,
  VEHICLE_REGISTRATION: Car,
  SELFIE: Camera,
};

type StatusTone = 'go' | 'warn' | 'alert' | 'info' | 'neutral';

const STATUS_META: Record<DocumentStatus, { label: string; icon: typeof CircleCheck; tone: StatusTone }> = {
  VERIFIED: { label: 'Verified', icon: CircleCheck, tone: 'go' },
  EXPIRING_SOON: { label: 'Expiring soon', icon: TriangleAlert, tone: 'warn' },
  EXPIRED: { label: 'Expired', icon: CircleAlert, tone: 'alert' },
  REJECTED: { label: 'Rejected', icon: CircleAlert, tone: 'alert' },
  PENDING: { label: 'Under review', icon: Clock, tone: 'info' },
  NOT_UPLOADED: { label: 'Not uploaded', icon: Clock, tone: 'neutral' },
};

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTheme();
  const documents = useDocumentsStore((s) => s.documents);
  const summary = selectVerificationSummary(documents);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScreenHeader title="Documents" back />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <StatusBanner summary={summary} />

        <View style={{ gap: 12 }}>
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </View>

        <Txt variant="caption" tone="secondary" style={{ textAlign: 'center', paddingHorizontal: 8 }}>
          Keeping every document current lets you stay online without interruption. We'll remind you before anything
          expires.
        </Txt>
      </ScrollView>
    </View>
  );
}

function StatusBanner({ summary }: { summary: ReturnType<typeof selectVerificationSummary> }) {
  if (summary.isBlocked) {
    return (
      <Notice
        tone="alert"
        title="Action needed"
        message={
          summary.blockingCount === 1
            ? 'One document has expired or was rejected. Renew it to keep receiving jobs.'
            : `${summary.blockingCount} documents have expired or were rejected. Renew them to keep receiving jobs.`
        }
      />
    );
  }

  if (summary.attentionCount > 0) {
    return (
      <Notice
        tone="warn"
        title="Expiring soon"
        message={
          summary.attentionCount === 1
            ? 'One document expires soon. Renew it early to avoid any gap in going online.'
            : `${summary.attentionCount} documents expire soon. Renew them early to avoid any gap in going online.`
        }
      />
    );
  }

  return <Notice tone="go" title="Your account is verified" />;
}

function DocumentCard({ document }: { document: PartnerDocument }) {
  const { t } = useTheme();
  const reupload = useDocumentsStore((s) => s.reuploadDocument);
  const Icon = TYPE_ICON[document.type];
  const meta = STATUS_META[document.status];
  const StatusIcon = meta.icon;
  const needsAction = document.status === 'EXPIRED' || document.status === 'REJECTED' || document.status === 'NOT_UPLOADED';
  const isPending = document.status === 'PENDING';

  const toneInk = {
    go: t.goInk,
    warn: t.warnInk,
    alert: t.alertInk,
    info: t.infoInk,
    neutral: t.inkSecondary,
  }[meta.tone];

  const expiryText = (() => {
    if (!document.expiresAt) return null;
    if (document.status === 'EXPIRED') return `Expired ${formatDate(document.expiresAt)}`;
    if (document.status === 'EXPIRING_SOON') return `Expires in ${daysUntil(document.expiresAt)} days`;
    return `Expires ${formatDate(document.expiresAt)}`;
  })();

  return (
    <Panel style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon size={22} color={t.inkSecondary} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{document.label}</Txt>
          {expiryText && (
            <Txt variant="caption" tone="secondary">
              {expiryText}
            </Txt>
          )}
        </View>
        <Tag label={meta.label} tone={meta.tone} icon={<StatusIcon size={12} color={toneInk} />} />
      </View>

      {document.status === 'REJECTED' && document.rejectionReason ? (
        <Txt variant="caption" tone="secondary">
          Reason: {document.rejectionReason}
        </Txt>
      ) : null}

      {needsAction && (
        <Button
          title={document.status === 'NOT_UPLOADED' ? 'Upload document' : 'Renew document'}
          fullWidth
          onPress={() => reupload(document.id)}
        />
      )}
      {document.status === 'EXPIRING_SOON' && (
        <Button title="Renew early" variant="secondary" fullWidth onPress={() => reupload(document.id)} />
      )}
      {isPending && (
        <Txt variant="caption" tone="secondary">
          We're reviewing your document, usually within 24–48 hours.
        </Txt>
      )}
    </Panel>
  );
}

export type NotificationType = 'JOB' | 'PAYMENT' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** Where tapping this alert goes. Defaults by type: jobs and payments open their tab. */
  href?: string;
}

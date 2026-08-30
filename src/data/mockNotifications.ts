import type { AppNotification } from '@/src/types/notification';

export const initialNotifications: AppNotification[] = [
  {
    id: 'ntf-1',
    type: 'JOB',
    title: 'New job near you',
    body: 'A Food delivery from Vic Baboo\u2019s Cafe just opened up 2.6 km away.',
    createdAt: hoursAgo(1),
    read: false,
  },
  {
    id: 'ntf-2',
    type: 'PAYMENT',
    title: 'Reimbursement received',
    body: 'GH\u20b5 24.00 was credited to your wallet for your last Food order.',
    createdAt: hoursAgo(20),
    read: false,
  },
  {
    id: 'ntf-3',
    type: 'SYSTEM',
    title: 'Welcome to Fastermall Partner',
    body: 'Go online from the Home tab whenever you\u2019re ready to start receiving jobs.',
    createdAt: hoursAgo(48),
    read: true,
  },
];

function hoursAgo(n: number) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

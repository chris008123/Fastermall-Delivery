import type { SupportTopic } from '@/src/types/support';

export const supportTopics: SupportTopic[] = [
  {
    id: 'PAYMENT',
    label: 'Payment & earnings',
    description: 'Payouts, cash out, and how a delivery fee is calculated.',
    faqs: [
      {
        id: 'pay-1',
        question: 'When do I get paid?',
        answer:
          "Earnings settle to your wallet as soon as a delivery is marked complete. Your scheduled payout goes out weekly, or you can cash out early once your balance crosses the threshold shown on the Wallet tab.",
      },
      {
        id: 'pay-2',
        question: 'Why was my delivery fee lower than expected?',
        answer:
          'Fees are made up of a base fare plus distance and time components, with bonuses added when they apply. Tap any transaction in Wallet to see the exact breakdown.',
      },
      {
        id: 'pay-3',
        question: "I paid a vendor out of pocket — when do I get that back?",
        answer:
          "Vendor reimbursements post to your wallet the moment the delivery is marked complete (or, if the delivery can't be completed, as soon as it's marked failed) — you're never left covering that cost.",
      },
    ],
  },
  {
    id: 'DELIVERY',
    label: 'Delivery problems',
    description: "Customer unreachable, wrong address, and other in-progress issues.",
    faqs: [
      {
        id: 'del-1',
        question: "The customer isn't answering — what do I do?",
        answer:
          "From the active delivery screen, tap \"Can't complete this delivery?\" and choose \"Customer isn't answering.\" We'll walk you through contacting them and, if needed, contacting support.",
      },
      {
        id: 'del-2',
        question: 'I feel unsafe during a delivery',
        answer:
          'Tap the Safety button on the active delivery screen at any time. It gives you one-tap access to emergency services, sharing your location, and Fastermall support.',
      },
      {
        id: 'del-3',
        question: 'The address is wrong or incomplete',
        answer:
          "Try reaching the customer first from the active delivery screen. If you still can't resolve it, mark the delivery as failed with \"Wrong address\" so support can follow up.",
      },
    ],
  },
  {
    id: 'ACCOUNT',
    label: 'Account & verification',
    description: 'Documents, expiry dates, and getting approved to go online.',
    faqs: [
      {
        id: 'acc-1',
        question: 'Why can\u2019t I go online?',
        answer:
          'This usually means a document has expired or was rejected. Check Documents in your Profile — anything blocking you will be flagged there with a Renew option.',
      },
      {
        id: 'acc-2',
        question: 'How long does document review take?',
        answer: 'Most uploads are reviewed within 24–48 hours. You can check status anytime from Documents.',
      },
      {
        id: 'acc-3',
        question: 'How do I update my vehicle details?',
        answer: 'Go to Profile and change your travel mode, or reach out to support if you need to update your registered plate number.',
      },
    ],
  },
  {
    id: 'APP',
    label: 'App problems',
    description: "Map not loading, notifications, or the app acting up.",
    faqs: [
      {
        id: 'app-1',
        question: 'The map on my active delivery isn\u2019t loading',
        answer: 'Try toggling Wi-Fi/mobile data off and back on. If it persists, restart the app — your job progress is saved and won\u2019t be lost.',
      },
      {
        id: 'app-2',
        question: "I'm not getting job notifications",
        answer: 'Check Settings → Notifications to make sure Job notifications are turned on, and that the app has notification permission on your device.',
      },
    ],
  },
  {
    id: 'CUSTOMER',
    label: 'Customer issues',
    description: 'Disputes, ratings, and difficult interactions.',
    faqs: [
      {
        id: 'cus-1',
        question: 'A customer was rude or difficult',
        answer: "You're never required to tolerate abusive behaviour. Complete the delivery if it's safe to do so, then contact support to report it.",
      },
      {
        id: 'cus-2',
        question: 'I think I got an unfair rating',
        answer: 'Contact support with the delivery details and we\u2019ll take a look — ratings can be reviewed if something went wrong outside your control.',
      },
    ],
  },
];

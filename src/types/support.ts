export type SupportTopicId = 'PAYMENT' | 'DELIVERY' | 'ACCOUNT' | 'APP' | 'CUSTOMER';

// LucideIcon type imported where used — kept as a generic component type
// here so this file doesn't need to depend on lucide-react-native itself.
export type SupportFaqIconName =
  | 'Wallet2'
  | 'Receipt'
  | 'HandCoins'
  | 'PhoneOff'
  | 'ShieldAlert'
  | 'MapPinOff'
  | 'Ban'
  | 'FileClock'
  | 'Car'
  | 'MapPinX'
  | 'BellOff'
  | 'UserX'
  | 'Star';

export interface SupportFaq {
  id: string;
  question: string;
  /** One-line summary shown under the question in the row — not the full answer. */
  subtitle: string;
  icon: SupportFaqIconName;
  answer: string;
}

export interface SupportTopic {
  id: SupportTopicId;
  label: string;
  description: string;
  faqs: SupportFaq[];
}

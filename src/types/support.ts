export type SupportTopicId = 'PAYMENT' | 'DELIVERY' | 'ACCOUNT' | 'APP' | 'CUSTOMER';

export interface SupportFaq {
  id: string;
  question: string;
  answer: string;
}

export interface SupportTopic {
  id: SupportTopicId;
  label: string;
  description: string;
  faqs: SupportFaq[];
}

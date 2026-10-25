/** The email a partner sends to ask for their account to be deleted. The app
 * can't delete an account itself yet, so this is a request to support, and
 * the screen says exactly that. */
export function buildDeletionRequestMailto(supportEmail: string, accountEmail?: string | null): string {
  const subject = 'Account deletion request';
  const body = [
    'Hello Fastermall support,',
    '',
    'Please delete my Fastermall delivery partner account.',
    '',
    `Account email: ${accountEmail?.trim() || '(please add the email you sign in with)'}`,
    '',
    'Sent from the Fastermall Partner app.',
  ].join('\n');

  return `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

import { buildDeletionRequestMailto } from '@/src/utils/accountDeletion';

const decode = (url: string) => {
  const [head, query] = url.split('?');
  const params = new URLSearchParams(query);
  return { to: head.replace('mailto:', ''), subject: params.get('subject'), body: params.get('body') };
};

describe('buildDeletionRequestMailto', () => {
  it('addresses the request to support with a clear subject', () => {
    const { to, subject } = decode(buildDeletionRequestMailto('support@example.com', 'ama@example.com'));
    expect(to).toBe('support@example.com');
    expect(subject).toBe('Account deletion request');
  });

  it('includes the account email so support can find the account', () => {
    const { body } = decode(buildDeletionRequestMailto('support@example.com', 'ama@example.com'));
    expect(body).toContain('Account email: ama@example.com');
    expect(body).toContain('delete my Fastermall delivery partner account');
  });

  it('asks for the email when the app does not know it (for example offline)', () => {
    const { body } = decode(buildDeletionRequestMailto('support@example.com', null));
    expect(body).toContain('please add the email you sign in with');
  });

  it('survives characters that need escaping', () => {
    const { body } = decode(buildDeletionRequestMailto('support@example.com', 'a+b&c@example.com'));
    expect(body).toContain('Account email: a+b&c@example.com');
  });
});

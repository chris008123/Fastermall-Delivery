import { REDACTED, scrubEvent, scrubText, scrubUrl, scrubValue } from '@/src/utils/scrub';

describe('scrubText', () => {
  it('hides email addresses', () => {
    expect(scrubText('Login failed for ama.k+test@example.co.uk today')).toBe('Login failed for [email] today');
  });

  it('hides phone numbers and codes', () => {
    expect(scrubText('Call 0241234567 or use 884210')).toBe('Call [number] or use [number]');
  });

  it('leaves ordinary text and short numbers alone', () => {
    expect(scrubText('Stage 3 of 6 failed after 30 seconds')).toBe('Stage 3 of 6 failed after 30 seconds');
  });
});

describe('scrubUrl', () => {
  it('drops the query string and fragment', () => {
    expect(scrubUrl('https://api.example.com/x?token=abc&code=123456#top')).toBe('https://api.example.com/x');
  });
});

describe('scrubValue', () => {
  it('hides the values of sensitive keys at any depth', () => {
    const out = scrubValue({ ok: 1, headers: { Authorization: 'Bearer abc' }, body: { password: 'pw', nested: [{ email: 'a@b.co' }] } });
    expect(out).toEqual({ ok: 1, headers: { Authorization: REDACTED }, body: { password: REDACTED, nested: [{ email: REDACTED }] } });
  });

  it('scrubs personal details inside ordinary text values', () => {
    expect(scrubValue({ note: 'sent to a@b.co' })).toEqual({ note: 'sent to [email]' });
  });

  it('stops at a sensible depth instead of looping forever', () => {
    const loop: Record<string, unknown> = {};
    let cursor = loop;
    for (let i = 0; i < 20; i++) { cursor.next = {}; cursor = cursor.next as Record<string, unknown>; }
    expect(() => scrubValue(loop)).not.toThrow();
  });
});

describe('scrubEvent', () => {
  it('keeps only the account id for the user', () => {
    const event = scrubEvent({ user: { id: 'u1', email: 'a@b.co', username: 'ama', ip_address: '1.2.3.4' } });
    expect(event.user).toEqual({ id: 'u1' });
  });

  it('removes request headers and bodies and the URL query', () => {
    const event = scrubEvent({ request: { url: 'https://x.test/a?token=1', headers: { Authorization: 'Bearer x' }, data: { password: 'pw' } } });
    expect(event.request).toEqual({ url: 'https://x.test/a' });
  });

  it('cleans messages, exception text and breadcrumbs', () => {
    const event = scrubEvent({
      message: 'user a@b.co failed',
      exception: { values: [{ value: 'bad number 0241234567' }] },
      breadcrumbs: [{ message: 'tap 884210', data: { url: 'https://x.test/a?code=123456', token: 'abc' } }],
    });
    expect(event.message).toBe('user [email] failed');
    expect(event.exception?.values?.[0].value).toBe('bad number [number]');
    expect(event.breadcrumbs?.[0].message).toBe('tap [number]');
    expect(event.breadcrumbs?.[0].data).toEqual({ url: 'https://x.test/a', token: REDACTED });
  });

  it('copes with an event that has none of those parts', () => {
    expect(scrubEvent({})).toEqual({});
  });
});

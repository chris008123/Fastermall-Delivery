import { DEFAULT_API_URL, resolveApiBaseUrl } from '@/src/config/env';

describe('resolveApiBaseUrl', () => {
  it('uses the default address when nothing is configured', () => {
    expect(resolveApiBaseUrl(undefined)).toBe(DEFAULT_API_URL);
    expect(resolveApiBaseUrl('')).toBe(DEFAULT_API_URL);
    expect(resolveApiBaseUrl('   ')).toBe(DEFAULT_API_URL);
  });

  it('uses a configured https address', () => {
    expect(resolveApiBaseUrl('https://staging.example.com/api/v1')).toBe('https://staging.example.com/api/v1');
  });

  it('drops trailing slashes so request paths join cleanly', () => {
    expect(resolveApiBaseUrl('https://staging.example.com/api/v1/')).toBe('https://staging.example.com/api/v1');
  });

  it('refuses plain http outside development', () => {
    expect(() => resolveApiBaseUrl('http://staging.example.com')).toThrow('https');
  });

  it('allows plain http in development, for a local server', () => {
    expect(resolveApiBaseUrl('http://192.168.0.5:3000/api/v1', DEFAULT_API_URL, true)).toBe('http://192.168.0.5:3000/api/v1');
  });

  it('refuses a value that is not an address, instead of quietly using production', () => {
    expect(() => resolveApiBaseUrl('not a url')).toThrow('not a valid address');
  });

  it('refuses other schemes even in development', () => {
    expect(() => resolveApiBaseUrl('ftp://example.com', DEFAULT_API_URL, true)).toThrow('https');
  });
});

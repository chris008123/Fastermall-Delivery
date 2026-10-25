import { extractDeliveryCode } from '@/src/utils/deliveryCode';

describe('extractDeliveryCode', () => {
  it('keeps a plain 6-digit code as typed', () => {
    expect(extractDeliveryCode('123456')).toBe('123456');
  });

  it('keeps partial input while the partner is still typing', () => {
    expect(extractDeliveryCode('12')).toBe('12');
    expect(extractDeliveryCode('')).toBe('');
  });

  it('drops anything that is not a digit', () => {
    expect(extractDeliveryCode('12a3')).toBe('123');
    expect(extractDeliveryCode('1-2-3')).toBe('123');
  });

  it('pulls the code out of a pasted message', () => {
    expect(extractDeliveryCode('Your code is 123456')).toBe('123456');
    expect(extractDeliveryCode('Fastermall: 654321 is your delivery code. Do not share it.')).toBe('654321');
  });

  it('prefers the number after the word "code" over other numbers', () => {
    expect(extractDeliveryCode('Order 884210 code 123456')).toBe('123456');
    expect(extractDeliveryCode('Delivery code: 123456. Order 884210')).toBe('123456');
  });

  it('skips digits that belong to a longer number such as a phone number', () => {
    expect(extractDeliveryCode('Call 0241234567 or use 654321')).toBe('654321');
  });

  it('handles a code pasted with a space in the middle', () => {
    expect(extractDeliveryCode('123 456')).toBe('123456');
  });

  it('never returns more than 6 digits', () => {
    expect(extractDeliveryCode('1234567890')).toHaveLength(6);
    expect(extractDeliveryCode('12345')).toBe('12345');
  });
});

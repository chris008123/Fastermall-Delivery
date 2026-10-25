import { ApiError } from '@/src/services/api';
import { extractFieldErrors } from '@/src/utils/fieldErrors';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

describe('extractFieldErrors', () => {
  it('reads a list of field problems', () => {
    expect(extractFieldErrors({ errors: [{ field: 'email', message: 'Not valid' }, { path: 'password', message: 'Too short' }] })).toEqual({
      email: 'Not valid',
      password: 'Too short',
    });
  });

  it('reads a map of field to message, or to a list of messages', () => {
    expect(extractFieldErrors({ errors: { email: 'Not valid', password: ['Too short', 'Needs a number'] } })).toEqual({
      email: 'Not valid',
      password: 'Too short',
    });
  });

  it('keeps the first problem when a field appears twice', () => {
    expect(extractFieldErrors({ errors: [{ field: 'email', message: 'First' }, { field: 'email', message: 'Second' }] })).toEqual({ email: 'First' });
  });

  it('gives nothing for shapes it does not recognise', () => {
    expect(extractFieldErrors(null)).toEqual({});
    expect(extractFieldErrors('oops')).toEqual({});
    expect(extractFieldErrors({ message: 'Invalid credentials' })).toEqual({});
    expect(extractFieldErrors({ errors: [null, 5, { message: 'no field' }] })).toEqual({});
  });
});

describe('ApiError', () => {
  it('carries field errors, empty by default', () => {
    expect(new ApiError('x', 400).fieldErrors).toEqual({});
    expect(new ApiError('x', 422, { email: 'Not valid' }).fieldErrors).toEqual({ email: 'Not valid' });
  });
});

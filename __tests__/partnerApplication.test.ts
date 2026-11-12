/* eslint-disable import/first -- jest.mock() must come before the imports it replaces */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockApiFetch = jest.fn();
jest.mock('@/src/services/api', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

import {
  checkContact,
  checkPersonal,
  checkVehicle,
  isoDate,
  submitApplication,
  toApplicationBody,
  type ApplicationForm,
} from '@/src/services/partnerApplication';

const now = new Date('2026-11-12T10:00:00Z');
const form: ApplicationForm = {
  phone: '024 123 4567',
  email: ' Kojo@Example.com ',
  fullName: ' Kojo Mensah ',
  dateOfBirth: '14/05/2000',
  address: 'Ayeduase, Kumasi',
  vehicleMode: 'MOTORCYCLE',
  plateNumber: 'as 1234-20',
};

describe('partner application', () => {
  it('turns the form into the request the backend expects', () => {
    expect(toApplicationBody(form)).toEqual({
      fullName: 'Kojo Mensah',
      email: 'kojo@example.com',
      phone: '0241234567',
      dateOfBirth: '2000-05-14',
      address: 'Ayeduase, Kumasi',
      partnerType: 'MOTORCYCLE',
      plateNumber: 'AS 1234-20',
    });
    expect(toApplicationBody({ ...form, vehicleMode: 'WALKING' })).not.toHaveProperty('plateNumber');
  });

  it('reads DD/MM/YYYY and rejects impossible dates', () => {
    expect(isoDate('29/02/2004')).toBe('2004-02-29');
    expect(isoDate('31/02/2004')).toBeNull();
    expect(isoDate('2004-02-01')).toBeNull();
  });

  it('checks each step like the server does', () => {
    expect(checkContact(form)).toEqual({ phone: undefined, email: undefined });
    expect(checkContact({ ...form, phone: '24123', email: 'kojo@' })).toEqual({
      phone: expect.any(String),
      email: expect.any(String),
    });
    expect(checkPersonal(form, now)).toEqual({ fullName: undefined, dateOfBirth: undefined, address: undefined });
    expect(checkPersonal({ ...form, dateOfBirth: '13/11/2008' }, now).dateOfBirth).toMatch(/18 or older/);
    expect(checkPersonal({ ...form, dateOfBirth: '12/11/2008' }, now).dateOfBirth).toBeUndefined();
    expect(checkVehicle({ ...form, plateNumber: '' }).plateNumber).toBeDefined();
    expect(checkVehicle({ ...form, vehicleMode: 'WALKING', plateNumber: '' }).plateNumber).toBeUndefined();
  });

  it('sends it without a sign-in token', async () => {
    mockApiFetch.mockResolvedValue({ id: 'a1', status: 'PENDING' });
    await submitApplication(form);
    expect(mockApiFetch).toHaveBeenCalledWith('/partner-applications', expect.objectContaining({ method: 'POST', auth: false }));
    expect(JSON.parse(mockApiFetch.mock.calls[0][1].body).phone).toBe('0241234567');
  });
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

/**
 * Storage for persisted zustand stores that hold account data. Values live in
 * the platform keychain/keystore (encrypted) instead of plain AsyncStorage.
 *
 * Reads fall back to AsyncStorage once, so data saved by an older app version
 * is still found; the first write moves it across.
 */
export const secureStateStorage: StateStorage = {
  getItem: async (name) =>
    (await SecureStore.getItemAsync(name)) ?? (await AsyncStorage.getItem(name)),

  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
    await AsyncStorage.removeItem(name);
  },

  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
    await AsyncStorage.removeItem(name);
  },
};

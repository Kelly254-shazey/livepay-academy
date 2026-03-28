import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import type { StateStorage } from 'zustand/middleware';

const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
let secureStoreAvailable: Promise<boolean> | null = null;

function getPath(key: string) {
  return `${baseDirectory}${key}.json`;
}

async function isSecureStoreAvailable() {
  if (!secureStoreAvailable) {
    secureStoreAvailable = SecureStore.isAvailableAsync().catch(() => false);
  }

  return secureStoreAvailable;
}

async function readFileValue(name: string) {
  if (!baseDirectory) return null;

  const path = getPath(name);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  return FileSystem.readAsStringAsync(path);
}

async function writeFileValue(name: string, value: string) {
  if (!baseDirectory) return;
  await FileSystem.writeAsStringAsync(getPath(name), value);
}

async function removeFileValue(name: string) {
  if (!baseDirectory) return;
  const path = getPath(name);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

export const fileStorage: StateStorage = {
  getItem: async (name) => {
    if (await isSecureStoreAvailable()) {
      const secureValue = await SecureStore.getItemAsync(name);
      if (secureValue !== null) {
        return secureValue;
      }

      const fileValue = await readFileValue(name);
      if (fileValue !== null) {
        await SecureStore.setItemAsync(name, fileValue);
        await removeFileValue(name);
      }

      return fileValue;
    }

    return readFileValue(name);
  },
  setItem: async (name, value) => {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(name, value);
      await removeFileValue(name);
      return;
    }

    await writeFileValue(name, value);
  },
  removeItem: async (name) => {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(name);
    }

    await removeFileValue(name);
  },
};

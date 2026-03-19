import * as FileSystem from 'expo-file-system/legacy';
import type { StateStorage } from 'zustand/middleware';

const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';

function getPath(key: string) {
  return `${baseDirectory}${key}.json`;
}

export const fileStorage: StateStorage = {
  getItem: async (name) => {
    if (!baseDirectory) return null;
    const path = getPath(name);
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return FileSystem.readAsStringAsync(path);
  },
  setItem: async (name, value) => {
    if (!baseDirectory) return;
    await FileSystem.writeAsStringAsync(getPath(name), value);
  },
  removeItem: async (name) => {
    if (!baseDirectory) return;
    const path = getPath(name);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  },
};

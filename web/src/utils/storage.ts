const STORAGE_KEYS = {
  locale: "ccpoke-locale",
  tunnelUrl: "ccpoke_tunnel_url",
  theme: "ccpoke-theme",
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

export function getStorage(key: StorageKey): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS[key]);
  } catch {
    return null;
  }
}

export function setStorage(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
  } catch {
    // localStorage not available (e.g. private browsing)
  }
}

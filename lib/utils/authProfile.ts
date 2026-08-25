import { AUTH_PROFILE_STORAGE_KEY } from "@/lib/constants/auth";

export interface StoredAuthProfile {
  email?: string | null;
  displayName?: string | null;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readStoredAuthProfile(): StoredAuthProfile | null {
  if (!canUseSessionStorage()) return null;

  const raw = window.sessionStorage.getItem(AUTH_PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthProfile;
  } catch {
    window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
    return null;
  }
}

export function rememberAuthProfile(profile: StoredAuthProfile) {
  if (!canUseSessionStorage()) return;

  const current = readStoredAuthProfile() ?? {};
  window.sessionStorage.setItem(
    AUTH_PROFILE_STORAGE_KEY,
    JSON.stringify({
      ...current,
      ...profile,
    })
  );
}

export function clearStoredAuthProfile() {
  if (canUseSessionStorage()) window.sessionStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
}

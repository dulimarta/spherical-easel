import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { FillStyle } from "@/types";
import { PreferenceRef } from "../utils/preferenceRef"

export type UserPreferences = {
  defaultFill?: FillStyle | null;
  easelDecimalPrecision?: number;
  hierarchyDecimalPrecision?: number;
  notificationLevels?: string[] | null;
};

export async function loadUserPreferences(uid: string): Promise<UserPreferences | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // preferences are stored as a nested object on the user document
  // under the `preferences` key.
  const prefs = (data as any)?.preferences;
  PreferenceRef.update(prefs);
  return prefs ? (prefs as UserPreferences) : null;
}

export async function saveUserPreferences(uid: string, prefs: Partial<UserPreferences>) {
  const db = getFirestore();
  const toSave: Record<string, unknown> = {};
  PreferenceRef.update(prefs);
  Object.entries(prefs).forEach(([k, v]) => {
    if (v !== undefined) toSave[k] = v;
  });
  if (Object.keys(toSave).length === 0) return;
  // Save under the nested `preferences` key to keep user doc fields separate
  await setDoc(doc(db, "users", uid), { preferences: toSave }, { merge: true });
}

export default { loadUserPreferences, saveUserPreferences };

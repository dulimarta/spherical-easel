import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { FillStyle } from "@/types";
import { PreferenceRef } from "../utils/preferenceRef"

// Add new boundary circle preferences to the type definition
export type UserPreferences = {
  defaultFill?: FillStyle | null;
  easelDecimalPrecision?: number;
  objectTreeDecimalPrecision?: number;
  notificationLevels?: string[] | null;
  momentumDecay?: number | null;
  boundaryColor?: string | null;
  boundaryWidth?: number | null;
  measurementMode?: "degrees" | "radians" | "pi";
};

// Load user preferences from Firestore
export async function loadUserPreferences(uid: string): Promise<UserPreferences | null> {
  const db = getFirestore();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const prefs = (data as any)?.preferences;
  PreferenceRef.update(prefs);
  return prefs ? (prefs as UserPreferences) : null;
}

// Save user preferences to Firestore
export async function saveUserPreferences(uid: string, prefs: Partial<UserPreferences>) {
  const db = getFirestore();
  const toSave: Record<string, unknown> = {};
  PreferenceRef.update(prefs);
  Object.entries(prefs).forEach(([k, v]) => {
    if (v !== undefined) toSave[k] = v;
  });
  if (Object.keys(toSave).length === 0) return;
  await setDoc(doc(db, "users", uid), { preferences: toSave }, { merge: true });
}

export default { loadUserPreferences, saveUserPreferences };

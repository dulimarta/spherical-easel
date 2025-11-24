import SETTINGS from "@/global-settings";
import { defineStore } from "pinia";
import { ref } from "vue";
import { loadUserPreferences, saveUserPreferences } from "@/utils/userPreferences";
import { getAuth } from "firebase/auth";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

const DEFAULT_NOTIFICATION_LEVELS = ["success", "info", "error", "warning"];

export const useUserPreferencesStore = defineStore("userPreferences", () => {
  const defaultFill = ref<FillStyle | null>(null);
  const easelDecimalPrecision = ref<number>(SETTINGS.decimalPrecision);
  const objectTreeDecimalPrecision = ref<number>(SETTINGS.decimalPrecision);
  const notificationLevels = ref<string[] | null>(null);
  const momentumDecay = ref<number | null>(null);
  const boundaryColor = ref("#000000FF");
  const boundaryWidth = ref(4);
  const loading = ref(false);

  // Load preferences from Firestore
  async function load(uid?: string) {
    const auth = getAuth();
    const resolvedUid = uid ?? auth.currentUser?.uid;
    if (!resolvedUid) return;
    loading.value = true;
    const prefs = await loadUserPreferences(resolvedUid);

    defaultFill.value = prefs?.defaultFill ?? null;
    easelDecimalPrecision.value = prefs?.easelDecimalPrecision ?? SETTINGS.decimalPrecision;
    objectTreeDecimalPrecision.value = prefs?.objectTreeDecimalPrecision ?? SETTINGS.decimalPrecision;
    // Apply the preference to the runtime global fill style if present
    if (defaultFill.value !== null && defaultFill.value !== undefined) {
      Nodule.globalFillStyle = defaultFill.value as FillStyle;
    }

    // Load notification levels
    notificationLevels.value = prefs?.notificationLevels ?? [...DEFAULT_NOTIFICATION_LEVELS];
    // Load momentum decay, defaulting to 3 seconds if not set
    momentumDecay.value = prefs?.momentumDecay ?? 3;
    // Load boundary circle preferences
    boundaryColor.value = prefs?.boundaryColor ?? "#000000FF";
    boundaryWidth.value = prefs?.boundaryWidth ?? 4;

    loading.value = false;
  }

  // Save preferences to Firestore
  async function save() {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    // Persist the current value (allow null to be stored as null)
    await saveUserPreferences(uid, {
      defaultFill: defaultFill.value,
      easelDecimalPrecision: easelDecimalPrecision.value,
      objectTreeDecimalPrecision: objectTreeDecimalPrecision.value,
      notificationLevels: notificationLevels.value,
      boundaryColor: boundaryColor.value,
      boundaryWidth: boundaryWidth.value,
      momentumDecay: momentumDecay.value
    });
  }

  return { defaultFill, easelDecimalPrecision, objectTreeDecimalPrecision, notificationLevels, loading, load, save };
});

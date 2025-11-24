import { defineStore } from "pinia";
import { ref } from "vue";
import { loadUserPreferences, saveUserPreferences } from "@/utils/userPreferences";
import { getAuth } from "firebase/auth";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

const DEFAULT_NOTIFICATION_LEVELS = ["success", "info", "error", "warning"];

export const useUserPreferencesStore = defineStore("userPreferences", () => {
  const defaultFill = ref<FillStyle | null>(null);
  const notificationLevels = ref<string[] | null>(null);
  const momentumDecay = ref<number | null>(null);
  const loading = ref(false);

  async function load(uid?: string) {
    const auth = getAuth();
    const resolvedUid = uid ?? auth.currentUser?.uid;
    if (!resolvedUid) return;
    loading.value = true;
    const prefs = await loadUserPreferences(resolvedUid);
    defaultFill.value = prefs?.defaultFill ?? null;
    // Apply the preference to the runtime global fill style if present
    if (defaultFill.value !== null && defaultFill.value !== undefined) {
      Nodule.globalFillStyle = defaultFill.value as FillStyle;
    }
    // Load notification levels, defaulting to all types if not set
    notificationLevels.value = prefs?.notificationLevels ?? [...DEFAULT_NOTIFICATION_LEVELS];
    // Load momentum decay, defaulting to 3 seconds if not set
    momentumDecay.value = prefs?.momentumDecay ?? 3;
    loading.value = false;
  }

  async function save() {
    const auth = getAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");
    // Persist the current value (allow null to be stored as null)
    await saveUserPreferences(uid, { 
      defaultFill: defaultFill.value,
      notificationLevels: notificationLevels.value,
      momentumDecay: momentumDecay.value
    });
  }

  return { defaultFill, notificationLevels, momentumDecay, loading, load, save };
});

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

    // Apply fill style globally if available
    if (defaultFill.value !== null && defaultFill.value !== undefined) {
      Nodule.globalFillStyle = defaultFill.value as FillStyle;
    }

    // Load notification levels
    notificationLevels.value = prefs?.notificationLevels ?? [...DEFAULT_NOTIFICATION_LEVELS];

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

    await saveUserPreferences(uid, {
      defaultFill: defaultFill.value,
      notificationLevels: notificationLevels.value,
      boundaryColor: boundaryColor.value,
      boundaryWidth: boundaryWidth.value
    });
  }

  return { defaultFill, notificationLevels, boundaryColor, boundaryWidth, loading, load, save };
});

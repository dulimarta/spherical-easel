import SETTINGS from "@/global-settings";
import { defineStore } from "pinia";
import { ref } from "vue";
import { loadUserPreferences, saveUserPreferences } from "@/utils/userPreferences";
import { getAuth } from "firebase/auth";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

const DEFAULT_NOTIFICATION_LEVELS = ["success", "info", "error", "warning"];
const DEFAULT_TOOLTIP_MODE: TooltipMode = "full"

export const TOOLTIP_MODES = ["full", "minimal", "tools-only", "easel-only", "none"] as const;
export type TooltipMode = typeof TOOLTIP_MODES[number];
export const useUserPreferencesStore = defineStore("userPreferences", () => {
  const defaultFill = ref<FillStyle | null>(null);
  const easelDecimalPrecision = ref<number>(SETTINGS.decimalPrecision);
  const hierarchyDecimalPrecision = ref<number>(SETTINGS.decimalPrecision);
  const notificationLevels = ref<string[] | null>(null);
  const boundaryColor = ref("#000000FF");
  const boundaryWidth = ref(4);
  const tooltipMode = ref<TooltipMode>(DEFAULT_TOOLTIP_MODE);
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
    hierarchyDecimalPrecision.value = prefs?.hierarchyDecimalPrecision ?? SETTINGS.decimalPrecision;
    // Apply the preference to the runtime global fill style if present
    if (defaultFill.value !== null && defaultFill.value !== undefined) {
      Nodule.globalFillStyle = defaultFill.value as FillStyle;
    }

    // Load notification levels
    notificationLevels.value = prefs?.notificationLevels ?? [...DEFAULT_NOTIFICATION_LEVELS];

    // Load boundary circle preferences
    boundaryColor.value = prefs?.boundaryColor ?? "#000000FF";
    boundaryWidth.value = prefs?.boundaryWidth ?? 4;

    // Load tooltip preferences
   if (prefs?.tooltipMode && (TOOLTIP_MODES as readonly string[]).includes(prefs.tooltipMode)) {
     tooltipMode.value = prefs.tooltipMode;
}  else {
     tooltipMode.value = DEFAULT_TOOLTIP_MODE;
   }


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
      hierarchyDecimalPrecision: hierarchyDecimalPrecision.value,
      notificationLevels: notificationLevels.value,
      boundaryColor: boundaryColor.value,
      boundaryWidth: boundaryWidth.value,
      tooltipMode: tooltipMode.value
    });
  }

  return { defaultFill, easelDecimalPrecision, tooltipMode, hierarchyDecimalPrecision, notificationLevels, loading, load, save };
});

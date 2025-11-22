
import { useUserPreferencesStore } from "@/stores/userPreferences";

export const MINIMAL_TOOLTIP_SET = [
  "point",
  "line",
  "segment",
  "circle",
  "angle",
  "pointDistance",
  "segmentLength",
  "coordinate"
] as const;


export type MinimalTooltipType = typeof MINIMAL_TOOLTIP_SET[number];

export function allowEaselTooltip(): boolean {
  const prefs = useUserPreferencesStore();
  const mode = prefs.tooltipMode;

  if (mode === "none" || mode === "tools-only") return false;

  return true;
}

export function easelTooltipIsMinimal(): boolean {
  const prefs = useUserPreferencesStore();
  return prefs.tooltipMode === "minimal";
}

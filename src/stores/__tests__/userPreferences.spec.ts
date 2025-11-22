import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

const mockCurrentUser = { uid: "test-user-123" };
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockCurrentUser
  }))
}));

const mockLoadUserPreferences = vi.fn();
const mockSaveUserPreferences = vi.fn();

vi.mock("@/utils/userPreferences", () => ({
  loadUserPreferences: mockLoadUserPreferences,
  saveUserPreferences: mockSaveUserPreferences
}));

const { useUserPreferencesStore } = await import("../userPreferences");

describe("userPreferences store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    Nodule.globalFillStyle = FillStyle.NoFill;
  });

  describe("state initialization", () => {
    it("should initialize with null defaultFill", () => {
      const store = useUserPreferencesStore();
      expect(store.defaultFill).toBeNull();
    });

    it("should initialize with decimal precisions of 3", () => {
      const store = useUserPreferencesStore();
      expect(store.easelDecimalPrecision).toBe(3);
      expect(store.hierarchyDecimalPrecision).toBe(3);
    });

    it("should initialize with null notificationLevels", () => {
      const store = useUserPreferencesStore();
      expect(store.notificationLevels).toBeNull();
    });

    it("should initialize with loading false", () => {
      const store = useUserPreferencesStore();
      expect(store.loading).toBe(false);
    });
  });

  describe("load function", () => {
    it("should load preferences for current user when no uid provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: 4,
        hierarchyDecimalPrecision: 5
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("test-user-123");
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(store.easelDecimalPrecision).toBe(4);
      expect(store.hierarchyDecimalPrecision).toBe(5);
    });

    it("should load preferences for specific uid when provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.ShadeFill,
        easelDecimalPrecision: 5,
        hierarchyDecimalPrecision: 4
      });

      const store = useUserPreferencesStore();
      await store.load("specific-user-456");

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("specific-user-456");
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(store.easelDecimalPrecision).toBe(5);
      expect(store.hierarchyDecimalPrecision).toBe(4);
    });

    it("should set loading state during load operation", async () => {
      let loadingDuringCall = false;
      mockLoadUserPreferences.mockImplementation(async () => {
        const store = useUserPreferencesStore();
        loadingDuringCall = store.loading;
        return { defaultFill: FillStyle.PlainFill };
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(loadingDuringCall).toBe(true);
      expect(store.loading).toBe(false);
    });

    it("should set defaultFill to null when no preferences exist", async () => {
      mockLoadUserPreferences.mockResolvedValue(null);

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.defaultFill).toBeNull();
    });

    it("should set decimal precisions to 3 when no preferences exist", async () => {
      mockLoadUserPreferences.mockResolvedValue(null);

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.easelDecimalPrecision).toBe(3);
      expect(store.hierarchyDecimalPrecision).toBe(3);
    });

    it("should apply preference to Nodule.globalFillStyle when loaded", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(Nodule.globalFillStyle).toBe(FillStyle.PlainFill);
    });

    it("should not change Nodule.globalFillStyle when defaultFill is null", async () => {
      Nodule.globalFillStyle = FillStyle.ShadeFill;
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: null
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(Nodule.globalFillStyle).toBe(FillStyle.ShadeFill);
    });

    it("should not load when no current user and no uid provided", async () => {
      mockCurrentUser.uid = "";
      const { getAuth } = await import("firebase/auth");
      (getAuth as any).mockReturnValueOnce({ currentUser: null });

      const store = useUserPreferencesStore();
      await store.load();

      expect(mockLoadUserPreferences).not.toHaveBeenCalled();
      mockCurrentUser.uid = "test-user-123";
    });

    it("should handle all FillStyle enum values", async () => {
      const store = useUserPreferencesStore();

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.NoFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.PlainFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.ShadeFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.ShadeFill);
    });

    it("should handle decimal precision values 0 and above", async () => {
      const store = useUserPreferencesStore();

      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: 0,
        hierarchyDecimalPrecision: 0
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(0);
      expect(store.hierarchyDecimalPrecision).toBe(0);

      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(3);
      expect(store.hierarchyDecimalPrecision).toBe(3);

      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: Number.MAX_VALUE,
        hierarchyDecimalPrecision: Number.MAX_VALUE
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(Number.MAX_VALUE);
      expect(store.hierarchyDecimalPrecision).toBe(Number.MAX_VALUE);
    });

    it("should load notification levels when provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        notificationLevels: ["success", "error"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.notificationLevels).toEqual(["success", "error"]);
    });

    it("should default notification levels to all types when not provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.notificationLevels).toEqual(["success", "info", "error", "warning"]);
    });

    it("should load empty notification levels array", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        notificationLevels: []
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.notificationLevels).toEqual([]);
    });

    it("should load both defaultFill and notificationLevels together", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.ShadeFill,
        notificationLevels: ["info", "warning"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(store.notificationLevels).toEqual(["info", "warning"]);
    });
  });

  describe("save function", () => {
    it("should save current defaultFill preference", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4,
        tooltipMode: "full"
      });
    });
  });

  describe("integration scenarios", () => {
    it("should support load -> modify -> save workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.NoFill,
        notificationLevels: ["success", "info", "error", "warning"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      store.defaultFill = FillStyle.PlainFill;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3,
        notificationLevels: ["success", "info", "error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4,
        tooltipMode: "full"
      });
    });

    it("should handle multiple loads without conflicts", async () => {
      const store = useUserPreferencesStore();

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();

      expect(store.defaultFill).toBe(FillStyle.PlainFill);
    });

    it("should maintain preference value between loads and saves", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill,
        notificationLevels: ["success", "info", "error", "warning"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3,
        notificationLevels: ["success", "info", "error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4,
        tooltipMode: "full"
      });
    });

    it("should handle notification levels workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        notificationLevels: ["error", "warning"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3,
        notificationLevels: ["error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4,
        tooltipMode: "full"
      });
    });

    it("should handle toggling notification levels", async () => {
      const store = useUserPreferencesStore();
      store.notificationLevels = ["success", "info"];

      store.notificationLevels = ["success"];

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith(
        "test-user-123",
        expect.objectContaining({
          notificationLevels: ["success"]
        })
      );
    });
  });

  describe("tooltipMode behavior", () => {
    it("should initialize tooltipMode to 'full'", () => {
      const store = useUserPreferencesStore();
      expect(store.tooltipMode).toBe("full");
    });

    it("should load a valid tooltipMode from preferences", async () => {
      mockLoadUserPreferences.mockResolvedValue({ tooltipMode: "minimal" });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.tooltipMode).toBe("minimal");
    });

    it("should fall back to default mode when an invalid tooltipMode is loaded", async () => {
      mockLoadUserPreferences.mockResolvedValue({ tooltipMode: "invalid-mode" });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.tooltipMode).toBe("full");
    });

    it("should fall back to default mode when tooltipMode is missing", async () => {
      mockLoadUserPreferences.mockResolvedValue({ });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.tooltipMode).toBe("full");
    });

    it("should save the tooltipMode preference", async () => {
      const store = useUserPreferencesStore();
      store.tooltipMode = "tools-only";

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        easelDecimalPrecision: 3,
        hierarchyDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4,
        tooltipMode: "tools-only"
      });
    });

    it("should allow switching between all TOOLTIP_MODES values", async () => {
      const store = useUserPreferencesStore();

      for (const mode of ["full", "minimal", "tools-only", "easel-only", "none"] as const) {
        store.tooltipMode = mode;
        expect(store.tooltipMode).toBe(mode);
      }
    });
  });
});

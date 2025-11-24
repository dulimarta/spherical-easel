import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { FillStyle } from "@/types";
import Nodule from "@/plottables/Nodule";

// Mock Firebase Auth
const mockCurrentUser = { uid: "test-user-123" };
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({
    currentUser: mockCurrentUser
  }))
}));

// Mock user preferences utilities
const mockLoadUserPreferences = vi.fn();
const mockSaveUserPreferences = vi.fn();

vi.mock("@/utils/userPreferences", () => ({
  loadUserPreferences: mockLoadUserPreferences,
  saveUserPreferences: mockSaveUserPreferences
}));

// Import after mocking
const { useUserPreferencesStore } = await import("../userPreferences");

describe("userPreferences store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Reset Nodule.globalFillStyle to default
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
      expect(store.objectTreeDecimalPrecision).toBe(3);
    });

    it("should initialize with null notificationLevels", () => {
      const store = useUserPreferencesStore();
      expect(store.notificationLevels).toBeNull();
    });

    it("should initialize with null momentumDecay", () => {
      const store = useUserPreferencesStore();
      expect(store.momentumDecay).toBeNull();
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
        objectTreeDecimalPrecision: 5
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("test-user-123");
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(store.easelDecimalPrecision).toBe(4);
      expect(store.objectTreeDecimalPrecision).toBe(5);
    });

    it("should load preferences for specific uid when provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.ShadeFill,
        easelDecimalPrecision: 5,
        objectTreeDecimalPrecision: 4
      });

      const store = useUserPreferencesStore();
      await store.load("specific-user-456");

      expect(mockLoadUserPreferences).toHaveBeenCalledWith("specific-user-456");
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(store.easelDecimalPrecision).toBe(5);
      expect(store.objectTreeDecimalPrecision).toBe(4);
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
      expect(store.objectTreeDecimalPrecision).toBe(3);
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
      mockCurrentUser.uid = "test-user-123"; // Reset for other tests
    });

    it("should handle all FillStyle enum values", async () => {
      const store = useUserPreferencesStore();

      // Test NoFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.NoFill);

      // Test PlainFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.PlainFill);

      // Test ShadeFill
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.ShadeFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(Nodule.globalFillStyle).toBe(FillStyle.ShadeFill);
    });

    it("should handle decimal precision values 0 and above", async () => {
      const store = useUserPreferencesStore();

      // Test 0
      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: 0,
        objectTreeDecimalPrecision: 0
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(0);
      expect(store.objectTreeDecimalPrecision).toBe(0);

      // Test high use case
      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(3);
      expect(store.objectTreeDecimalPrecision).toBe(3);


      // Test max number
      mockLoadUserPreferences.mockResolvedValue({
        easelDecimalPrecision: Number.MAX_VALUE,
        objectTreeDecimalPrecision: Number.MAX_VALUE
      });
      await store.load();
      expect(store.easelDecimalPrecision).toBe(Number.MAX_VALUE);
      expect(store.objectTreeDecimalPrecision).toBe(Number.MAX_VALUE);
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

    it("should load momentum decay when provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        momentumDecay: 10
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.momentumDecay).toBe(10);
    });

    it("should default momentum decay to 3 when not provided", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.momentumDecay).toBe(3);
    });

    it("should load momentum decay of 0", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        momentumDecay: 0
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.momentumDecay).toBe(0);
    });

    it("should load momentum decay at maximum value 60", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        momentumDecay: 60
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.momentumDecay).toBe(60);
    });

    it("should load all preferences together", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.ShadeFill,
        notificationLevels: ["info", "warning"],
        momentumDecay: 15
      });

      const store = useUserPreferencesStore();
      await store.load();

      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
      expect(store.notificationLevels).toEqual(["info", "warning"]);
      expect(store.momentumDecay).toBe(15);
    });
  });

  describe("save function", () => {
    it("should save current defaultFill preference", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save current decimal precision preferences", async () => {
      const store = useUserPreferencesStore();
      store.easelDecimalPrecision = 4;
      store.objectTreeDecimalPrecision = 5;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 4,
        objectTreeDecimalPrecision: 5,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save null defaultFill value", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = null;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should throw error when not authenticated", async () => {
      mockCurrentUser.uid = "";
      const { getAuth } = await import("firebase/auth");
      (getAuth as any).mockReturnValueOnce({ currentUser: null });

      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;

      await expect(store.save()).rejects.toThrow("Not authenticated");
      mockCurrentUser.uid = "test-user-123"; // Reset for other tests
    });

    it("should save all FillStyle enum values", async () => {
      const store = useUserPreferencesStore();

      // Test NoFill
      store.defaultFill = FillStyle.NoFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.NoFill,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Test PlainFill
      store.defaultFill = FillStyle.PlainFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Test ShadeFill
      store.defaultFill = FillStyle.ShadeFill;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.ShadeFill,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save decimal precision values 0 and above", async () => {
      const store = useUserPreferencesStore();

      // Test 0
      store.easelDecimalPrecision = 0;
      store.objectTreeDecimalPrecision = 0;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 0,
        objectTreeDecimalPrecision: 0,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Test high use case
      store.easelDecimalPrecision = 3;
      store.objectTreeDecimalPrecision = 3;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Test max number
      store.easelDecimalPrecision = Number.MAX_VALUE;
      store.objectTreeDecimalPrecision = Number.MAX_VALUE;
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: Number.MAX_VALUE,
        objectTreeDecimalPrecision: Number.MAX_VALUE,
        notificationLevels: null,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save notification levels preference", async () => {
      const store = useUserPreferencesStore();
      store.notificationLevels = ["success", "error"];

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["success", "error"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save empty notification levels array", async () => {
      const store = useUserPreferencesStore();
      store.notificationLevels = [];

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: [],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save both defaultFill and notificationLevels together", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;
      store.notificationLevels = ["info", "warning"];

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        notificationLevels: ["info", "warning"],
        momentumDecay: null,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save momentum decay preference", async () => {
      const store = useUserPreferencesStore();
      store.momentumDecay = 20;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        notificationLevels: null,
        momentumDecay: 20,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save momentum decay of 0", async () => {
      const store = useUserPreferencesStore();
      store.momentumDecay = 0;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        notificationLevels: null,
        momentumDecay: 0,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save momentum decay at maximum value 60", async () => {
      const store = useUserPreferencesStore();
      store.momentumDecay = 60;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        notificationLevels: null,
        momentumDecay: 60,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should save all preferences together", async () => {
      const store = useUserPreferencesStore();
      store.defaultFill = FillStyle.PlainFill;
      store.notificationLevels = ["info", "warning"];
      store.momentumDecay = 25;

      await store.save();

      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        momentumDecay: 25,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["info", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });
  });

  describe("integration scenarios", () => {
    it("should support load -> modify -> save workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.NoFill,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3
      });

      const store = useUserPreferencesStore();
      
      // Load initial preference
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);

      // Modify preference
      store.defaultFill = FillStyle.PlainFill;

      // Save modified preference
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        momentumDecay: 3,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["success", "info", "error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should handle multiple loads without conflicts", async () => {
      const store = useUserPreferencesStore();

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.NoFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.NoFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);

      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.ShadeFill });
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.ShadeFill);
    });

    it("should maintain preference value between loads and saves", async () => {
      const store = useUserPreferencesStore();

      // Initial load
      mockLoadUserPreferences.mockResolvedValue({ defaultFill: FillStyle.PlainFill });
      await store.load();

      // Save same value
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.PlainFill,
        momentumDecay: 3,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["success", "info", "error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Verify value unchanged
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
    });

    it("should handle notification levels workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        notificationLevels: ["success", "info", "error", "warning"]
      });

      const store = useUserPreferencesStore();
      
      // Load initial preference
      await store.load();
      expect(store.notificationLevels).toEqual(["success", "info", "error", "warning"]);

      // Modify preference
      store.notificationLevels = ["error", "warning"];

      // Save modified preference
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: 3,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should handle toggling notification levels", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        notificationLevels: ["success", "info", "error", "warning"]
      });

      const store = useUserPreferencesStore();
      await store.load();

      // Remove a level
      store.notificationLevels = ["success", "error", "warning"];
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenLastCalledWith("test-user-123", {
        defaultFill: null,
        momentumDecay: 3,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        notificationLevels: ["success", "error", "warning"],
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      // Add it back
      store.notificationLevels = ["success", "info", "error", "warning"];
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenLastCalledWith("test-user-123", {
        defaultFill: null,
        notificationLevels: ["success", "info", "error", "warning"],
        momentumDecay: 3,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should handle momentum decay workflow", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        momentumDecay: 10
      });

      const store = useUserPreferencesStore();
      
      // Load initial preference
      await store.load();
      expect(store.momentumDecay).toBe(10);

      // Modify preference
      store.momentumDecay = 30;

      // Save modified preference
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: null,
        notificationLevels: ["success", "info", "error", "warning"],
        momentumDecay: 30,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });

    it("should handle all preferences workflow together", async () => {
      mockLoadUserPreferences.mockResolvedValue({
        defaultFill: FillStyle.PlainFill,
        notificationLevels: ["success", "info"],
        momentumDecay: 15,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });

      const store = useUserPreferencesStore();
      
      // Load all preferences
      await store.load();
      expect(store.defaultFill).toBe(FillStyle.PlainFill);
      expect(store.notificationLevels).toEqual(["success", "info"]);
      expect(store.momentumDecay).toBe(15);

      // Modify all preferences
      store.defaultFill = FillStyle.ShadeFill;
      store.notificationLevels = ["error", "warning"];
      store.momentumDecay = 45;

      // Save all modified preferences
      await store.save();
      expect(mockSaveUserPreferences).toHaveBeenCalledWith("test-user-123", {
        defaultFill: FillStyle.ShadeFill,
        notificationLevels: ["error", "warning"],
        momentumDecay: 45,
        easelDecimalPrecision: 3,
        objectTreeDecimalPrecision: 3,
        boundaryColor: "#000000FF",
        boundaryWidth: 4
      });
    });
  });
});
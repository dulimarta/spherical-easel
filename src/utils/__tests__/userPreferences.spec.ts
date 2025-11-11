import SETTINGS from "@/global-settings";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FillStyle } from "@/types";

// Mock data storage
let mockUserData: Record<string, any> = {};

// Mock Firestore functions
const mockGetDoc = vi.fn(async (docRef: any) => {
  const data = mockUserData[docRef.uid];
  return {
    exists: () => !!data,
    data: () => data
  };
});

const mockSetDoc = vi.fn(async (docRef: any, data: any, options?: any) => {
  if (options?.merge) {
    mockUserData[docRef.uid] = {
      ...mockUserData[docRef.uid],
      ...data
    };
  } else {
    mockUserData[docRef.uid] = data;
  }
});

const mockDoc = vi.fn((db: any, collection: string, uid: string) => ({
  collection,
  uid
}));

// Mock Firestore module
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc
}));

// Import after mocking
const { loadUserPreferences, saveUserPreferences } = await import("../userPreferences");

describe("user preferences utility functions", () => {
  beforeEach(() => {
    mockUserData = {};
    vi.clearAllMocks();
  });

  describe("loadUserPrefs", () => {
    it("should return null when user document does not exist", async () => {
      const result = await loadUserPreferences("nonexistent-user");
      expect(result).toBeNull();
    });

    it("should return null when user document exists but has no preferences", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        favoriteTools: "#"
      };

      const result = await loadUserPreferences("test-user");
      expect(result).toBeNull();
    });

    it("should load preferences from nested preferences object", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        preferences: {
          defaultFill: FillStyle.PlainFill,
          easelDecimalPrecision: SETTINGS.decimalPrecision,
          hierarchyDecimalPrecision: SETTINGS.decimalPrecision
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result).toEqual({
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: SETTINGS.decimalPrecision,
        hierarchyDecimalPrecision: SETTINGS.decimalPrecision
      });
    });

    it("should load preferences with null defaultFill", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        preferences: {
          defaultFill: null
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result).toEqual({
        defaultFill: null
      });
    });

    it("should load all FillStyle enum values correctly", async () => {
      // Test NoFill
      mockUserData["user-nofill"] = {
        preferences: { defaultFill: FillStyle.NoFill }
      };
      let result = await loadUserPreferences("user-nofill");
      expect(result?.defaultFill).toBe(FillStyle.NoFill);

      // Test PlainFill
      mockUserData["user-plainfill"] = {
        preferences: { defaultFill: FillStyle.PlainFill }
      };
      result = await loadUserPreferences("user-plainfill");
      expect(result?.defaultFill).toBe(FillStyle.PlainFill);

      // Test ShadeFill
      mockUserData["user-shadefill"] = {
        preferences: { defaultFill: FillStyle.ShadeFill }
      };
      result = await loadUserPreferences("user-shadefill");
      expect(result?.defaultFill).toBe(FillStyle.ShadeFill);
    });

    it("should load decimal precision values 0 and up correctly", async () => {
      mockUserData["user-easelzero"] = {
        preferences: { easelDecimalPrecision: 0 }
      };
      let result = await loadUserPreferences("user-easelzero");
      expect(result?.easelDecimalPrecision).toBe(0);

      mockUserData["user-hierarchyzero"] = {
        preferences: { hierarchyDecimalPrecision: 0 }
      };
      result = await loadUserPreferences("user-hierarchyzero");
      expect(result?.hierarchyDecimalPrecision).toBe(0);

      mockUserData["user-easelthree"] = {
        preferences: { easelDecimalPrecision: 3 }
      };
      result = await loadUserPreferences("user-easelthree");
      expect(result?.easelDecimalPrecision).toBe(3);

      mockUserData["user-hierarchythree"] = {
        preferences: { hierarchyDecimalPrecision: 3 }
      };
      result = await loadUserPreferences("user-hierarchythree");
      expect(result?.hierarchyDecimalPrecision).toBe(3);

      mockUserData["user-easelmax"] = {
        preferences: { easelDecimalPrecision: Number.MAX_VALUE }
      };
      result = await loadUserPreferences("user-easelmax");
      expect(result?.easelDecimalPrecision).toBe(Number.MAX_VALUE);

      mockUserData["user-hierarchymax"] = {
        preferences: { hierarchyDecimalPrecision: Number.MAX_VALUE }
      };
      result = await loadUserPreferences("user-hierarchymax");
      expect(result?.hierarchyDecimalPrecision).toBe(Number.MAX_VALUE);
    });
  });

  describe("saveUserPrefs", () => {
    it("should save preferences under nested preferences key", async () => {
      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.PlainFill,
        easelDecimalPrecision: 5,
        hierarchyDecimalPrecision: 4
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          defaultFill: FillStyle.PlainFill,
          easelDecimalPrecision: 5,
          hierarchyDecimalPrecision: 4
        }
      });
    });

    it("should merge preferences with existing user data", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        favoriteTools: "#"
      };

      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.ShadeFill,
        easelDecimalPrecision: 4,
        hierarchyDecimalPrecision: 5
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        displayName: "Test User",
        favoriteTools: "#",
        preferences: {
          defaultFill: FillStyle.ShadeFill,
          easelDecimalPrecision: 4,
          hierarchyDecimalPrecision: 5
        }
      });
    });

    it("should not save undefined values", async () => {
      await saveUserPreferences("test-user", {
        defaultFill: undefined
      });

      const data = mockUserData["test-user"];
      expect(data).toBeUndefined();
    });

    it("should save null values", async () => {
      await saveUserPreferences("test-user", {
        defaultFill: null
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          defaultFill: null
        }
      });
    });

    it("should not call setDoc when all values are undefined", async () => {
      vi.clearAllMocks();

      await saveUserPreferences("test-user", {
        defaultFill: undefined,
        easelDecimalPrecision: undefined,
        hierarchyDecimalPrecision: undefined
      });

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("should update existing preferences without overwriting", async () => {
      // Set initial preferences with other fields
      mockUserData["test-user"] = {
        displayName: "Test User",
        preferences: {
          defaultFill: FillStyle.NoFill
        }
      };

      // Update only defaultFill
      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.PlainFill
      });

      const data = mockUserData["test-user"];
      expect(data.preferences.defaultFill).toBe(FillStyle.PlainFill);
      expect(data.displayName).toBe("Test User");
    });
  });
});

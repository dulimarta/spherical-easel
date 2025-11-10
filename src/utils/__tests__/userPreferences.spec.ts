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
    const existing = mockUserData[docRef.uid] || {};
    mockUserData[docRef.uid] = {
      ...existing,
      ...data
    };
    // Deep merge for preferences
    if (data.preferences && existing.preferences) {
      mockUserData[docRef.uid].preferences = {
        ...existing.preferences,
        ...data.preferences
      };
    }
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
          defaultFill: FillStyle.PlainFill
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result).toEqual({
        defaultFill: FillStyle.PlainFill
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

    it("should load notification levels from preferences", async () => {
      mockUserData["test-user"] = {
        preferences: {
          notificationLevels: ["success", "error"]
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result?.notificationLevels).toEqual(["success", "error"]);
    });

    it("should load empty notification levels array", async () => {
      mockUserData["test-user"] = {
        preferences: {
          notificationLevels: []
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result?.notificationLevels).toEqual([]);
    });

    it("should load both defaultFill and notificationLevels", async () => {
      mockUserData["test-user"] = {
        preferences: {
          defaultFill: FillStyle.PlainFill,
          notificationLevels: ["info", "warning"]
        }
      };

      const result = await loadUserPreferences("test-user");
      expect(result).toEqual({
        defaultFill: FillStyle.PlainFill,
        notificationLevels: ["info", "warning"]
      });
    });
  });

  describe("saveUserPrefs", () => {
    it("should save preferences under nested preferences key", async () => {
      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.PlainFill
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          defaultFill: FillStyle.PlainFill
        }
      });
    });

    it("should merge preferences with existing user data", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        favoriteTools: "#"
      };

      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.ShadeFill
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        displayName: "Test User",
        favoriteTools: "#",
        preferences: {
          defaultFill: FillStyle.ShadeFill
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
        defaultFill: undefined
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

    it("should save notification levels", async () => {
      await saveUserPreferences("test-user", {
        notificationLevels: ["success", "error"]
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          notificationLevels: ["success", "error"]
        }
      });
    });

    it("should save empty notification levels array", async () => {
      await saveUserPreferences("test-user", {
        notificationLevels: []
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          notificationLevels: []
        }
      });
    });

    it("should save both defaultFill and notificationLevels", async () => {
      await saveUserPreferences("test-user", {
        defaultFill: FillStyle.PlainFill,
        notificationLevels: ["info", "warning"]
      });

      const data = mockUserData["test-user"];
      expect(data).toEqual({
        preferences: {
          defaultFill: FillStyle.PlainFill,
          notificationLevels: ["info", "warning"]
        }
      });
    });

    it("should update notification levels without overwriting other preferences", async () => {
      mockUserData["test-user"] = {
        displayName: "Test User",
        preferences: {
          defaultFill: FillStyle.ShadeFill,
          notificationLevels: ["success", "info", "error", "warning"]
        }
      };

      await saveUserPreferences("test-user", {
        notificationLevels: ["error", "warning"]
      });

      const data = mockUserData["test-user"];
      expect(data.preferences.defaultFill).toBe(FillStyle.ShadeFill);
      expect(data.preferences.notificationLevels).toEqual(["error", "warning"]);
      expect(data.displayName).toBe("Test User");
    });
  });
});

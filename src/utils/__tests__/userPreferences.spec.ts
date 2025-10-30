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
  });
});

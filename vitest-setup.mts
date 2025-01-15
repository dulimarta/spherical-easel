import bahasa from "./src/i18n"
import { config } from "@vue/test-utils"
import { vi, expect } from "vitest"

// This import solve the following error:
// Error: Not implemented: HTMLCanvasElement.prototype.getContext
import "vitest-canvas-mock"
import "./src/extensions/three-extensions"
import "./src/extensions/se-nodule-extensions"
import { Vector3 } from "three"
if (!globalThis.defined) {
  config.global.plugins = [bahasa]
  globalThis.defined = true
}

vi.mock("firebase/auth", async orig => {
  const z = (await orig()) as object;
  console.debug("Mocking Firebase Auth functions");
  return {
    ...z,
    getAuth: vi.fn(() => {
      console.debug("Inside mocked getAuth")
      return {
        onAuthStateChanged: vi.fn()
      }
    })
  };
});

vi.mock("firebase/firestore", async orig => {
  const z = (await orig()) as object;

  console.debug("What is this?", z);
  return {
    ...z,
    getFirestore: vi.fn().mockReturnThis(),
    collection: vi.fn(),
    getDocs: vi.fn().mockImplementation(() => {
      console.debug("vitest-setup.mts: Inside mocked getDocs()");
      return {
        docs: []
      };
    })
  };
});

expect.extend({
  toBeVector3CloseTo(received: Vector3, expected: Vector3, precision: number) {
    return {
      pass: true,
      message: () => ''
    }
  }
})
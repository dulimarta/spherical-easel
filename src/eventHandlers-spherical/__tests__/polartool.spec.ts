import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";

import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { SENodule } from "@/models/SENodule";
import Handler from "../PolarObjectHandler";
import { Command } from "@/commands-spherical/Command";

import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere
} from "./sphereframe-helper";

describe("Polar Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  beforeEach(async () => {
    vi.clearAllMocks();
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    wrapper = out.wrapper;
    SEStore = useSEStore(testPinia);
    SENodule.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });

  it.each([{ refPt: "fg" }, { refPt: "bg" }])(
    "adds a new $refPt point and its conjugate line when clicking on sphere while using PolarTool",
    async ({ refPt }) => {
      SEStore.setActionMode("polar");
      await wrapper.vm.$nextTick();
      const prevPointCount = SEStore.sePoints.length;
      const prevLineCount = SEStore.seLines.length;
      await mouseClickOnSphere(
        wrapper,
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        refPt === "bg"
      );
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(
        prevPointCount + 1
      );
      expect(SEStore.seLines.length).toBe(prevLineCount + 1);

      // The most recent two points must be antipodal pairs
      const aPoint = SEStore.sePoints[prevPointCount];
      const conjLine = SEStore.seLines[prevLineCount];

      // Verify correct normal vector of the line
      expect(aPoint.locationVector.x).toBeCloseTo(conjLine.normalVector.x, 4);
      expect(aPoint.locationVector.y).toBeCloseTo(conjLine.normalVector.y, 4);
      expect(aPoint.locationVector.z).toBeCloseTo(conjLine.normalVector.z, 4);
    }
  );
});

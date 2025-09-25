import { vi } from "vitest";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { useSEStore, SEStoreType } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { TEST_MOUSE_X, TEST_MOUSE_Y, dragMouse } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SESegment } from "@/models/SESegment";
import { Vector3 } from "three";
import { createTestingPinia } from "@pinia/testing";
import Handler from "../SegmentHandler";
import { SENodule } from "@/models/dontuse-internal";
import { Command } from "@/commands-spherical/Command";

describe("Segment Tool", () => {
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
    SEStore = useSEStore(testPinia);
    SENodule.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });

  async function runSegmentTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
    const endX = TEST_MOUSE_X + 20;
    const endY = TEST_MOUSE_Y - 30;
    const prevSegmentCount = SEStore.seSegments.length;
    await dragMouse(
      wrapper,
      TEST_MOUSE_X,
      TEST_MOUSE_Y,
      !isPoint1Foreground,
      endX,
      endY,
      !isPoint2Foreground
    );
    // await wrapper.vm.$nextTick();
    const newSegmentCount = SEStore.seSegments.length;
    console.debug("Segment count", prevSegmentCount, newSegmentCount);
    // expect(newSegmentCount).toBe(prevSegmentCount+1);
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord =
      Math.sqrt(
        R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
      ) * (isPoint1Foreground ? +1 : -1);
    const endZCoord =
      Math.sqrt(R * R - endX * endX - endY * endY) *
      (isPoint2Foreground ? +1 : -1);
    const newSegment: SESegment = SEStore.seSegments[prevSegmentCount];
    // Start vector
    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      startZCoord
    ).normalize();
    // End vector
    const endVector = new Vector3(endX, -endY, endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    const startPt = newSegment.startSEPoint;
    expect(startPt.locationVector.x).toBeCloseTo(startVector.x, 3);
    expect(startPt.locationVector.y).toBeCloseTo(startVector.y, 3);
    expect(startPt.locationVector.z).toBeCloseTo(startVector.z, 3);
    const endPt = newSegment.endSEPoint;
    expect(endPt.locationVector.x).toBeCloseTo(endVector.x, 3);
    expect(endPt.locationVector.y).toBeCloseTo(endVector.y, 3);
    expect(endPt.locationVector.z).toBeCloseTo(endVector.z, 3);
    expect(newSegment.normalVector.x).toBeCloseTo(dir.x, 3);
    expect(newSegment.normalVector.y).toBeCloseTo(dir.y, 3);
    expect(newSegment.normalVector.z).toBeCloseTo(dir.z, 3);
  }

  it("adds a new segment while in SegmentTool", async () => {
    SEStore.setActionMode("segment");
    await wrapper.vm.$nextTick();
    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        // SEStore.init();
        await runSegmentTest(pt1, pt2);
      }
  });
});

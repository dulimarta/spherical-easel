import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { TEST_MOUSE_X, TEST_MOUSE_Y, dragMouse } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SESegment } from "@/models/SESegment";
import { Vector3 } from "three";

describe("SphereFrame: Segment Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  async function runSegmentTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
    SEStore.setActionMode({
      id: "segment",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
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
    expect(newSegmentCount).toBe(prevSegmentCount + 1);
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
    expect(newSegment.startSEPoint.locationVector).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newSegment.endSEPoint.locationVector).toBeVector3CloseTo(
      endVector,
      3
    );
    expect(newSegment.normalVector).toBeVector3CloseTo(dir, 3);
  }

  it("adds a new segment while in SegmentTool", async () => {
    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await runSegmentTest(pt1, pt2);
      }
    await runSegmentTest(true, true);
  });
});

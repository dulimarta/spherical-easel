import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { TEST_MOUSE_X, TEST_MOUSE_Y, dragMouse } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SECircle } from "@/models/SECircle";
import { Vector3 } from "three";

describe("SphereFrame: Circle Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  async function runCircleTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
    SEStore.setActionMode({
      id: "circle",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    const prevCircleCount = SEStore.seCircles.length;
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
    const newCircleCount = SEStore.seCircles.length;
    expect(newCircleCount).toBe(prevCircleCount + 1);
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord =
      Math.sqrt(
        R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
      ) * (isPoint1Foreground ? +1 : -1);
    const endZCoord =
      Math.sqrt(R * R - endX * endX - endY * endY) *
      (isPoint2Foreground ? +1 : -1);
    const newCircle: SECircle = SEStore.seCircles[prevCircleCount];
    // Center vector is foreground
    const centerVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      startZCoord
    ).normalize();
    // Radius vector is foreground
    const radiusVector = new Vector3(endX, -endY, endZCoord).normalize();
    expect(newCircle.centerSEPoint.locationVector).toBeVector3CloseTo(
      centerVector,
      3
    );
    expect(newCircle.circleSEPoint.locationVector).toBeVector3CloseTo(
      radiusVector,
      3
    );
  }
  it("adds a new circle while in CircleTool", async () => {
    for (const center of [true, false])
      for (const boundaryPt of [true, false]) {
        SEStore.init();
        await runCircleTest(center, boundaryPt);
      }
  });
});

import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere
} from "./sphereframe-helper";

describe("SphereFrame: Polar Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  async function runPolarTest(isForeground: boolean) {
    SEStore.setActionMode({
      id: "polar",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const prevPointCount = SEStore.sePoints.length;
    const prevLineCount = SEStore.seLines.length;
    await mouseClickOnSphere(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
    expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
    expect(SEStore.seLines.length).toBe(prevLineCount + 1);

    // The most recent two points must be antipodal pairs
    const aPoint = SEStore.sePoints[prevPointCount];
    const conjLine = SEStore.seLines[prevLineCount];

    // Verify correct normal vector of the line
    expect(aPoint.locationVector).toBeVector3CloseTo(conjLine.normalVector, 5);
  }
  it("adds a new point and its conjugate line when clicking on sphere while using PolarTool", async () => {
    for (const pt of [false, true]) {
      SEStore.init();
      await runPolarTest(pt);
    }
  });
});

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

describe("SphereFrame: Antipode Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });
  async function runAntipodeTest(isForeground: boolean) {
    const prevPointCount = SEStore.sePoints.length;
    await mouseClickOnSphere(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
    expect(SEStore.sePoints.length).toBe(prevPointCount + 2);

    // The most recent two points must be antipodal pairs
    const a = SEStore.sePoints[prevPointCount];
    const b = SEStore.sePoints[prevPointCount + 1];

    // Verify correct antipodal point location
    expect(a.locationVector.x).toBe(-b.locationVector.x);
    expect(a.locationVector.y).toBe(-b.locationVector.y);
    expect(a.locationVector.z).toBe(-b.locationVector.z);
  }
  beforeEach(async () => {
    SEStore.setActionMode({
      id: "antipodalPoint",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
  });

  it("adds a new point and its antipodal when clicking on sphere while using PointTool", async () => {
    for (const pt of [true, false]) await runAntipodeTest(pt);
  });
});

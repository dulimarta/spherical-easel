import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { makePoint } from "./sphereframe-helper";

describe("SphereFrame: Point Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
    // console.debug("Wrapper", wrapper.vm);
    SEStore.setActionMode({
      id: "point",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
  });

  it("adds a new point when clicking on sphere while using PointTool", async () => {
    for (const pt of [true, false]) {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(wrapper, pt);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      if (!pt) expect(p.locationVector.z).toBeGreaterThan(0);
      else expect(p.locationVector.z).toBeLessThan(0);
    }
  });
});

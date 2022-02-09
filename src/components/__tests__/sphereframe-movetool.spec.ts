import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { makePoint } from "./sphereframe-helper";
import {
    TEST_MOUSE_X, TEST_MOUSE_Y,
    drawPointAt, dragMouse,
  } from "./sphereframe-helper";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Move Tool", () => {
    let wrapper: Wrapper<Vue>;
    beforeEach(async () => {
      wrapper = createWrapper(SphereFrame);
      await wrapper.vm.$nextTick();
      SEStore.init();
    });

    async function movePointTest(
      startIsBackground: boolean,
      endIsBackground: boolean
    ): Promise<void> {
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      // create a point
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(wrapper, startIsBackground); // makes point at (111, 137)
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(p.showing).toBe(true);
      if (!startIsBackground) expect(p.locationVector.z).toBeGreaterThan(0);
      else expect(p.locationVector.z).toBeLessThan(0);
      const initialLoc = new Vector3(p.locationVector.x, p.locationVector.y, p.locationVector.z); // initial: (x = 0.444, y = 0.548, z = -0.7089146634116127)
      SEStore.setActionMode({
          id: "move",
          name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      await dragMouse(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, startIsBackground, endX, endY, endIsBackground);
      await wrapper.vm.$nextTick();
      expect(p.locationVector).not.toEqual(initialLoc);
    }

    it("moves a point on the sphere in Move mode", async () => {
      for (const pt1 of [true, false])
        for (const pt2 of [true, false]) {
          SEStore.init();
          await movePointTest(pt1, pt2);
      }
    });
  });

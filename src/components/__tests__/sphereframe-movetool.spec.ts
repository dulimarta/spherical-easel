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
      // console.debug("Wrapper", wrapper.vm);
    //   SEStore.setActionMode({
    //     id: "move",
    //     name: "Tool Name does not matter"
    //   });
      await wrapper.vm.$nextTick();
      SEStore.init();
    });

    it("moves a point on the sphere in Move mode", async () => {
        // create a point (foreground)
        const prevPointCount = SEStore.sePoints.length;
        const p = await makePoint(wrapper, true); // makes point at (111, 137)
        //await drawPointAt(wrapper, 111, 137, true);
        expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
        expect(p.showing).toBe(true);
        expect(p.locationVector.z).toBeLessThan(0);
        const initialLoc = new Vector3(p.locationVector.x, p.locationVector.y, p.locationVector.z); // initial: (x = 0.444, y = 0.548, z = -0.7089146634116127)
        SEStore.setActionMode({
            id: "move",
            name: "Tool Name does not matter"
        });
        await wrapper.vm.$nextTick();
        const endX = TEST_MOUSE_X + 10;
        const endY = TEST_MOUSE_Y - 10;
        await dragMouse(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, false, endX, endY, false);
        await wrapper.vm.$nextTick();
        expect(p.locationVector).not.toEqual(initialLoc);
    });
  });

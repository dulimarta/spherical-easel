// import Vue from "*.vue";
import SphereFrame from "../../components/SphereFrame.vue";
import { createWrapper } from "../../../tests/vue-helper";
import { SEStoreType, useSEStore } from "../../stores/se";
import { VueWrapper } from "@vue/test-utils";
import { vi } from "vitest";
import { mockedStore } from "../../../tests/mock-utils";
import Handler from "../../eventHandlers/AntipodalPointHandler"
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere
} from "./sphereframe-helper"
import { createTestingPinia } from "@pinia/testing";
import MouseHandler from "../../eventHandlers/MouseHandler";
import { SENodule } from "../../models/internal";
import {Command} from "../../commands/Command"
import { useMousePressed } from "@vueuse/core";

describe("SphereFrame: Antipode Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore;
  beforeEach(async () => {
    // Pinia instance MUST be created before mount() is called
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    // DO NOT initialize the store BEFORE calling createWrapper!!!
    SEStore = mockedStore(useSEStore);
    SEStore.init()
    SENodule.setGlobalStore(SEStore)
    Command.setGlobalStore(SEStore)
    MouseHandler.setGlobalStore(SEStore);

    wrapper = out.wrapper;
    await wrapper.vm.$nextTick();
  });
  async function runAntipodeTest(isForeground: boolean) {
    const prevPointCount = SEStore.sePoints.length;
    // console.debug("Number of points before", prevPointCount)
    await mouseClickOnSphere(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
    const currPointCount = SEStore.sePoints.length;
    // console.debug("Number of points after", currPointCount)
    expect(currPointCount).toBe(prevPointCount + 2);

    // // The most recent two points must be antipodal pairs
    const a = SEStore.sePoints[prevPointCount];
    const b = SEStore.sePoints[prevPointCount + 1];

    // // Verify correct antipodal point location
    expect(a.locationVector.x).toBe(-b.locationVector.x);
    expect(a.locationVector.y).toBe(-b.locationVector.y);
    expect(a.locationVector.z).toBe(-b.locationVector.z);
  }

  it("adds a new point and its antipodal when clicking on sphere while using PointTool", async () => {
    const pressSpy = vi.spyOn(Handler.prototype, "mousePressed")
    const moveSpy = vi.spyOn(Handler.prototype, "mouseMoved")
    const releaseSpy = vi.spyOn(Handler.prototype, "mouseReleased")
    SEStore.setActionMode("antipodalPoint");
    await wrapper.vm.$nextTick(); // Wait for VueJS internal update cycle
    for (const pt of [true, false]) await runAntipodeTest(pt);
    expect(pressSpy).toHaveBeenCalledTimes(2)
    expect(moveSpy).toHaveBeenCalledTimes(2)
    expect(releaseSpy).toHaveBeenCalledTimes(2)
  });
});

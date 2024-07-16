// import Vue from "*.vue";
import SphereFrame from "../../components/SphereFrame.vue";
import { createWrapper } from "../../../tests/vue-helper";
import { SEStoreType, useSEStore } from "../../stores/se";
import { VueWrapper } from "@vue/test-utils";
import { vi } from "vitest";
import { mockedStore } from "../../../tests/mock-utils";

import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere
} from "./sphereframe-helper";
import { createTestingPinia } from "@pinia/testing";
import MouseHandler from "../../eventHandlers/MouseHandler";
import { SENodule } from "../../models/internal";
import {Command} from "../../commands/Command"

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
    SEStore = useSEStore(testPinia);
    SENodule.setGlobalStore(SEStore)
    Command.setGlobalStore(SEStore)
    MouseHandler.setGlobalStore(SEStore);

    wrapper = out.wrapper;
    await wrapper.vm.$nextTick();
  });
  async function runAntipodeTest(isForeground: boolean) {
    const prevPointCount = SEStore.sePoints.length;
    await mouseClickOnSphere(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
    // expect(SEStore.sePoints.length).toBe(prevPointCount + 2);

    // // The most recent two points must be antipodal pairs
    // const a = SEStore.sePoints[prevPointCount];
    // const b = SEStore.sePoints[prevPointCount + 1];

    // // Verify correct antipodal point location
    // expect(a.locationVector.x).toBe(-b.locationVector.x);
    // expect(a.locationVector.y).toBe(-b.locationVector.y);
    // expect(a.locationVector.z).toBe(-b.locationVector.z);
  }

  it("adds a new point and its antipodal when clicking on sphere while using PointTool", async () => {
    SEStore.setActionMode("antipodalPoint");
    await wrapper.vm.$nextTick();
    for (const pt of [true, false]) await runAntipodeTest(pt);
  });
});

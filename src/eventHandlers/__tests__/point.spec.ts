// import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper"
import { SEStoreType, useSEStore } from "@/stores/se";
import {useAccountStore} from "@/stores/account"
import { VueWrapper } from "@vue/test-utils";
import { vi } from "vitest";
import { mockedStore } from "$/mock-utils";
import Handler from "../PointHandler"
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  makePoint,
  mouseClickOnSphere
} from "./sphereframe-helper"
import { createTestingPinia } from "@pinia/testing";
import MouseHandler from "../Highlighter";
import {Command} from "@/commands/Command"
import { SENodule } from "@/models/SENodule";

describe("Point Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore:SEStoreType;
  beforeEach(async () => {
    vi.clearAllMocks() // Reset spy counters etc.
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
    SEStore = useSEStore(testPinia)
    useAccountStore(testPinia)
    SEStore.init()
    SENodule.setGlobalStore(SEStore)
    Command.setGlobalStore(SEStore)
    MouseHandler.setGlobalStore(SEStore);

    wrapper = out.wrapper;
    SEStore.setActionMode("select")
    await wrapper.vm.$nextTick();
  });
  async function runTest(isForeground: boolean) {
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

  it ("adds new points in foreground/background hemisphere", async () => {
    SEStore.setActionMode("point")
    await wrapper.vm.$nextTick()
    for (const pt of [true, false]) {
      const prevPointCount = SEStore.sePoints.length
      const p = await makePoint(wrapper, SEStore, pt)
      const currPointCount = SEStore.sePoints.length
      expect(currPointCount).toBeGreaterThan(prevPointCount)
      if (pt) expect(p.locationVector.z).toBeGreaterThan(0)
      else expect(p.locationVector.z).toBeLessThan(0)
    }
  })
  it ("creates label for new points", async () => {
    SEStore.setActionMode("point")
    await wrapper.vm.$nextTick()
    for (const pt of [true, false]) {
      const p = await makePoint(wrapper, SEStore, pt)
      expect(p.getLabel()).toBeDefined()
      expect(p.name).toMatch(/P[0-9]+/)
    }
  })
});

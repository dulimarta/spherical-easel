import SphereFrame from "../../components/SphereFrame.vue";
import { vi } from "vitest";
import { createWrapper } from "../../../tests/vue-helper";
import { SEStoreType, useSEStore } from "../../stores/se";
import { VueWrapper } from "@vue/test-utils";
import { TEST_MOUSE_X, TEST_MOUSE_Y, dragMouse } from "./sphereframe-helper";
import SETTINGS from "../../global-settings";
import { SECircle } from "../../models/SECircle";
import { Vector3 } from "three";
import { createTestingPinia } from "@pinia/testing";
import { SENodule } from "../../models/SENodule";
import Handler from "../CircleHandler";
import { Command } from "../../commands/Command";
describe("Circle Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  beforeEach(async () => {
    vi.clearAllMocks();
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    wrapper = out.wrapper;
    SEStore = useSEStore(testPinia);
    SENodule.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });

  async function runCircleTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
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
    const ctrPtVec = newCircle.centerSEPoint.locationVector;
    expect(ctrPtVec.x).toBeCloseTo(centerVector.x, 2);
    expect(ctrPtVec.y).toBeCloseTo(centerVector.y, 2);
    expect(ctrPtVec.z).toBeCloseTo(centerVector.z, 2);
    const circPtVec = newCircle.circleSEPoint.locationVector;
    expect(circPtVec.x).toBeCloseTo(radiusVector.x, 3);
    expect(circPtVec.y).toBeCloseTo(radiusVector.y, 3);
    expect(circPtVec.z).toBeCloseTo(radiusVector.z, 3);
  }
  it("adds a new circle while in CircleTool", async () => {
    SEStore.setActionMode("circle");
    await wrapper.vm.$nextTick();
    for (const center of [true, false])
      for (const boundaryPt of [true, false]) {
        // SEStore.init();
        await runCircleTest(center, boundaryPt);
      }
  });
});

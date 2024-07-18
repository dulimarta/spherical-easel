import SphereFrame from "../../components/SphereFrame.vue";
import { vi } from "vitest";
import { createWrapper } from "../../../tests/vue-helper";
import { SEStoreType, useSEStore } from "../../stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  dragMouse,
  drawThreePointCircle
} from "./sphereframe-helper";
import SETTINGS from "../../global-settings";
import { SECircle } from "../../models/SECircle";
import { Vector3 } from "three";
import { createTestingPinia } from "@pinia/testing";
import { SENodule } from "../../models/SENodule";
import Handler from "../CircleHandler";
import { Command } from "../../commands/Command";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Three Point Circle Tool", () => {
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
  // The process was first completed in spherical easel and then I used the coordinate measuring tool to find the locations of all points and click locations (use point on object)
  async function runThreePointCircleTest(
    point1Foreground: boolean,
    point2Foreground: boolean,
    point3Foreground: boolean
  ): Promise<void> {}

  it.each([
    { pt1: "fg", pt2: "fg", pt3: "fg" },
    { pt1: "fg", pt2: "fg", pt3: "bg" },
    { pt1: "fg", pt2: "bg", pt3: "fg" },
    { pt1: "fg", pt2: "bg", pt3: "bg" },
    { pt1: "bg", pt2: "fg", pt3: "fg" },
    { pt1: "bg", pt2: "fg", pt3: "bg" },
    { pt1: "bg", pt2: "bg", pt3: "fg" },
    { pt1: "bg", pt2: "bg", pt3: "bg" },
  ])(
    "adds a new circle while using ThreePointCircleTool",
    async ({ pt1, pt2, pt3 }) => {
      const prevCircleCount = SEStore.seCircles.length;
      SEStore.setActionMode("threePointCircle");
      await drawThreePointCircle(
        wrapper,
        101,
        87,
        pt1 === "fg",
        200,
        113,
        pt2 === "fg",
        150,
        190,
        pt3 === "fg"
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
    }
  );

  it("checks the location (and existence) of the center of a three point circle", async () => {
    const prevPointCount = SEStore.sePoints.length;
    await drawThreePointCircle(
      wrapper,
      -0.357 * R,
      0.283 * R,
      true,
      0.398 * R,
      0.535 * R,
      true,
      0.456 * R,
      -0.115 * R,
      true
    );
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 4);
    const centerLocation = new Vector3(0.115, 0.215, 0.97);
    const testVec =
      SEStore.sePoints[SEStore.sePoints.length - 1].locationVector;
    const ctrVec = centerLocation.multiplyScalar(R);
    expect(testVec.x).toBeCloseTo(ctrVec.x, 3);
    expect(testVec.y).toBeCloseTo(ctrVec.y, 3);
    expect(testVec.z).toBeCloseTo(ctrVec.z, 3);
  });
});

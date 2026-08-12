import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";

import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  dragMouse,
  drawOneDimensional,
  makePoint
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings-spherical";
import { SEExpression } from "@/models-spherical/SEExpression";
import { SENodule } from "@/models-spherical/SENodule";
import { SEPoint } from "@/models-spherical/SEPoint";
import { Command } from "@/commands-spherical/Command";
import { Vector3 } from "three";
import Handler from "../SegmentLengthHandler";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Move Tool", () => {
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
    SEStore = useSEStore(testPinia);
    // useAccountStore(testPinia)
    SEStore.init();
    SENodule.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
  });

  async function movePointTest(
    startIsBackground: boolean,
    endIsBackground: boolean
  ): Promise<void> {
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    // Create a point (at 111, 137)
    const prevPointCount = SEStore.sePoints.length;
    const p = await makePoint(wrapper, SEStore, startIsBackground);
    expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(prevPointCount + 1);
    expect(p.exists).toBe(true);
    if (!startIsBackground) expect(p.locationVector.z).toBeGreaterThan(0);
    else expect(p.locationVector.z).toBeLessThan(0);
    const initialLoc = new Vector3(
      p.locationVector.x,
      p.locationVector.y,
      p.locationVector.z
    ); // initial: (x = 0.444, y = 0.548, z = -0.7089146634116127)
    SEStore.setActionMode("move");
    await wrapper.vm.$nextTick();
    await dragMouse(
      wrapper,
      TEST_MOUSE_X,
      TEST_MOUSE_Y,
      startIsBackground,
      endX,
      endY,
      endIsBackground
    );
    await wrapper.vm.$nextTick();
    expect(p.locationVector).not.toEqual(initialLoc);
  }

  it("moves a point in Move mode", async () => {
    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await movePointTest(pt1, pt2);
      }
  });

  it("moves a line in Move mode", async () => {
    // (1) Create a line
    const prevLineCount = SEStore.seLines.length;
    SEStore.setActionMode("line");
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
    const aLine = SEStore.seLines[prevLineCount];

    // (2) Move the line
    SEStore.setActionMode("move");
    await wrapper.vm.$nextTick();
    const line = aLine.closestVector(new Vector3(0, 0, 1));
    const startPos = new Vector3(line.x, line.y, line.z);
    await dragMouse(
      wrapper,
      startPos.x * R,
      startPos.y * R,
      true,
      startPos.x * R + 10,
      startPos.y * R + 10,
      startPos.z < 0
    );
    await wrapper.vm.$nextTick();
    const endPos = new Vector3(line.x, line.y, line.z);
    expect(endPos).not.toEqual(startPos);
  });

  it("moves a line segment in Move mode", async () => {
    // (1) Create a line segment
    const prevSegmentCount = SEStore.seSegments.length;
    SEStore.setActionMode("segment");
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
    const aSegment = SEStore.seSegments[prevSegmentCount];

    // (2) Move the segment
    SEStore.setActionMode("move");
    await wrapper.vm.$nextTick();
    const segment = aSegment.closestVector(new Vector3(0, 0, 1));
    const startPos = new Vector3(segment.x, segment.y, segment.z);
    await dragMouse(
      wrapper,
      startPos.x * R,
      startPos.y * R,
      true,
      startPos.x * R + 10,
      startPos.y * R + 10,
      startPos.z < 0
    );
    await wrapper.vm.$nextTick();
    const endPos = new Vector3(segment.x, segment.y, segment.z);
    expect(endPos).not.toEqual(startPos);
  });

  it("moves a circle in Move mode", async () => {
    // (1) Create a circle
    const prevCircleCount = SEStore.seCircles.length;
    SEStore.setActionMode("circle");
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
    const aCircle = SEStore.seCircles[prevCircleCount];

    // (2) Move the circle
    SEStore.setActionMode("move");
    await wrapper.vm.$nextTick();
    const circle = aCircle.closestVector(new Vector3(0, 0, 1));
    const startPos = new Vector3(circle.x, circle.y, circle.z);
    await dragMouse(
      wrapper,
      startPos.x * R,
      startPos.y * R,
      true,
      startPos.x * R + 10,
      startPos.y * R + 10,
      startPos.z < 0
    );
    await wrapper.vm.$nextTick();
    const endPos = new Vector3(circle.x, circle.y, circle.z);
    expect(endPos).not.toEqual(startPos);
  });
});

import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { vi } from "vitest";
import { SELine } from "@/models/SELine";
import { VueWrapper } from "@vue/test-utils";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  drawOneDimensional
} from "./sphereframe-helper";
import { SENodule } from "@/models/SENodule";
import { createTestingPinia } from "@pinia/testing";
import { Command } from "@/commands-spherical/Command";
import Handler from "../LineHandler";
import MouseHandler from "../MouseHandler";

describe("Line Tool", () => {
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
    MouseHandler.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });

  async function runLineTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    const prevLineCount = SEStore.seLines.length;
    SEStore.setActionMode("line");
    await wrapper.vm.$nextTick();
    await drawOneDimensional(
      wrapper,
      TEST_MOUSE_X,
      TEST_MOUSE_Y,
      isPoint1Foreground,
      endX,
      endY,
      isPoint2Foreground
    );
    const newLineCount = SEStore.seLines.length;
    expect(newLineCount).toBe(prevLineCount + 1);
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord =
      Math.sqrt(
        R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
      ) * (isPoint1Foreground ? +1 : -1);
    const endZCoord =
      Math.sqrt(R * R - endX * endX - endY * endY) *
      (isPoint2Foreground ? +1 : -1);
    const newLine: SELine = SEStore.seLines[prevLineCount];
    // Start vector
    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y, // Must flip the Y coordinate
      startZCoord
    ).normalize();
    // End vector is foreground
    const endVector = new Vector3(endX, -endY, endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    expect(newLine.startSEPoint.locationVector.x).toBeCloseTo(startVector.x, 3);
    expect(newLine.startSEPoint.locationVector.y).toBeCloseTo(startVector.y, 3);
    expect(newLine.startSEPoint.locationVector.z).toBeCloseTo(startVector.z, 3);
    expect(newLine.endSEPoint.locationVector.x).toBeCloseTo(endVector.x, 3);
    expect(newLine.endSEPoint.locationVector.y).toBeCloseTo(endVector.y, 3);
    expect(newLine.endSEPoint.locationVector.z).toBeCloseTo(endVector.z, 3);
    expect(newLine.normalVector.x).toBeCloseTo(dir.x, 3);
    expect(newLine.normalVector.y).toBeCloseTo(dir.y, 3);
    expect(newLine.normalVector.z).toBeCloseTo(dir.z, 3);
    // // line points are properly labelled
    // expect(newLine.startSEPoint.label?.exists).toBe(true);
    // expect(newLine.startSEPoint.name).toBe("P" + (SEStore.sePoints.length - 1));
    // expect(newLine.endSEPoint.label?.exists).toBe(true);
    // expect(newLine.endSEPoint.name).toBe("P" + SEStore.sePoints.length);
  }

  it("adds a new line while in LineTool", async () => {
    const pressSpy = vi.spyOn(Handler.prototype, "mousePressed");
    const moveSpy = vi.spyOn(Handler.prototype, "mouseMoved");
    const releaseSpy = vi.spyOn(Handler.prototype, "mouseReleased");
    SEStore.setActionMode("line");

    let counter = 0;
    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        // SEStore.init();
        // SENodule.resetAllCounters();
        await runLineTest(pt1, pt2);
        counter++;
        expect(pressSpy).toHaveBeenCalledTimes(counter);
        expect(releaseSpy).toHaveBeenCalledTimes(counter);
      }
  });

  // TODO change style of line and check if correct
});

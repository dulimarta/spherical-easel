import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { SELine } from "@/models/SELine";
import { Wrapper } from "@vue/test-utils";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  drawOneDimensional
} from "./sphereframe-helper";
describe("SphereFrame: Line Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  async function runLineTest(
    isPoint1Foreground: boolean,
    isPoint2Foreground: boolean
  ): Promise<void> {
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    const prevLineCount = SEStore.seLines.length;
    await drawOneDimensional(
      wrapper,
      "line",
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
    expect(newLine.startSEPoint.locationVector).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newLine.endSEPoint.locationVector).toBeVector3CloseTo(endVector, 3);
    expect(newLine.normalVector).toBeVector3CloseTo(dir, 3);
  }

  it("adds a new line while in LineTool", async () => {
    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await runLineTest(pt1, pt2);
      }
  });
});

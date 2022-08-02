import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { drawThreePointCircle } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Three Point Circle Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });
  // The process was first completed in spherical easel and then I used the coordinate measuring tool to find the locations of all points and click locations (use point on object)
  async function runThreePointCircleTest(
    point1Foreground: boolean,
    point2Foreground: boolean,
    point3Foreground: boolean
  ): Promise<void> {
    const prevCircleCount = SEStore.seCircles.length;
    await drawThreePointCircle(
      wrapper,
      101,
      87,
      point1Foreground,
      200,
      113,
      point2Foreground,
      150,
      190,
      point3Foreground
    );
    expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
  }

  it("adds a new circle while using ThreePointCircleTool", async () => {
    for (const focal1 of [true, false])
      for (const focal2 of [true, false])
        for (const boundaryPt of [true, false]) {
          SEStore.init();
          await runThreePointCircleTest(focal1, focal2, boundaryPt);
        }
  });

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
    expect(
      SEStore.sePoints[SEStore.sePoints.length - 1].locationVector
    ).toBeVector3CloseTo(centerLocation.multiplyScalar(R), 3);
  });
});

import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere,
  dragMouse,
  drawOneDimensional,
  drawPointAt
} from "./sphereframe-helper";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import { Command } from "@/commands/Command";
import Handler from "../PerpendicularLineThruPointHandler";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";

describe("Point On Object Tool", () => {
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
    await wrapper.vm.$nextTick();
  });

  it.each([
    { lineStart: "fg", lineEnd: "fg" },
    { lineStart: "fg", lineEnd: "bg" },
    { lineStart: "bg", lineEnd: "fg" },
    { lineStart: "bg", lineEnd: "bg" }
  ])("adds points on a line ($lineStart,$lineEnd)", async ({ lineStart, lineEnd }) => {
    const prevLineCount = SEStore.seLines.length;
    SEStore.setActionMode("line");
    await drawOneDimensional(
      wrapper,
      100,
      79,
      lineStart === "bg",
      173,
      157,
      lineEnd === "bg"
    );
    expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
    await SEStore.setActionMode("pointOnObject");
    const aLine = SEStore.seLines[prevLineCount];
    expect(aLine.parents.length).toBeGreaterThanOrEqual(2);
    const end1 = aLine.parents[0] as SEPoint;
    const end2 = aLine.parents[1] as SEPoint;
    const R = SETTINGS.boundaryCircle.radius;
    const mid = new Vector3();
    mid.addScaledVector(end1.locationVector, 0.3);
    mid.addScaledVector(end2.locationVector, 0.7);
    const mid2D_x = mid.x * R;
    const mid2D_y = mid.y * R;
    const prevPointCount = SEStore.sePoints.length;
    await mouseClickOnSphere(wrapper, mid2D_x, mid2D_y, mid.z < 0);
    expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(prevPointCount + 1);
    expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
    const angle = mid.angleTo(aLine.normalVector);
    expect(angle.toDegrees()).toBeCloseTo(90.0, 5);
  });

  it.each([
    { segStart: "fg", segEnd: "fg" },
    { segStart: "fg", segEnd: "bg" },
    { segStart: "bg", segEnd: "fg" },
    { segStart: "bg", segEnd: "bg" }
  ])("adds points on a segment ($segStart,$segEnd)", async ({ segStart, segEnd }) => {
      const prevSegmentCount = SEStore.seSegments.length;
      SEStore.setActionMode("segment");
      await drawOneDimensional(
        wrapper,
        100,
        79,
        segStart === 'bg',
        173,
        157,
        segEnd === 'bg'
      );
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
      await SEStore.setActionMode("pointOnObject");
      const aLineSegment = SEStore.seSegments[prevSegmentCount];
      const end1 = aLineSegment.startSEPoint;
      const end2 = aLineSegment.endSEPoint;
      const R = SETTINGS.boundaryCircle.radius;
      const mid = new Vector3();
      mid.addScaledVector(end1.locationVector, 0.3);
      mid.addScaledVector(end2.locationVector, 0.7);
      const mid2D_x = mid.x * R;
      const mid2D_y = mid.y * R;
      const prevPointCount = SEStore.sePoints.length;
      await mouseClickOnSphere(wrapper, mid2D_x, mid2D_y, mid.z < 0);
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(
        prevPointCount + 1
      );
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
      const angle = mid.angleTo(aLineSegment.normalVector);
      expect(angle.toDegrees()).toBeCloseTo(90.0, 5);
  });

  it.each([
    { circCtr: "fg", circPt: "fg" },
    { circCtr: "fg", circPt: "bg" },
    { circCtr: "bg", circPt: "fg" },
    { circCtr: "bg", circPt: "bg" }
  ])("adds points on a circle ($circCtr,$circPt)", async ({circCtr, circPt}) => {
      const prevCircleCount = SEStore.seCircles.length;
      SEStore.setActionMode("circle");
      await drawOneDimensional(
        wrapper,
        100,
        79,
        circCtr === 'bg',
        173,
        157,
        circPt === 'bg'
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
      await SEStore.setActionMode("pointOnObject");
      const aCircle = SEStore.seCircles[prevCircleCount];
      // Calculate a different point on the circle
      const target = new Vector3().copy(aCircle.circleSEPoint.locationVector);
      target.applyAxisAngle(
        aCircle.centerSEPoint.locationVector,
        Math.PI * 0.1
      );
      const R = SETTINGS.boundaryCircle.radius;
      const prevPointCount = SEStore.sePoints.length;
      // console.debug(
      //   "Simulate mouse press on the sphere at",
      //   target.toFixed(3)
      // );
      await mouseClickOnSphere(
        wrapper,
        target.x * R,
        target.y * R,
        target.z < 0
      );
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(
        prevPointCount + 1
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
      // const angle = mid.angleTo(aCircle.centerSEPoint.locationVector);
      // expect(angle.toDegrees()).toBeCloseTo(90.0, 5);
  });

  // xit("adds points on an ellipse", async () => {});
});

import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { SEPoint } from "@/models/SEPoint";
import { Wrapper } from "@vue/test-utils";
import { drawOneDimensional, mouseClickOnSphere } from "./sphereframe-helper";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

describe("SphereFrame: Point On Object Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  it("adds points on a line", async () => {
    async function runPointOnLineTest(fgLinePt1: boolean, fgLinePt2: boolean) {
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
        wrapper,
        "line",
        100,
        79,
        fgLinePt1,
        173,
        157,
        fgLinePt2
      );
      expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
      await SEStore.setActionMode({
        id: "pointOnOneDim",
        name: "Tool Name does not matter"
      });
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
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(
        prevPointCount + 1
      );
      expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
      const angle = mid.angleTo(aLine.normalVector);
      expect(angle.toDegrees()).toBeCloseTo(90.0, 5);
    }

    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await runPointOnLineTest(pt1, pt2);
      }
  });

  it("adds points on a segment", async () => {
    async function runPointOnSegmentTest(
      fgLinePt1: boolean,
      fgLinePt2: boolean
    ) {
      const prevSegmentCount = SEStore.seSegments.length;
      await drawOneDimensional(
        wrapper,
        "segment",
        100,
        79,
        fgLinePt1,
        173,
        157,
        fgLinePt2
      );
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
      await SEStore.setActionMode({
        id: "pointOnOneDim",
        name: "Tool Name does not matter"
      });
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
    }

    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await runPointOnSegmentTest(pt1, pt2);
      }
  });

  it("adds points on a circle", async () => {
    async function runPointOnCircleTest(
      fgCenterPt: boolean,
      fgBoundaryPt: boolean
    ) {
      const prevCircleCount = SEStore.seCircles.length;
      await drawOneDimensional(
        wrapper,
        "circle",
        100,
        79,
        fgCenterPt,
        173,
        157,
        fgBoundaryPt
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
      await SEStore.setActionMode({
        id: "pointOnOneDim",
        name: "Tool Name does not matter"
      });
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
    }

    for (const pt1 of [true, false])
      for (const pt2 of [true, false]) {
        SEStore.init();
        await runPointOnCircleTest(pt1, pt2);
      }
  });

  xit("adds points on an ellipse", async () => {});
});

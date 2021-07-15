import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere,
  drawOneDimensional
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

describe("SphereFrame: Intersection Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  it("creates intersection points of two lines after clicking near the intersection points", async () => {
    async function runLineIntersectionTest(
      fgLine1Pt1: boolean,
      fgLine1Pt2: boolean,
      fgLine2Pt1: boolean,
      fgLine2Pt2: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "line",
        71,
        97,
        fgLine1Pt1,
        147,
        181,
        fgLine1Pt2
      );
      await drawOneDimensional(
        wrapper,
        "line",
        71,
        136,
        fgLine2Pt1,
        179,
        53,
        fgLine2Pt2
      );
      const pointCount = SEStore.sePoints.length;
      expect(pointCount).toBeGreaterThanOrEqual(6);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints[pointCount - 2];
      const x2 = SEStore.sePoints[pointCount - 1];

      // Switch tool mode to intersection
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-line creates two candidates (one foreground and one background)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1.locationVector.x * R,
        x1.locationVector.y * R,
        x1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2.locationVector.x * R,
        x2.locationVector.y * R,
        x2.locationVector.z < 0
      );

      const p1 = x1 as SEIntersectionPoint;
      expect(p1.isUserCreated).toBeTruthy();
      expect(p1.showing).toBeTruthy();
      const p2 = x2 as SEIntersectionPoint;
      expect(p2.isUserCreated).toBeTruthy();
      expect(p2.showing).toBeTruthy();
    }

    for (const l1p1 of [true, false])
      for (const l1p2 of [true, false])
        for (const l2p1 of [true, false])
          for (const l2p2 of [true, false]) {
            SEStore.init();
            await runLineIntersectionTest(l1p1, l1p2, l2p1, l2p2);
          }
  });

  xit("creates intersection points of two lines after clicking on both lines", () => {
    // TODO: complete this test case
  });
  it("creates intersection points of a line and a segment after clicking near the intersection points", async () => {
    async function runLineIntersectionTest(
      fgLinePt1: boolean,
      fgLinePt2: boolean,
      fgSegmentPt1: boolean,
      fgSegmentPt2: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "line",
        71,
        97,
        fgLinePt1,
        147,
        181,
        fgLinePt2
      );
      await drawOneDimensional(
        wrapper,
        "segment",
        71,
        136,
        fgSegmentPt1,
        179,
        53,
        fgSegmentPt2
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints[pointCount - 2];
      const x2 = SEStore.sePoints[pointCount - 1];
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1.locationVector.x * R,
        x1.locationVector.y * R,
        x1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2.locationVector.x * R,
        x2.locationVector.y * R,
        x2.locationVector.z < 0
      );
      const p1 = x1 as SEIntersectionPoint;
      const p2 = x2 as SEIntersectionPoint;
      // One of the two candidates should be the true intersection
      expect(p1.isUserCreated || p2.isUserCreated).toBeTruthy();
      expect(p1.showing || p2.showing).toBeTruthy();
    }

    for (const l1p1 of [true, false])
      for (const l1p2 of [true, false])
        for (const l2p1 of [true, false])
          for (const l2p2 of [true, false]) {
            SEStore.init();
            await runLineIntersectionTest(l1p1, l1p2, l2p1, l2p2);
          }
  });

  it("does not create intersection points of non-intersecting line and segment", async () => {
    async function runLineIntersectionTest(
      fgLinePt1: boolean,
      fgLinePt2: boolean,
      fgSegmentPt1: boolean,
      fgSegmentPt2: boolean
    ) {
      const prevPointCount = SEStore.sePoints.length;
      await drawOneDimensional(
        wrapper,
        "line",
        71,
        97,
        fgLinePt1,
        179,
        101,
        fgLinePt2
      );
      await drawOneDimensional(
        wrapper,
        "segment",
        121,
        153,
        fgSegmentPt1,
        127,
        189,
        fgSegmentPt2
      );
      const pointCount = SEStore.sePoints.length;
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints[pointCount - 2];
      const x2 = SEStore.sePoints[pointCount - 1];
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1.locationVector.x * R,
        x1.locationVector.y * R,
        x1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2.locationVector.x * R,
        x2.locationVector.y * R,
        x2.locationVector.z < 0
      );
      const p1 = x1 as SEIntersectionPoint;
      const p2 = x2 as SEIntersectionPoint;
      // None of the two candidates should be a true intersection
      expect(p1.isUserCreated && p2.isUserCreated).toBeFalsy();
      expect(p1.showing && p2.showing).toBeFalsy();
    }

    for (const l1p1 of [true, false])
      for (const l1p2 of [true, false])
        for (const l2p1 of [true, false])
          for (const l2p2 of [true, false]) {
            SEStore.init();
            await runLineIntersectionTest(l1p1, l1p2, l2p1, l2p2);
          }
  });

  it("creates intersection points of a line and a circle", async () => {
    async function runLineIntersectionTest(
      fgLinePt1: boolean,
      fgLinePt2: boolean,
      fgCircleCenter: boolean,
      fgCircleBoundary: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "line",
        71,
        97,
        fgLinePt1,
        147,
        181,
        fgLinePt2
      );
      await drawOneDimensional(
        wrapper,
        "circle",
        71,
        136,
        fgCircleCenter,
        179,
        53,
        fgCircleBoundary
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints[pointCount - 2];
      const x2 = SEStore.sePoints[pointCount - 1];
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1.locationVector.x * R,
        x1.locationVector.y * R,
        x1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2.locationVector.x * R,
        x2.locationVector.y * R,
        x2.locationVector.z < 0
      );
      const p1 = x1 as SEIntersectionPoint;
      const p2 = x2 as SEIntersectionPoint;
      // One of the two candidates should be the true intersection
      expect(p1.isUserCreated || p2.isUserCreated).toBeTruthy();
      expect(p1.showing || p2.showing).toBeTruthy();
    }

    for (const lp1 of [true, false])
      for (const lp2 of [true, false])
        for (const ctr of [true, false])
          for (const bndry of [true, false]) {
            SEStore.init();
            await runLineIntersectionTest(lp1, lp2, ctr, bndry);
          }
  });

  it("does not create intersection points of non-intersecting line and circle", async () => {
    async function runLineIntersectionTest(
      fgLinePt1: boolean,
      fgLinePt2: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "line",
        -171,
        97,
        fgLinePt1,
        -147,
        181,
        fgLinePt2
      );
      await drawOneDimensional(
        wrapper,
        "circle",
        111,
        -136,
        true,
        130,
        -136,
        true
      );
      const pointCount = SEStore.sePoints.length;
      const p1 = SEStore.sePoints[pointCount - 2] as SEIntersectionPoint;
      const p2 = SEStore.sePoints[pointCount - 1] as SEIntersectionPoint;
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1.locationVector.x * R,
        p1.locationVector.y * R,
        p1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2.locationVector.x * R,
        p2.locationVector.y * R,
        p2.locationVector.z < 0
      );
      expect(p1.isUserCreated && p2.isUserCreated).toBeFalsy();
      expect(p1.showing && p2.showing).toBeFalsy();
    }

    for (const lp1 of [true, false])
      for (const lp2 of [true, false]) {
        SEStore.init();
        await runLineIntersectionTest(lp1, lp2);
      }
  });

  it("creates intersection points of two segments after clicking near the intersection points", async () => {
    async function runLineIntersectionTest(
      fgSegAPt1: boolean,
      fgSegAPt2: boolean,
      fgSegBPt1: boolean,
      fgSegBPt2: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "segment",
        -71,
        97,
        fgSegAPt1,
        147,
        -181,
        fgSegAPt2
      );
      await drawOneDimensional(
        wrapper,
        "segment",
        -71,
        -136,
        fgSegBPt1,
        179,
        53,
        fgSegBPt2
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints[pointCount - 2] as SEIntersectionPoint;
      const p2 = SEStore.sePoints[pointCount - 1] as SEIntersectionPoint;
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1.locationVector.x * R,
        p1.locationVector.y * R,
        p1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2.locationVector.x * R,
        p2.locationVector.y * R,
        p2.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1.isUserCreated || p2.isUserCreated).toBeTruthy();
      expect(p1.showing || p2.showing).toBeTruthy();
    }

    for (const segA2 of [true, false])
      for (const segB2 of [true, false]) {
        SEStore.init();
        await runLineIntersectionTest(true, segA2, true, segB2);
      }
  });

  it("creates intersection points of a segment and a circle after clicking near the intersection points", async () => {
    async function runLineIntersectionTest(
      fgSegAPt1: boolean,
      fgSegAPt2: boolean,
      fgCenter: boolean,
      fgBoundary: boolean
    ) {
      await drawOneDimensional(
        wrapper,
        "segment",
        -71,
        97,
        fgSegAPt1,
        147,
        -181,
        fgSegAPt2
      );
      await drawOneDimensional(
        wrapper,
        "circle",
        0,
        0,
        fgCenter,
        71,
        87,
        fgBoundary
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints[pointCount - 2] as SEIntersectionPoint;
      const p2 = SEStore.sePoints[pointCount - 1] as SEIntersectionPoint;
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1.locationVector.x * R,
        p1.locationVector.y * R,
        p1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2.locationVector.x * R,
        p2.locationVector.y * R,
        p2.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1.isUserCreated || p2.isUserCreated).toBeTruthy();
      expect(p1.showing || p2.showing).toBeTruthy();
    }

    SEStore.init();
    // TODO: The above setup currently works for foreground points only.
    // Adding more test case variants may require different
    // object arrangements on the sphere
    await runLineIntersectionTest(true, true, true, true);
  });

  it("creates intersection points of two circles after clicking near the intersection points", async () => {
    async function runLineIntersectionTest(
      fgSegAPt1: boolean,
      fgSegAPt2: boolean,
      fgCenter: boolean,
      fgBoundary: boolean
    ) {
      const R = SETTINGS.boundaryCircle.radius;
      await drawOneDimensional(
        wrapper,
        "circle",
        145 - R,
        159 - R,
        fgSegAPt1,
        248 - R,
        201 - R,
        fgSegAPt2
      );
      await drawOneDimensional(
        wrapper,
        "circle",
        306 - R,
        351 - R,
        fgCenter,
        222 - R,
        180 - R,
        fgBoundary
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints[pointCount - 2] as SEIntersectionPoint;
      const p2 = SEStore.sePoints[pointCount - 1] as SEIntersectionPoint;
      SEStore.setActionMode({
        id: "intersect",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      // Circle-vs-circle creates two intersections, the program
      // computes four candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1.locationVector.x * R,
        p1.locationVector.y * R,
        p1.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2.locationVector.x * R,
        p2.locationVector.y * R,
        p2.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1.isUserCreated && p2.isUserCreated).toBeTruthy();
      expect(p1.showing && p2.showing).toBeTruthy();
    }

    SEStore.init();
    // TODO: The above setup currently works for foreground points only.
    // Adding more test case variants may require different
    // object arrangements on the sphere
    await runLineIntersectionTest(true, true, true, true);
  });
});

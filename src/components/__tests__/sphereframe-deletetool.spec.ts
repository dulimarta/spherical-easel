import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  drawEllipse,
  drawOneDimensional,
  drawPointAt,
  mouseClickOnSphere
} from "./sphereframe-helper";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Delete Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
  });

  it("deletes points", async () => {
    async function runDeletePointTest(isForeground: boolean): Promise<void> {
      const prevPointCount = SEStore.sePoints.length;
      await drawPointAt(wrapper, 135, 174, isForeground);
      const newPointCount = SEStore.sePoints.length;
      expect(newPointCount).toEqual(prevPointCount + 1);
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(wrapper, 135, 174, isForeground);
      expect(SEStore.sePoints.length).toEqual(prevPointCount);
    }

    for (const flag of [false, true]) {
      SEStore.init();
      await runDeletePointTest(flag);
    }
  });

  it("deletes lines when clicking on the line", async () => {
    async function runDeleteLineTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      // (1) Create a line
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
        wrapper,
        "line",
        -79,
        93,
        isPt1Foreground,
        112,
        137,
        isPt2Foreground
      );
      const newLineCount = SEStore.seLines.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newLineCount).toEqual(prevLineCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);

      // (2) Find a point on the line
      const target = SEStore.seLines[prevLineCount];
      const candidate = new Vector3(0, 0, 1);
      const pointOn = target.closestVector(candidate);

      // (3) Delete it
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(wrapper, pointOn.x * R, pointOn.y * R);
      expect(SEStore.seLines.length).toEqual(prevLineCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteLineTest(pt1, pt2);
      }
  });

  it("delete lines when clicking one of its points", async () => {
    async function runDeleteLineTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      // (1) Create a line
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
        wrapper,
        "line",
        -79,
        93,
        isPt1Foreground,
        112,
        137,
        isPt2Foreground
      );
      const newLineCount = SEStore.seLines.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newLineCount).toEqual(prevLineCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);
      // (3) Delete one of its points
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const targetPoint = SEStore.sePoints[newPointCount - 2];
      await mouseClickOnSphere(
        wrapper,
        targetPoint.locationVector.x * R,
        targetPoint.locationVector.y * R,
        targetPoint.locationVector.z < 0
      );
      expect(SEStore.seLines.length).toEqual(prevLineCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteLineTest(pt1, pt2);
      }
  });

  it("deletes segments when clicking on the segment", async () => {
    async function runDeleteSegmentTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      const prevSegmentCount = SEStore.seSegments.length;
      await drawOneDimensional(
        wrapper,
        "segment",
        -79,
        93,
        isPt1Foreground,
        112,
        137,
        isPt2Foreground
      );
      const newSegmentCount = SEStore.seSegments.length;
      expect(newSegmentCount).toEqual(prevSegmentCount + 1);
      const target = SEStore.seSegments[prevSegmentCount];
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();

      const pointOn = target.closestVector(new Vector3(0, 0, 1));
      await mouseClickOnSphere(
        wrapper,
        pointOn.x * R,
        pointOn.y * R,
        pointOn.z < 0
      );
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteSegmentTest(pt1, pt2);
      }
  });

  it("delete segments when clicking one of its points", async () => {
    async function runDeleteSegmentTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      const prevSegmentCount = SEStore.seSegments.length;
      const prevPointCount = SEStore.sePoints.length;
      await drawOneDimensional(
        wrapper,
        "segment",
        -79,
        93,
        isPt1Foreground,
        112,
        137,
        isPt2Foreground
      );
      const newSegmentCount = SEStore.seSegments.length;
      expect(newSegmentCount).toEqual(prevSegmentCount + 1);
      const target = SEStore.seSegments[prevSegmentCount];
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();

      const pointOn = SEStore.sePoints[prevPointCount + 1].locationVector;
      await mouseClickOnSphere(
        wrapper,
        pointOn.x * R,
        pointOn.y * R,
        pointOn.z < 0
      );
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteSegmentTest(pt1, pt2);
      }
  });

  it("deletes circles when clicking on the circle", async () => {
    async function runDeleteCircleTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      const prevCircleCount = SEStore.seCircles.length;
      await drawOneDimensional(
        wrapper,
        "circle",
        -79,
        100,
        isPt1Foreground,
        131,
        179,
        isPt2Foreground
      );
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toEqual(prevCircleCount + 1);
      const aCircle = SEStore.seCircles[prevCircleCount];
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      /* The segment is on the right hemisphere so the first point location will
      dictate the click position */
      const pointOn = aCircle.closestVector(new Vector3(0, 0, 1));
      await mouseClickOnSphere(
        wrapper,
        pointOn.x * R,
        pointOn.y * R,
        pointOn.z < 0
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount);
    }

    // TODO: add two more variations that mix fg and bg points
    await runDeleteCircleTest(true, true);
  });

  it("delete circles when clicking one of its point", async () => {
    async function runDeleteCircleTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      const prevCircleCount = SEStore.seCircles.length;
      const prevPointCount = SEStore.sePoints.length;
      await drawOneDimensional(
        wrapper,
        "circle",
        -79,
        100,
        isPt1Foreground,
        131,
        179,
        isPt2Foreground
      );
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toEqual(prevCircleCount + 1);
      const targetPoint = SEStore.sePoints[prevPointCount + 1];
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      /* The segment is on the right hemisphere so the first point location will
      dictate the click position */

      await mouseClickOnSphere(
        wrapper,
        targetPoint.locationVector.x * R,
        targetPoint.locationVector.y * R,
        targetPoint.locationVector.z < 0
      );
      expect(SEStore.seCircles.length).toEqual(prevCircleCount);
    }

    // TODO: add two more variations that mix fg and bg points
    await runDeleteCircleTest(true, true);
  });

  it("deletes ellipses when clicking on the ellipse", async () => {
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(wrapper, -40, 5, true, 80, 57, true, 47, -67, true);
    const newEllipseCount = SEStore.seEllipses.length;

    expect(newEllipseCount).toEqual(prevEllipseCount + 1);
    const anEllipse = SEStore.seEllipses[prevEllipseCount];
    SEStore.setActionMode({
      id: "delete",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    /* The segment is on the right hemisphere so the first point location will
    dictate the click position */
    const pointOn = anEllipse.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(
      wrapper,
      pointOn.x * R,
      pointOn.y * R,
      pointOn.z < 0
    );
    expect(SEStore.seCircles.length).toEqual(prevEllipseCount);
  });

  it("delete ellipses when clicking one of its point", async () => {
    const prevEllipseCount = SEStore.seEllipses.length;
    const prevPointPoint = SEStore.sePoints.length;
    await drawEllipse(wrapper, -40, 5, true, 80, 57, true, 47, -67, true);
    const newEllipseCount = SEStore.seEllipses.length;

    expect(newEllipseCount).toEqual(prevEllipseCount + 1);
    SEStore.setActionMode({
      id: "delete",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    /* The segment is on the right hemisphere so the first point location will
    dictate the click position */
    const pointOn = SEStore.sePoints[prevPointPoint + 1].locationVector;
    await mouseClickOnSphere(
      wrapper,
      pointOn.x * R,
      pointOn.y * R,
      pointOn.z < 0
    );
    expect(SEStore.seCircles.length).toEqual(prevEllipseCount);
  });

  it("deletes antipodes when clicking on the antipode", async () => {
    // (1) Create a point
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 137, 91);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toEqual(prevPointCount + 1);

    // (2) Create its antipode
    SEStore.setActionMode({
      id: "antipodalPoint",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(wrapper, 137, 91); // Create the AntiPode
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 2);
    const antiPt = SEStore.sePoints[newPointCount];

    // (3) Delete the antipode
    SEStore.setActionMode({
      id: "delete",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(
      wrapper,
      antiPt.locationVector.x * R,
      antiPt.locationVector.y * R,
      antiPt.locationVector.z < 0
    ); // Create the AntiPode
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 1);
  });

  it("deletes antipodes and its parent point when clicking on the point", async () => {
    // (1) Create a point
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 137, 91);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toEqual(prevPointCount + 1);
    const pt = SEStore.sePoints[prevPointCount];

    // (2) Create its antipode
    SEStore.setActionMode({
      id: "antipodalPoint",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(wrapper, 137, 91); // Create the AntiPode
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 2);

    // (3) Delete both the point and its antipode
    SEStore.setActionMode({
      id: "delete",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(
      wrapper,
      pt.locationVector.x * R,
      pt.locationVector.y * R,
      pt.locationVector.z < 0
    );
    expect(SEStore.sePoints.length).toEqual(prevPointCount);
  });

  xit("deletes polar", () => {});
});

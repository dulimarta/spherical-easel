import { vi } from "vitest";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  drawEllipse,
  drawOneDimensional,
  drawPointAt,
  mouseClickOnSphere
} from "./sphereframe-helper";
import { SENodule } from "@/models-spherical/SENodule";
import { createTestingPinia } from "@pinia/testing";
import { Command } from "@/commands-spherical/Command";
import Handler from "../DeleteHandler";
import MouseHandler from "../MouseHandler";

import { Vector3 } from "three";
import SETTINGS from "@/global-settings-spherical";
import { SESegment } from "@/models-spherical/SESegment";
import { SECircle } from "@/models-spherical/SECircle";
import { SEEllipse } from "@/models-spherical/SEEllipse";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Delete Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  let pressSpy;

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
    pressSpy = vi.spyOn(Handler.prototype, "mousePressed");
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

  afterEach(() => {
    // expect(pressSpy).toHaveBeenCalled()
  });

  it.each([true, false])("deletes points $@", async isForeground => {
    const prevPointCount = SEStore.sePoints.length;
    SEStore.setActionMode("point");
    await drawPointAt(wrapper, 135, 174, isForeground);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toBeGreaterThanOrEqual(prevPointCount + 1);
    SEStore.setActionMode("delete");
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(wrapper, 135, 174, isForeground);
    expect(SEStore.sePoints.length).toEqual(prevPointCount);
  });

  it.each([
    { start: "fg", end: "fg" },
    { start: "fg", end: "bg" },
    { start: "bg", end: "fg" },
    { start: "bg", end: "bg" }
  ])(
    "deletes lines when clicking on the line ($start,$end)",
    async ({ start, end }) => {
      // (1) Create a line
      SEStore.setActionMode("line");
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
        wrapper,
        -79,
        93,
        start === "fg",
        112,
        137,
        end === "fg"
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
      SEStore.setActionMode("delete");
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(wrapper, pointOn.x * R, pointOn.y * R);
      expect(SEStore.seLines.length).toEqual(prevLineCount);
    }
  );

  it.each([
    { start: "fg", end: "fg" },
    { start: "fg", end: "bg" },
    { start: "bg", end: "fg" },
    { start: "bg", end: "bg" }
  ])(
    "delete lines ($start,$end) when clicking one of its points",
    async ({ start, end }) => {
      // (1) Create a line
      const prevLineCount = SEStore.seLines.length;
      SEStore.setActionMode("line");
      await drawOneDimensional(
        wrapper,
        -79,
        93,
        start === "fg",
        112,
        137,
        end === "fg"
      );
      const newLineCount = SEStore.seLines.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newLineCount).toEqual(prevLineCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);
      // (3) Delete one of its points
      SEStore.setActionMode("delete");
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
  );

  it.each([
    { start: "fg", end: "fg" },
    { start: "fg", end: "bg" },
    { start: "bg", end: "fg" },
    { start: "bg", end: "bg" }
  ])(
    "deletes segments ($start,$end) when clicking on the segment",
    async ({ start, end }) => {
      const prevSegmentCount = SEStore.seSegments.length;
      SEStore.setActionMode("segment");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        -79,
        93,
        start === "fg",
        112,
        137,
        end === "fg"
      );
      const newSegmentCount = SEStore.seSegments.length;
      expect(newSegmentCount).toEqual(prevSegmentCount + 1);
      const target = SEStore.seSegments[prevSegmentCount];
      SEStore.setActionMode("delete");
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
  );

  it.each([
    { start: "fg", end: "fg" },
    { start: "fg", end: "bg" },
    { start: "bg", end: "fg" },
    { start: "bg", end: "bg" }
  ])(
    "delete segments ($start,$end) when clicking one of its points",
    async ({ start, end }) => {
      const prevSegmentCount = SEStore.seSegments.length;
      const prevPointCount = SEStore.sePoints.length;
      SEStore.setActionMode("segment");
      await wrapper.vm.$nextTick();
      console.debug("Point count before created", prevPointCount);
      console.debug("Segment count before created", prevSegmentCount);
      await drawOneDimensional(
        wrapper,
        -79,
        93,
        start === "fg",
        112,
        137,
        end === "fg"
      );
      const newSegmentCount = SEStore.seSegments.length;
      const newPointCount = SEStore.sePoints.length;
      console.debug("Segment count after created", newSegmentCount);
      console.debug("Point count after created", newPointCount);
      expect(newSegmentCount).toEqual(prevSegmentCount + 1);
      const target = SEStore.seSegments[prevSegmentCount];
      console.debug("About to delete", target.name);
      SEStore.setActionMode("delete");
      await wrapper.vm.$nextTick();

      const victim: SESegment = SEStore.seSegments[prevSegmentCount];
      const pointOn = victim.getMidPointVector();
      await mouseClickOnSphere(
        wrapper,
        pointOn.x * R,
        pointOn.y * R,
        pointOn.z < 0
      );
      const lastSegmentCount = SEStore.seSegments.length;
      const lastPointCount = SEStore.sePoints.length;
      console.debug("Segment count after delete", lastSegmentCount);
      console.debug("Point count after delete", lastPointCount);

      // expect(SEStore.seSegments.length).toBeLessThan(newSegmentCount);
    }
  );

  it.each([
    { ctr: "fg", boundary: "fg" },
    { ctr: "fg", boundary: "bg" },
    { ctr: "bg", boundary: "fg" },
    { ctr: "bg", boundary: "bg" }
  ])(
    "deletes circles($ctr,$boundary) when clicking on the circle",
    async ({ ctr, boundary }) => {
      const prevCircleCount = SEStore.seCircles.length;
      SEStore.setActionMode("circle");
      await drawOneDimensional(
        wrapper,
        -79,
        100,
        ctr === "fg",
        131,
        179,
        boundary === "fg"
      );
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toEqual(prevCircleCount + 1);
      const aCircle = SEStore.seCircles[prevCircleCount];
      SEStore.setActionMode("delete");
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
  );

  it.each([
    { ctr: "fg", boundary: "fg" },
    { ctr: "fg", boundary: "bg" },
    { ctr: "bg", boundary: "fg" },
    { ctr: "bg", boundary: "bg" }
  ])(
    "delete circles ($ctr,$boundary) when clicking one of its point",
    async ({ ctr, boundary }) => {
      const prevCircleCount = SEStore.seCircles.length;
      const prevPointCount = SEStore.sePoints.length;
      SEStore.setActionMode("circle");
      await drawOneDimensional(
        wrapper,
        -79,
        100,
        ctr === "fg",
        131,
        179,
        boundary === "fg"
      );
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toEqual(prevCircleCount + 1);
      const victim: SECircle = SEStore.seCircles[prevCircleCount];
      const targetPoint = victim.circleSEPoint;
      SEStore.setActionMode("delete");
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
  );

  it("deletes ellipses when clicking on the ellipse", async () => {
    SEStore.setActionMode("ellipse");
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(wrapper, -40, 5, true, 80, 57, true, 47, -67, true);
    const newEllipseCount = SEStore.seEllipses.length;

    expect(newEllipseCount).toEqual(prevEllipseCount + 1);
    const anEllipse = SEStore.seEllipses[prevEllipseCount];
    SEStore.setActionMode("delete");
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
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount);
  });

  it("delete ellipses when clicking on peripheral point", async () => {
    SEStore.setActionMode("ellipse");
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(wrapper, -40, 5, true, 80, 57, true, 47, -67, true);
    const newEllipseCount = SEStore.seEllipses.length;

    expect(newEllipseCount).toEqual(prevEllipseCount + 1);
    SEStore.setActionMode("delete");
    await wrapper.vm.$nextTick();
    /* The segment is on the right hemisphere so the first point location will
    dictate the click position */
    const victim: SEEllipse = SEStore.seEllipses[prevEllipseCount];
    const pointOn = victim.ellipseSEPoint.locationVector;
    await mouseClickOnSphere(
      wrapper,
      pointOn.x * R,
      pointOn.y * R,
      pointOn.z < 0
    );
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount);
  });

  it("deletes antipodes when clicking on the antipode", async () => {
    // (1) Create a point
    SEStore.setActionMode("point");
    await wrapper.vm.$nextTick();
    const prevPointCount = SEStore.sePoints.length;
    console.debug("Point count before", prevPointCount);
    await drawPointAt(wrapper, 137, 91);
    const newPointCount = SEStore.sePoints.length;
    console.debug("Point count after created", SEStore.sePoints.length);
    expect(newPointCount).toBeGreaterThanOrEqual(prevPointCount + 1);

    // (2) Create its antipode
    SEStore.setActionMode("antipodalPoint");
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(wrapper, 137, 91); // Create the AntiPode
    console.debug(
      "Point count after antipode created",
      SEStore.sePoints.length
    );
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 2);
    const antiPt = SEStore.sePoints[newPointCount - 1];

    // (3) Delete the antipode
    SEStore.setActionMode("delete");
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
    SEStore.setActionMode("point");
    await wrapper.vm.$nextTick();
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 137, 91);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toBeGreaterThanOrEqual(prevPointCount + 1);
    const pt = SEStore.sePoints[prevPointCount];

    // (2) Create its antipode
    SEStore.setActionMode("antipodalPoint");
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(wrapper, 137, 91); // Create the AntiPode
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 2);

    // (3) Delete both the point and its antipode
    SEStore.setActionMode("delete");
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(
      wrapper,
      pt.locationVector.x * R,
      pt.locationVector.y * R,
      pt.locationVector.z < 0
    );
    expect(SEStore.sePoints.length).toEqual(prevPointCount);
  });

  //for this variation of deleting circles, we will make two connected circles
  //as well as a cross where the circles union and a point at the intersection of the cross
  //followed by deleting two circles and checking if they got deleted
  it.each([
    { first: "fg", second: "fg" },
    { first: "fg", second: "bg" },
    { first: "bg", second: "fg" },
    { first: "bg", second: "bg" }
  ])(
    "deletes circles $(ctr,$boundary) when clicking on the circle (part 2)",
    async ({ first, second }) => {
      //store number of circles
      const prevCircleCount = SEStore.seCircles.length;

      //draw 2 circles with 2 perpendicular line segments in their union and a point where those lines intersect
      SEStore.setActionMode("circle");
      await drawOneDimensional(
        wrapper,
        100,
        100,
        first === "fg",
        100,
        200,
        second === "fg"
      );
      await drawOneDimensional(
        wrapper,
        100,
        200,
        first === "fg",
        100,
        100,
        second === "fg"
      );
      SEStore.setActionMode("line");
      await drawOneDimensional(
        wrapper,
        100,
        100,
        first === "fg",
        100,
        200,
        second === "fg"
      );
      await drawOneDimensional(
        wrapper,
        -14.96551432328367,
        171.2592235729355,
        first === "fg",
        198.6068262959697,
        104.20274438609354,
        second === "fg"
      );
      await SEStore.setActionMode("pointOnObject");
      await mouseClickOnSphere(
        wrapper,
        104.00929959078515,
        156.0139493861777,
        false
      );

      //store current circle length and make sure it is 2 more than previous one
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toEqual(prevCircleCount + 2);
      let aCircle = SEStore.seCircles[prevCircleCount];

      // Calculate a different point on circle 1
      let target = new Vector3().copy(aCircle.circleSEPoint.locationVector);
      target.applyAxisAngle(
        aCircle.centerSEPoint.locationVector,
        Math.PI * 0.1
      );
      const R = SETTINGS.boundaryCircle.radius;
      let prevPointCount = SEStore.sePoints.length;
      //delete circle 1
      SEStore.setActionMode("delete");
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(
        wrapper,
        target.x * R,
        target.y * R,
        target.z < 0
      );
      //check that one circle was deleted
      expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);

      aCircle = SEStore.seCircles[prevCircleCount];
      // Calculate a different point on circle 2
      target = new Vector3().copy(aCircle.circleSEPoint.locationVector);
      target.applyAxisAngle(
        aCircle.centerSEPoint.locationVector,
        Math.PI * 0.1
      );
      prevPointCount = SEStore.sePoints.length;
      //delete circle 2
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(
        wrapper,
        target.x * R,
        target.y * R,
        target.z < 0
      );
      //check that both circles were deleted
      expect(SEStore.seCircles.length).toEqual(prevCircleCount);
    }
  );

  it.todo("deletes polar");
});

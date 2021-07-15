import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { drawOneDimensional, drawPointAt } from "./sphereframe-helper";

describe("SphereFrame: Perpendicular Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  async function clickAt(x: number, y: number, withShift = false) {
    const target = wrapper.find("#canvas");

    await target.trigger("mousemove", {
      clientX: x,
      clientY: y,
      shiftKey: withShift
    });
    await target.trigger("mousedown", {
      clientX: x,
      clientY: y,
      shiftKey: withShift
    });
    await target.trigger("mouseup", {
      clientX: x,
      clientY: y,
      shiftKey: withShift
    });
  }
  beforeEach(async () => {
    SEStore.init();
  });

  /*
  TODO: add test cases to simulate different click sequence
  */

  async function runPerpendicularToLineTest(
    foregroundPoint: boolean,
    foregroundLinePt1: boolean,
    foregroundLinePt2: boolean
  ): Promise<void> {
    const lineCount = SEStore.seLines.length;
    await drawOneDimensional(
      wrapper,
      "line",
      150,
      170,
      foregroundLinePt1,
      113,
      200,
      foregroundLinePt2
    );
    expect(SEStore.seLines.length).toBe(lineCount + 1);
    const referenceLine = SEStore.seLines[lineCount];

    const pointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 61, 93, !foregroundPoint);
    const aPoint = SEStore.sePoints[pointCount];
    // SEStore.addPoint(aPoint);
    expect(SEStore.sePoints.length).toBe(pointCount + 1);
    SEStore.setActionMode({
      id: "perpendicular",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await clickAt(61, 93, !foregroundPoint); // Select the point
    await clickAt(150, 170, !foregroundLinePt1); // select the line

    expect(SEStore.seLines.length).toBeGreaterThanOrEqual(lineCount + 2);
    const newLine = SEStore.seLines[lineCount + 1];
    const angle = referenceLine.normalVector.angleTo(newLine.normalVector);

    // Verify the angle between the two lines
    expect(angle.toDegrees()).toBeCloseTo(90, 3);
    // console.debug("Angle between two lines", angle.toDegrees());
  }

  it("adds a line thru a point perpendicular to another line", async () => {
    for (const pt of [true, false])
      for (const linePt1 of [true, false])
        for (const linePt2 of [true, false]) {
          SEStore.init();
          await runPerpendicularToLineTest(pt, linePt1, linePt2);
        }
  });

  async function runPerpendicularToSegmentTest(
    foregroundPoint: boolean,
    fgSegmentPoint1: boolean,
    fgSegmentPoint2: boolean
  ): Promise<void> {
    const segmentCount = SEStore.seSegments.length;
    const lineCount = SEStore.seLines.length;
    await drawOneDimensional(
      wrapper,
      "segment",
      150,
      170,
      fgSegmentPoint1,
      113,
      200,
      fgSegmentPoint2
    );
    expect(SEStore.seSegments.length).toBe(segmentCount + 1);
    const referenceSegment = SEStore.seSegments[segmentCount];

    const pointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 61, 93, !foregroundPoint);
    const aPoint = SEStore.sePoints[pointCount];
    // SEStore.addPoint(aPoint);
    expect(SEStore.sePoints.length).toBe(pointCount + 1);
    SEStore.setActionMode({
      id: "perpendicular",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await clickAt(61, 93, !foregroundPoint); // Select the point
    await clickAt(150, 170, !fgSegmentPoint1); // select the line

    expect(SEStore.seSegments.length).toBeGreaterThanOrEqual(segmentCount + 1);
    const newLine = SEStore.seLines[lineCount];
    const angle = referenceSegment.normalVector.angleTo(newLine.normalVector);

    // Verify the angle between the new line and the segment
    expect(angle.toDegrees()).toBeCloseTo(90, 3);
  }

  it("adds a line thru a point perpendicular to a segment", async () => {
    for (const pt of [true, false]) {
      for (const segmentPt1 of [true, false])
        for (const segmentPt2 of [true, false]) {
          SEStore.init();
          await runPerpendicularToSegmentTest(pt, segmentPt1, segmentPt2);
        }
    }
  });

  async function runPerpendicularToCircleTest(
    foregroundPoint: boolean,
    fgCircleCenter: boolean,
    fgCirclePoint: boolean
  ): Promise<void> {
    const circleCount = SEStore.seCircles.length;
    const lineCount = SEStore.seLines.length;
    await drawOneDimensional(
      wrapper,
      "circle",
      150,
      170,
      fgCircleCenter,
      113,
      200,
      fgCirclePoint
    );
    expect(SEStore.seCircles.length).toBe(circleCount + 1);
    const referenceCircle = SEStore.seCircles[circleCount];

    const pointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 61, 93, !foregroundPoint);
    expect(SEStore.sePoints.length).toBe(pointCount + 1);
    SEStore.setActionMode({
      id: "perpendicular",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await clickAt(61, 93, !foregroundPoint); // Select the point
    await clickAt(113, 200, !fgCirclePoint); // select the circle

    expect(SEStore.seCircles.length).toBeGreaterThanOrEqual(circleCount + 1);
    const newLine = SEStore.seLines[lineCount];
    const angle = referenceCircle.centerSEPoint.locationVector.angleTo(
      newLine.normalVector
    );

    // Verify the angle between the new line and the segment
    expect(angle.toDegrees()).toBeCloseTo(90, 3);
  }

  it("adds a line thru a point perpendicular to a circle", async () => {
    for (const pt of [true, false]) {
      for (const circleCtr of [true, false])
        for (const circlePt of [true, false]) {
          SEStore.init();
          await runPerpendicularToCircleTest(pt, circleCtr, circlePt);
        }
    }
  });

  xit("adds lines thru a point perpendicular to an ellipse", () => {
    // incomplete test
  });
});

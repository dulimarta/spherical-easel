import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  drawOneDimensional,
  drawPointAt
} from "./sphereframe-helper";
import { SENodule } from "@/models/SENodule";
import { Command } from "@/commands/Command";
import Handler from "../PerpendicularLineThruPointHandler";

describe("Perpendicular Tool", () => {
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

  /*
  TODO: add test cases to simulate different click sequence
  */

  it.each([
    { refPt: "fg", lineStart: "fg", lineEnd: "fg" },
    { refPt: "fg", lineStart: "fg", lineEnd: "bg" },
    { refPt: "fg", lineStart: "bg", lineEnd: "fg" },
    { refPt: "fg", lineStart: "bg", lineEnd: "bg" },
    { refPt: "bg", lineStart: "fg", lineEnd: "fg" },
    { refPt: "bg", lineStart: "fg", lineEnd: "bg" },
    { refPt: "bg", lineStart: "bg", lineEnd: "fg" },
    { refPt: "bg", lineStart: "bg", lineEnd: "bg" },
  ])(
    "adds a line thru a $refPt point perpendicular to another line ($lineStart,$lineEnd)",
    async ({ refPt, lineStart, lineEnd }) => {
      const lineCount = SEStore.seLines.length;
      SEStore.setActionMode("line");
      await drawOneDimensional(
        wrapper,
        150,
        170,
        lineStart === "bg",
        113,
        200,
        lineEnd === "bg"
      );
      expect(SEStore.seLines.length).toBe(lineCount + 1);
      const referenceLine = SEStore.seLines[lineCount];

      const pointCount = SEStore.sePoints.length;
      SEStore.setActionMode("point");
      await drawPointAt(wrapper, 61, 93, refPt === "bg");
      const aPoint = SEStore.sePoints[pointCount];
      // SEStore.addPoint(aPoint);
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(pointCount + 1);
      SEStore.setActionMode("perpendicular");
      await wrapper.vm.$nextTick();
      await clickAt(61, 93, refPt === "bg"); // Select the point
      await clickAt(150, 170, lineStart === "bg"); // select the line

      expect(SEStore.seLines.length).toBeGreaterThanOrEqual(lineCount + 2);
      const newLine = SEStore.seLines[lineCount + 1];
      const angle = referenceLine.normalVector.angleTo(newLine.normalVector);

      // Verify the angle between the two lines
      expect(angle.toDegrees()).toBeCloseTo(90, 3);
      // console.debug("Angle between two lines", angle.toDegrees());
    }
  );

  it.each([
    { refPt: "fg", segStart: "fg", segEnd: "fg" },
    { refPt: "fg", segStart: "fg", segEnd: "bg" },
    { refPt: "fg", segStart: "bg", segEnd: "fg" },
    { refPt: "fg", segStart: "bg", segEnd: "bg" },
    { refPt: "bg", segStart: "fg", segEnd: "fg" },
    { refPt: "bg", segStart: "fg", segEnd: "bg" },
    { refPt: "bg", segStart: "bg", segEnd: "fg" },
    { refPt: "bg", segStart: "bg", segEnd: "bg" },
  ])(
    "adds a line thru a point perpendicular ($refPt) to a segment ($segStart-$segEnd)",
    async ({ refPt, segStart, segEnd }) => {
      const segmentCount = SEStore.seSegments.length;
      const lineCount = SEStore.seLines.length;
      SEStore.setActionMode("segment");
      await drawOneDimensional(
        wrapper,
        150,
        170,
        segStart === "bg",
        113,
        200,
        segEnd === "bg"
      );
      expect(SEStore.seSegments.length).toBe(segmentCount + 1);
      const referenceSegment = SEStore.seSegments[segmentCount];

      SEStore.setActionMode("point");
      const pointCount = SEStore.sePoints.length;
      await drawPointAt(wrapper, 61, 93, refPt === "bg");
      const aPoint = SEStore.sePoints[pointCount];
      // SEStore.addPoint(aPoint);
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(pointCount + 1);
      SEStore.setActionMode("perpendicular");
      await wrapper.vm.$nextTick();
      await clickAt(61, 93, refPt === "bg"); // Select the point
      await clickAt(150, 170, segStart === "bg"); // select the line

      expect(SEStore.seSegments.length).toBeGreaterThanOrEqual(
        segmentCount + 1
      );
      const newLine = SEStore.seLines[lineCount];
      const angle = referenceSegment.normalVector.angleTo(newLine.normalVector);

      // Verify the angle between the new line and the segment
      expect(angle.toDegrees()).toBeCloseTo(90, 3);
    }
  );

  it.each([{ point: "fg", circCtr: "fg", circPt: "fg" }])(
    "adds a line thru a point ($point) perpendicular to a circle ($circCtr,$circPt)",
    async ({ point, circCtr, circPt }) => {
      const circleCount = SEStore.seCircles.length;
      const lineCount = SEStore.seLines.length;
      SEStore.setActionMode("circle");
      await drawOneDimensional(
        wrapper,
        150,
        170,
        circCtr === "fg",
        113,
        200,
        circPt === "fg"
      );
      expect(SEStore.seCircles.length).toBe(circleCount + 1);
      const referenceCircle = SEStore.seCircles[circleCount];

      const pointCount = SEStore.sePoints.length;
      SEStore.setActionMode("point");
      await drawPointAt(wrapper, 61, 93, point === "bg");
      expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(pointCount + 1);
      SEStore.setActionMode("perpendicular");
      await wrapper.vm.$nextTick();
      await clickAt(61, 93, point === "bg"); // Select the point
      await clickAt(113, 200, circPt === "bg"); // select the circle

      expect(SEStore.seCircles.length).toBeGreaterThanOrEqual(circleCount + 1);
      const newLine = SEStore.seLines[lineCount];
      const angle = referenceCircle.centerSEPoint.locationVector.angleTo(
        newLine.normalVector
      );

      // Verify the angle between the new line and the segment
      expect(angle.toDegrees()).toBeCloseTo(90, 3);
    }
  );

  it.todo("adds lines thru a point perpendicular to an ellipse");
});

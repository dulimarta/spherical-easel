import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
// import PointHandler from "@/eventHandlers/PointHandler";
import Vue from "vue";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";
import "@/../tests/jest-custom-matchers";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { Wrapper } from "@vue/test-utils";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";

/*
TODO: the test cases below create the object using newly created node.
Should we include test cases where the tools select existing objects
during the creation. For instance, when creating a line one of the endpoints 
is already on the sphere
*/
describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    // It is important to reset the actionMode back to subsequent
    // mutation to actionMode will trigger a Vue Watch update
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
    SEStore.setActionMode({ id: "select", name: "" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is an instance", () => {
    expect(wrapper.exists).toBeTruthy();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("has SVG element", () => {
    const canvas = wrapper.find("svg");
    expect(canvas.exists).toBeTruthy();
    expect(canvas).toBeDefined();
  });

  it("has TwoJS instance and midground layer", () => {
    expect(wrapper.vm.$data.twoInstance).toBeDefined();
    expect(wrapper.vm.$data.layers[LAYER.midground]).toBeDefined();
  });

  it("contains boundary circle of the right radius", () => {
    //   console.debug(wrapper.vm.$data.layers[LAYER.midground]);
    const midLayer = wrapper.vm.$data.layers[LAYER.midground];
    expect(midLayer.children.length).toBeGreaterThan(0);
    expect(midLayer.children[0]).toBeInstanceOf(Two.Circle);
    expect(midLayer.children[0]._radius).toEqual(
      SETTINGS.boundaryCircle.radius
    );
  });

  const TEST_MOUSE_X = 111;
  const TEST_MOUSE_Y = 137;

  async function mouseClickOnSphere(
    x: number,
    y: number,
    withShift = false
  ): Promise<void> {
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();

    await target.trigger("mousemove", {
      clientX: x,
      clientY: y,
      shiftKey: withShift
    });
    // console.debug(wrapper.vm.$data.currentTool?.isOnSphere);
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
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

  async function drawPointAt(
    x: number,
    y: number,
    isBackground = false
  ): Promise<void> {
    SEStore.setActionMode({
      id: "point",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(x, y, isBackground);
    // const target = wrapper.find("#canvas");
    // expect(target.exists).toBeTruthy();

    // await target.trigger("mousemove", {
    //   clientX: x,
    //   clientY: y,
    //   shiftKey: isBackground
    // });
    // expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    // await target.trigger("mousedown", {
    //   clientX: x,
    //   clientY: y,
    //   shiftKey: isBackground
    // });
    // await target.trigger("mouseup", {
    //   clientX: x,
    //   clientY: y,
    //   shiftKey: isBackground
    // });
  }
  async function makePoint(isBackground: boolean): Promise<SEPoint> {
    await drawPointAt(TEST_MOUSE_X, TEST_MOUSE_Y, isBackground);
    const count = SEStore.sePoints.length;
    // The most recent point
    return SEStore.sePoints[count - 1] as SEPoint;
  }

  describe("with Point Tool", () => {
    beforeEach(async () => {
      SEStore.setActionMode({
        id: "point",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });

    it("adds a new point when clicking on sphere while using PointTool", async () => {
      for (const pt of [true, false]) {
        const prevPointCount = SEStore.sePoints.length;
        const p = await makePoint(pt);
        expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
        if (!pt) expect(p.locationVector.z).toBeGreaterThan(0);
        else expect(p.locationVector.z).toBeLessThan(0);
      }
    });
    // it("adds a new (background) point when clicking on sphere while using PointTool", async () => {
    //   const prevPointCount = SEStore.sePoints.length;
    //   const p = await makePoint(true /* back ground point */);
    //   expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
    //   expect(p.locationVector.z).toBeLessThan(0);
    // });
  });

  async function dragMouse(
    fromX: number,
    fromY: number,
    fromBg: boolean,
    toX: number,
    toY: number,
    toBg: boolean
  ): Promise<void> {
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();
    await target.trigger("mousemove", {
      clientX: fromX,
      clientY: fromY,
      shiftKey: fromBg
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    await target.trigger("mousedown", {
      clientX: fromX,
      clientY: fromY,
      shiftKey: fromBg
    });
    await target.trigger("mousemove", {
      clientX: toX,
      clientY: toY,
      shiftKey: toBg
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    await target.trigger("mouseup", {
      clientX: toX,
      clientY: toY,
      shiftKey: toBg
    });
    return await wrapper.vm.$nextTick();
  }

  async function drawOneDimensional(
    drawMode: string,
    x1: number,
    y1: number,
    isPoint1Foreground: boolean,
    x2: number,
    y2: number,
    isPoint2Foreground: boolean
  ): Promise<void> {
    SEStore.setActionMode({
      id: drawMode,
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await dragMouse(x1, y1, !isPoint1Foreground, x2, y2, !isPoint2Foreground);
  }

  async function drawEllipse(
    focus1_x: number,
    focus1_y: number,
    isFocus1Foreground: boolean,
    focus2_x: number,
    focus2_y: number,
    isFocus2Foreground: boolean,
    x3: number,
    y3: number,
    isPoint3Foreground: boolean
  ): Promise<void> {
    SEStore.setActionMode({
      id: "ellipse",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(focus1_x, focus1_y, !isFocus1Foreground);
    await mouseClickOnSphere(focus2_x, focus2_y, !isFocus2Foreground);
    await mouseClickOnSphere(x3, y3, !isPoint3Foreground);
  }

  describe("with Line Tool", () => {
    async function runLineTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
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
      const dir = new Vector3()
        .crossVectors(startVector, endVector)
        .normalize();
      expect(newLine.startSEPoint.locationVector).toBeVector3CloseTo(
        startVector,
        3
      );
      expect(newLine.endSEPoint.locationVector).toBeVector3CloseTo(
        endVector,
        3
      );
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

  describe("with Segment Tool", () => {
    async function runSegmentTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      SEStore.setActionMode({
        id: "segment",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevSegmentCount = SEStore.seSegments.length;
      await dragMouse(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        !isPoint1Foreground,
        endX,
        endY,
        !isPoint2Foreground
      );
      // await wrapper.vm.$nextTick();
      const newSegmentCount = SEStore.seSegments.length;
      expect(newSegmentCount).toBe(prevSegmentCount + 1);
      const R = SETTINGS.boundaryCircle.radius;
      const startZCoord =
        Math.sqrt(
          R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
        ) * (isPoint1Foreground ? +1 : -1);
      const endZCoord =
        Math.sqrt(R * R - endX * endX - endY * endY) *
        (isPoint2Foreground ? +1 : -1);
      const newSegment: SESegment = SEStore.seSegments[prevSegmentCount];
      // Start vector
      const startVector = new Vector3(
        TEST_MOUSE_X,
        -TEST_MOUSE_Y,
        startZCoord
      ).normalize();
      // End vector
      const endVector = new Vector3(endX, -endY, endZCoord).normalize();
      const dir = new Vector3()
        .crossVectors(startVector, endVector)
        .normalize();
      expect(newSegment.startSEPoint.locationVector).toBeVector3CloseTo(
        startVector,
        3
      );
      expect(newSegment.endSEPoint.locationVector).toBeVector3CloseTo(
        endVector,
        3
      );
      expect(newSegment.normalVector).toBeVector3CloseTo(dir, 3);
    }

    it("adds a new segment while in SegmentTool", async () => {
      for (const pt1 of [true, false])
        for (const pt2 of [true, false]) {
          SEStore.init();
          await runSegmentTest(pt1, pt2);
        }
      await runSegmentTest(true, true);
    });
  });

  describe("with Circle Tool", () => {
    async function runCircleTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      SEStore.setActionMode({
        id: "circle",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevCircleCount = SEStore.seCircles.length;
      await dragMouse(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        !isPoint1Foreground,
        endX,
        endY,
        !isPoint2Foreground
      );
      // await wrapper.vm.$nextTick();
      const newCircleCount = SEStore.seCircles.length;
      expect(newCircleCount).toBe(prevCircleCount + 1);
      const R = SETTINGS.boundaryCircle.radius;
      const startZCoord =
        Math.sqrt(
          R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
        ) * (isPoint1Foreground ? +1 : -1);
      const endZCoord =
        Math.sqrt(R * R - endX * endX - endY * endY) *
        (isPoint2Foreground ? +1 : -1);
      const newCircle: SECircle = SEStore.seCircles[prevCircleCount];
      // Center vector is foreground
      const centerVector = new Vector3(
        TEST_MOUSE_X,
        -TEST_MOUSE_Y,
        startZCoord
      ).normalize();
      // Radius vector is foreground
      const radiusVector = new Vector3(endX, -endY, endZCoord).normalize();
      expect(newCircle.centerSEPoint.locationVector).toBeVector3CloseTo(
        centerVector,
        3
      );
      expect(newCircle.circleSEPoint.locationVector).toBeVector3CloseTo(
        radiusVector,
        3
      );
    }
    it("adds a new circle while in CircleTool", async () => {
      for (const center of [true, false])
        for (const boundaryPt of [true, false]) {
          SEStore.init();
          await runCircleTest(center, boundaryPt);
        }
    });
  });

  describe("with Ellipse Tool", () => {
    async function runEllipseTest(
      isFocus1Foreground: boolean,
      isFocus2Foreground: boolean,
      isPoint3Foreground: boolean
    ): Promise<void> {
      const prevEllipseCount = SEStore.seEllipses.length;
      await drawEllipse(
        101,
        87,
        isFocus1Foreground,
        200,
        113,
        isFocus2Foreground,
        150,
        190,
        isPoint3Foreground
      );
      expect(SEStore.seEllipses.length).toEqual(prevEllipseCount + 1);
    }

    it("adds a new ellipse while in EllipseTool", async () => {
      for (const focal1 of [true, false])
        for (const focal2 of [true, false])
          for (const boundaryPt of [true, false]) {
            SEStore.init();
            await runEllipseTest(focal1, focal2, boundaryPt);
          }
    });
  });

  describe("with AntipodalPoint tool", () => {
    async function runAntipodeTest(isForeground: boolean) {
      const prevPointCount = SEStore.sePoints.length;
      await mouseClickOnSphere(TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 2);

      // The most recent two points must be antipodal pairs
      const a = SEStore.sePoints[prevPointCount];
      const b = SEStore.sePoints[prevPointCount + 1];

      // Verify correct antipodal point location
      expect(a.locationVector.x).toBe(-b.locationVector.x);
      expect(a.locationVector.y).toBe(-b.locationVector.y);
      expect(a.locationVector.z).toBe(-b.locationVector.z);
    }
    beforeEach(async () => {
      SEStore.setActionMode({
        id: "antipodalPoint",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });

    it("adds a new point and its antipodal when clicking on sphere while using PointTool", async () => {
      for (const pt of [true, false]) await runAntipodeTest(pt);
    });

    // it("adds a new (background) point and its antipodal when clicking on sphere while using PointTool", async () => {
    //   await runAntipodeTest(false);
    // });
  });

  describe("with Polar Tool", () => {
    async function runPolarTest(isForeground: boolean) {
      SEStore.setActionMode({
        id: "polar",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const prevPointCount = SEStore.sePoints.length;
      const prevLineCount = SEStore.seLines.length;
      await mouseClickOnSphere(TEST_MOUSE_X, TEST_MOUSE_Y, isForeground);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(SEStore.seLines.length).toBe(prevLineCount + 1);

      // The most recent two points must be antipodal pairs
      const aPoint = SEStore.sePoints[prevPointCount];
      const conjLine = SEStore.seLines[prevLineCount];

      // Verify correct normal vector of the line
      expect(aPoint.locationVector).toBeVector3CloseTo(
        conjLine.normalVector,
        5
      );
    }
    beforeEach(async () => {});
    it("adds a new point and its conjugate line when clicking on sphere while using PolarTool", async () => {
      for (const pt of [false, true]) {
        SEStore.init();
        await runPolarTest(pt);
      }
    });
  });
  describe("With Perpendicular Tool", () => {
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
      await drawPointAt(61, 93, !foregroundPoint);
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
      await drawPointAt(61, 93, !foregroundPoint);
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

      expect(SEStore.seSegments.length).toBeGreaterThanOrEqual(
        segmentCount + 1
      );
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
      await drawPointAt(61, 93, !foregroundPoint);
      // const aPoint = SEStore.sePoints[pointCount];
      // SEStore.addPoint(aPoint);
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

  describe("with PointOnObject Tool", () => {
    it("adds points on a line", async () => {
      async function runPointOnLineTest(
        fgLinePt1: boolean,
        fgLinePt2: boolean
      ) {
        const prevLineCount = SEStore.seLines.length;
        await drawOneDimensional(
          "line",
          100,
          79,
          fgLinePt1,
          173,
          157,
          fgLinePt2
        );
        expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
        SEStore.setActionMode({
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
        const mid2D_y = -mid.y * R;
        const prevPointCount = SEStore.sePoints.length;
        await mouseClickOnSphere(mid2D_x, mid2D_y, mid.z < 0);
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
          "segment",
          100,
          79,
          fgLinePt1,
          173,
          157,
          fgLinePt2
        );
        expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
        SEStore.setActionMode({
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
        const mid2D_y = -mid.y * R;
        const prevPointCount = SEStore.sePoints.length;
        await mouseClickOnSphere(mid2D_x, mid2D_y, mid.z < 0);
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
          "circle",
          100,
          79,
          fgCenterPt,
          173,
          157,
          fgBoundaryPt
        );
        expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
        SEStore.setActionMode({
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
        await mouseClickOnSphere(target.x * R, -target.y * R, target.z < 0);
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

  describe("with Intersection Tool", () => {
    it("creates intersection points of two lines after clicking near the intersection points", async () => {
      async function runLineIntersectionTest(
        fgLine1Pt1: boolean,
        fgLine1Pt2: boolean,
        fgLine2Pt1: boolean,
        fgLine2Pt2: boolean
      ) {
        await drawOneDimensional(
          "line",
          71,
          97,
          fgLine1Pt1,
          147,
          181,
          fgLine1Pt2
        );
        await drawOneDimensional(
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
          x1.locationVector.x * R,
          -x1.locationVector.y * R,
          x1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          x2.locationVector.x * R,
          -x2.locationVector.y * R,
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
          "line",
          71,
          97,
          fgLinePt1,
          147,
          181,
          fgLinePt2
        );
        await drawOneDimensional(
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
          x1.locationVector.x * R,
          -x1.locationVector.y * R,
          x1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          x2.locationVector.x * R,
          -x2.locationVector.y * R,
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
          "line",
          71,
          97,
          fgLinePt1,
          179,
          101,
          fgLinePt2
        );
        await drawOneDimensional(
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
          x1.locationVector.x * R,
          -x1.locationVector.y * R,
          x1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          x2.locationVector.x * R,
          -x2.locationVector.y * R,
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
          "line",
          71,
          97,
          fgLinePt1,
          147,
          181,
          fgLinePt2
        );
        await drawOneDimensional(
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
          x1.locationVector.x * R,
          -x1.locationVector.y * R,
          x1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          x2.locationVector.x * R,
          -x2.locationVector.y * R,
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
          "line",
          -171,
          97,
          fgLinePt1,
          -147,
          181,
          fgLinePt2
        );
        await drawOneDimensional("circle", 111, -136, true, 130, -136, true);
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
          p1.locationVector.x * R,
          -p1.locationVector.y * R,
          p1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          p2.locationVector.x * R,
          -p2.locationVector.y * R,
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
          "segment",
          -71,
          97,
          fgSegAPt1,
          147,
          -181,
          fgSegAPt2
        );
        await drawOneDimensional(
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
          p1.locationVector.x * R,
          -p1.locationVector.y * R,
          p1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          p2.locationVector.x * R,
          -p2.locationVector.y * R,
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
          "segment",
          -71,
          97,
          fgSegAPt1,
          147,
          -181,
          fgSegAPt2
        );
        await drawOneDimensional("circle", 0, 0, fgCenter, 71, 87, fgBoundary);
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
          p1.locationVector.x * R,
          -p1.locationVector.y * R,
          p1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          p2.locationVector.x * R,
          -p2.locationVector.y * R,
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

    it.only("creates intersection points of two circles after clicking near the intersection points", async () => {
      async function runLineIntersectionTest(
        fgSegAPt1: boolean,
        fgSegAPt2: boolean,
        fgCenter: boolean,
        fgBoundary: boolean
      ) {
        const R = SETTINGS.boundaryCircle.radius;
        await drawOneDimensional(
          "circle",
          145 - R,
          159 - R,
          fgSegAPt1,
          248 - R,
          201 - R,
          fgSegAPt2
        );
        await drawOneDimensional(
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
          p1.locationVector.x * R,
          -p1.locationVector.y * R,
          p1.locationVector.z < 0
        );
        // click near the second intersection
        await mouseClickOnSphere(
          p2.locationVector.x * R,
          -p2.locationVector.y * R,
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
});

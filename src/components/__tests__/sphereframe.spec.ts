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
    SEStore.setActionMode({ id: "", name: "" });
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

  describe("with PointTool", () => {
    // it("switches to point tool", async () => {
    //   SEStore.setActionMode({
    //     id: "point",
    //     name: "PointTool"
    //   });
    //   await wrapper.vm.$nextTick();
    //   expect(wrapper.vm.$data.currentTool).toBeInstanceOf(PointHandler);
    // });
    beforeEach(async () => {
      SEStore.setActionMode({
        id: "point",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });

    it("adds a new (foreground) point when clicking on sphere while using PointTool", async () => {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(false /* foreground point */);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(p.locationVector.z).toBeGreaterThan(0);
    });
    it("adds a new (background) point when clicking on sphere while using PointTool", async () => {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(true /* back ground point */);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 1);
      expect(p.locationVector.z).toBeLessThan(0);
    });
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
    it("adds a new line (fg/fg) while in LineTool", async () => {
      await runLineTest(true, true);
    });
    it("adds a new line (fg/bg) while in LineTool", async () => {
      await runLineTest(true, false);
    });
    it("adds a new line (bg/bg) while in LineTool", async () => {
      await runLineTest(false, false);
    });
    it("adds a new line (bg/fg) while in LineTool", async () => {
      await runLineTest(false, true);
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

    it("adds a new segment (fg/fg) while in SegmentTool", async () => {
      await runSegmentTest(true, true);
    });
    it("adds a new segment (fg/bg) while in SegmentTool", async () => {
      await runSegmentTest(true, false);
    });
    it("adds a new segment (bg/fg) while in SegmentTool", async () => {
      await runSegmentTest(false, true);
    });
    it("adds a new segment (bg/bg) while in SegmentTool", async () => {
      await runSegmentTest(false, false);
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
    it("adds a new circle (fg/fg) while in CircleTool", async () => {
      await runCircleTest(true, true);
    });
    it("adds a new circle (fg/bg) while in CircleTool", async () => {
      await runCircleTest(true, false);
    });
    it("adds a new circle (bg/fg) while in CircleTool", async () => {
      await runCircleTest(false, true);
    });
    it("adds a new circle (bg/bg) while in CircleTool", async () => {
      await runCircleTest(false, false);
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

    it("adds a new ellipse (fg/fg/fg) while in EllipseTool", async () => {
      await runEllipseTest(true, true, true);
    });
    it("adds a new ellipse (fg/fg/bg) while in EllipseTool", async () => {
      await runEllipseTest(true, true, false);
    });
    it("adds a new ellipse (fg/bg/fg) while in EllipseTool", async () => {
      await runEllipseTest(true, false, true);
    });
    it("adds a new ellipse (fg/bg/bg) while in EllipseTool", async () => {
      await runEllipseTest(true, false, false);
    });
    it("adds a new ellipse (bg/fg/fg) while in EllipseTool", async () => {
      await runEllipseTest(false, true, true);
    });
    it("adds a new ellipse (bg/fg/bg) while in EllipseTool", async () => {
      await runEllipseTest(false, true, false);
    });
    it("adds a new ellipse (bg/bg/fg) while in EllipseTool", async () => {
      await runEllipseTest(false, false, true);
    });
    it("adds a new ellipse (bg/bg/bg) while in EllipseTool", async () => {
      await runEllipseTest(false, false, false);
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

    it("adds a new (foreground) point and its antipodal when clicking on sphere while using PointTool", async () => {
      await runAntipodeTest(true);
    });

    it("adds a new (background) point and its antipodal when clicking on sphere while using PointTool", async () => {
      await runAntipodeTest(false);
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
      SEStore.setActionMode({
        id: "perpendicular",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
    });
    async function runPerpendicularToLineTest(
      foregroundPoint: boolean
    ): Promise<void> {
      const lineCount = SEStore.seLines.length;
      await drawOneDimensional("line", 150, 170, true, 113, 200, true);
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
      await clickAt(61, 93); // Select the point
      await clickAt(150, 170); // select the line

      expect(SEStore.seLines.length).toBeGreaterThanOrEqual(lineCount + 2);
      const newLine = SEStore.seLines[lineCount + 1];
      const angle = referenceLine.normalVector.angleTo(newLine.normalVector);

      // Verify the angle between the two lines
      expect(angle.toDegrees()).toBeCloseTo(90, 3);
      // console.debug("Angle between two lines", angle.toDegrees());
    }

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

    it("adds a line thru a foreground point perpendicular to another line", async () => {
      await runPerpendicularToLineTest(true);
    });
    it("adds a line thru a background point perpendicular to another line", async () => {
      await runPerpendicularToLineTest(false);
    });

    it("adds a line thru a foreground point perpendicular to a segment (fg/fg) line", async () => {
      await runPerpendicularToSegmentTest(true, true, true);
    });
    it("adds a line thru a foreground point perpendicular to a segment (fg/bg) line", async () => {
      await runPerpendicularToSegmentTest(true, true, false);
    });
    it("adds a line thru a foreground point perpendicular to a segment (bg/fg) line", async () => {
      await runPerpendicularToSegmentTest(true, false, true);
    });
    it("adds a line thru a foreground point perpendicular to a segment (bg/bg) line", async () => {
      await runPerpendicularToSegmentTest(true, false, false);
    });
    it("adds a line thru a background point perpendicular to a segment (fg/fg) line", async () => {
      await runPerpendicularToSegmentTest(false, true, true);
    });
    it("adds a line thru a background point perpendicular to a segment (fg/bg) line", async () => {
      await runPerpendicularToSegmentTest(false, true, false);
    });
    it("adds a line thru a background point perpendicular to a segment (bg/fg) line", async () => {
      await runPerpendicularToSegmentTest(false, false, true);
    });
    it("adds a line thru a background point perpendicular to a segment (bg/bg) line", async () => {
      await runPerpendicularToSegmentTest(false, false, false);
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

    it("adds a line thru a foreground point perpendicular to a circle (fg/fg) line", async () => {
      await runPerpendicularToCircleTest(true, true, true);
    });
    it("adds a line thru a foreground point perpendicular to a circle (fg/bg) line", async () => {
      await runPerpendicularToCircleTest(true, true, false);
    });
    it("adds a line thru a foreground point perpendicular to a circle (bg/fg) line", async () => {
      await runPerpendicularToCircleTest(true, false, true);
    });
    it("adds a line thru a foreground point perpendicular to a circle (bg/bg) line", async () => {
      await runPerpendicularToCircleTest(true, false, false);
    });
    it("adds a line thru a background point perpendicular to a circle (fg/fg) line", async () => {
      await runPerpendicularToCircleTest(false, true, true);
    });
    it("adds a line thru a background point perpendicular to a circle (fg/bg) line", async () => {
      await runPerpendicularToCircleTest(false, true, false);
    });
    it("adds a line thru a background point perpendicular to a circle (bg/fg) line", async () => {
      await runPerpendicularToCircleTest(false, false, true);
    });
    it("adds a line thru a background point perpendicular to a circle (bg/bg) line", async () => {
      await runPerpendicularToCircleTest(false, false, false);
    });
  });
});

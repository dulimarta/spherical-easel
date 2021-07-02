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

  async function makePoint(isBackground: boolean): Promise<SEPoint> {
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeFalsy();
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();
    await target.trigger("mousemove", {
      clientX: TEST_MOUSE_X,
      clientY: TEST_MOUSE_Y,
      shiftKey: isBackground
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    await target.trigger("mousedown", {
      clientX: TEST_MOUSE_X,
      clientY: TEST_MOUSE_Y,
      shiftKey: isBackground
    });
    await target.trigger("mouseup", {
      clientX: TEST_MOUSE_X,
      clientY: TEST_MOUSE_Y,
      shiftKey: isBackground
    });
    // expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    // expect(commitSpy).toHaveBeenCalledWith("addPoint", expect.anything());
    await wrapper.vm.$nextTick();
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

  describe("with LineTool", () => {
    async function runLineTest(
      isPoint1Foreground: boolean,
      isPoint2Foreground: boolean
    ): Promise<void> {
      SEStore.setActionMode({
        id: "line",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      const endX = TEST_MOUSE_X + 10;
      const endY = TEST_MOUSE_Y - 10;
      const prevLineCount = SEStore.seLines.length;
      await dragMouse(
        TEST_MOUSE_X,
        TEST_MOUSE_Y,
        !isPoint1Foreground,
        endX,
        endY,
        !isPoint2Foreground
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
        -TEST_MOUSE_Y,
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
    it("add a new line (fg/fg) while in LineTool", async () => {
      await runLineTest(true, true);
    });
    it("add a new line (fg/bg) while in LineTool", async () => {
      await runLineTest(true, false);
    });
    it("add a new line (bg/bg) while in LineTool", async () => {
      await runLineTest(false, false);
    });
    it("add a new line (bg/fg) while in LineTool", async () => {
      await runLineTest(false, true);
    });
  });

  describe("with SegmentTool", () => {
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

    it("add a new segment (fg/fg) while in SegmentTool", async () => {
      await runSegmentTest(true, true);
    });
    it("add a new segment (fg/bg) while in SegmentTool", async () => {
      await runSegmentTest(true, false);
    });
    it("add a new segment (bg/fg) while in SegmentTool", async () => {
      await runSegmentTest(false, true);
    });
    it("add a new segment (bg/bg) while in SegmentTool", async () => {
      await runSegmentTest(false, false);
    });
  });

  describe("with CircleTool", () => {
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

  describe("with AntipodalPoint tool", () => {
    async function runAntipodeTest(isForeground: boolean) {
      const prevPointCount = SEStore.sePoints.length;
      const p = await makePoint(isForeground);
      expect(SEStore.sePoints.length).toBe(prevPointCount + 2);
      const a = SEStore.sePoints[prevPointCount];
      const b = SEStore.sePoints[prevPointCount + 1];
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
      // const prevPointCount = SEStore.sePoints.length;
      // const p = await makePoint(true /* back ground point */);
      // expect(SEStore.sePoints.length).toBe(prevPointCount + 2);
      // const a = SEStore.sePoints[prevPointCount];
      // const b = SEStore.sePoints[prevPointCount + 1];
      // expect(a.locationVector.x).toBe(-b.locationVector.x);
      // expect(a.locationVector.y).toBe(-b.locationVector.y);
      // expect(a.locationVector.z).toBe(-b.locationVector.z);
      await runAntipodeTest(false);
    });
  });
  // describe("Intersection points ", () => {
  //   // fail("Incomplete test");
  // });
});

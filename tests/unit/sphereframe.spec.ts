import SphereFrame from "@/components/SphereFrame.vue";
import { Wrapper, shallowMount, createLocalVue } from "@vue/test-utils";
// import { Store } from "vuex";
import Vuex from "vuex";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import PointHandler from "@/eventHandlers/PointHandler";
import Vue from "vue";
import realStore from "@/store";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Vector3 } from "three";

expect.extend({
  /**
   * Verify that two vectors are close enough within some precision
   * @param received the first vector
   * @param expected the second vector
   * @param precision the desired precision (number of decimal places)
   */
  toBeVector3CloseTo(received: Vector3, expected: Vector3, precision: number) {
    // const precision = 3;
    const pass = received.distanceTo(expected) < Math.pow(10, -precision);
    return {
      pass,
      message: () =>
        received.toFixed(precision) +
        (pass ? "matches" : "does not match") +
        expected.toFixed(precision)
    };
  },

  toBeNonZero(received: Vector3) {
    const out = received.x > 0;
    return {
      pass: out,
      message: () => "Non Zero Expectation"
    };
  }
});

describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<SphereFrame>;
  let localVue;
  beforeEach(() => {
    localVue = createLocalVue();
    localVue.use(Vuex);
    wrapper = shallowMount(SphereFrame, { store: realStore, localVue });

    // It is important to reset the actionMode back to subsequent
    // mutation to actionMode will trigger a Vue Watch update
    wrapper.vm.$store.commit("setActionMode", { id: "", name: "" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("is an instance", () => {
    expect(wrapper.exists).toBeTruthy();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("has SVG element", () => {
    const canvas = wrapper.find("#responsiveBox svg");
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

  it("switches to point tool", async () => {
    wrapper.vm.$store.commit("setActionMode", {
      id: "point",
      name: "PointTool"
    });
    // wrapper.vm.$data.actionMode = "point";
    await Vue.nextTick();
    // console.debug(wrapper.vm.$data.currentTool);
    expect(wrapper.vm.$data.currentTool).toBeInstanceOf(PointHandler);
  });

  const TEST_MOUSE_X = 111;
  const TEST_MOUSE_Y = 137;

  async function makePoint(isBackground: boolean): Promise<SEPoint> {
    wrapper.vm.$store.commit("setActionMode", {
      id: "point",
      name: "Tool Name does not matter"
    });

    await Vue.nextTick();
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeFalsy();
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();
    await target.trigger("mousemove", {
      clientX: TEST_MOUSE_X,
      clientY: TEST_MOUSE_Y,
      shiftKey: isBackground
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    const prevPointCount = wrapper.vm.$store.state.points.length;
    await target.trigger("mousedown", {
      clientX: TEST_MOUSE_X,
      clientY: TEST_MOUSE_Y,
      shiftKey: isBackground
    });
    await target.trigger("mouseup", {
      clientX: 111,
      clientY: 137,
      shiftKey: isBackground
    });
    // expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    // expect(commitSpy).toHaveBeenCalledWith("addPoint", expect.anything());
    await Vue.nextTick();
    const newPointCount = wrapper.vm.$store.state.points.length;
    expect(newPointCount).toBe(prevPointCount + 1);
    return wrapper.vm.$store.state.points[prevPointCount] as SEPoint;
  }
  it("adds a new (foreground) point when clicking on sphere while using PointTool", async () => {
    const p = await makePoint(false /* foreground point */);
    expect(p.positionOnSphere.z).toBeGreaterThan(0);
  });

  it("adds a new (background) point when clicking on sphere while using PointTool", async () => {
    const p = await makePoint(true /* back ground point */);
    expect(p.positionOnSphere.z).toBeLessThan(0);
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
    return await Vue.nextTick();
  }

  it("add a new line (fg/fg) while in LineTool", async () => {
    wrapper.vm.$store.commit("setActionMode", {
      id: "line",
      name: "Tool Name does not matter"
    });
    await Vue.nextTick();
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;

    const prevLineCount = wrapper.vm.$store.state.lines.length;
    await dragMouse(TEST_MOUSE_X, TEST_MOUSE_Y, false, endX, endY, false);
    // await Vue.nextTick();
    const newLineCount = wrapper.vm.$store.state.lines.length;
    expect(newLineCount).toBe(prevLineCount + 1);
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord = Math.sqrt(
      R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
    );
    const endZCoord = Math.sqrt(R * R - endX * endX - endY * endY);
    const newLine: SELine = wrapper.vm.$store.state.lines[prevLineCount];

    // Start vector is foreground
    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      startZCoord
    ).normalize();

    // End vector is foreground
    const endVector = new Vector3(endX, -endY, endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    expect(newLine.startPoint.positionOnSphere).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newLine.endPoint.positionOnSphere).toBeVector3CloseTo(endVector, 3);
    expect(newLine.normalDirection).toBeVector3CloseTo(dir, 3);
  });

  it("add a new line (fg/bg) while in LineTool", async () => {
    wrapper.vm.$store.commit("setActionMode", {
      id: "line",
      name: "Tool Name does not matter"
    });
    await Vue.nextTick();
    const prevLineCount = wrapper.vm.$store.state.lines.length;
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    await dragMouse(TEST_MOUSE_X, TEST_MOUSE_Y, false, endX, endY, true);
    const newLineCount = wrapper.vm.$store.state.lines.length;
    expect(newLineCount).toBe(prevLineCount + 1);
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord = Math.sqrt(
      R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
    );
    const endZCoord = Math.sqrt(R * R - endX * endX - endY * endY);
    const newLine: SELine = wrapper.vm.$store.state.lines[prevLineCount];

    // Start vector is foreground
    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      startZCoord
    ).normalize();

    // End vector is background
    const endVector = new Vector3(endX, -endY, -endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    expect(newLine.startPoint.positionOnSphere).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newLine.endPoint.positionOnSphere).toBeVector3CloseTo(endVector, 3);
    expect(newLine.normalDirection).toBeVector3CloseTo(dir, 3);
  });

  it("add a new line (bg/bg) while in LineTool", async () => {
    wrapper.vm.$store.commit("setActionMode", {
      id: "line",
      name: "Tool Name does not matter"
    });
    await Vue.nextTick();
    const prevLineCount = wrapper.vm.$store.state.lines.length;
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    await dragMouse(TEST_MOUSE_X, TEST_MOUSE_Y, true, endX, endY, true);
    // await Vue.nextTick();
    const newLineCount = wrapper.vm.$store.state.lines.length;
    expect(newLineCount).toBe(prevLineCount + 1);
    const newLine: SELine = wrapper.vm.$store.state.lines[prevLineCount];
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord = Math.sqrt(
      R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
    );
    const endZCoord = Math.sqrt(R * R - endX * endX - endY * endY);
    // Start vector is background
    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      -startZCoord
    ).normalize();

    // End vector is background
    const endVector = new Vector3(endX, -endY, -endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    expect(newLine.startPoint.positionOnSphere).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newLine.endPoint.positionOnSphere).toBeVector3CloseTo(endVector, 3);
    expect(newLine.normalDirection).toBeVector3CloseTo(dir, 3);
  });

  it("add a new line (bg/fg) while in LineTool", async () => {
    wrapper.vm.$store.commit("setActionMode", {
      id: "line",
      name: "Tool Name does not matter"
    });
    await Vue.nextTick();
    const prevLineCount = wrapper.vm.$store.state.lines.length;
    const endX = TEST_MOUSE_X + 10;
    const endY = TEST_MOUSE_Y - 10;
    await dragMouse(TEST_MOUSE_X, TEST_MOUSE_Y, true, endX, endY, false);
    // await Vue.nextTick();
    const newLineCount = wrapper.vm.$store.state.lines.length;
    expect(newLineCount).toBe(prevLineCount + 1);
    const newLine: SELine = wrapper.vm.$store.state.lines[prevLineCount];
    const R = SETTINGS.boundaryCircle.radius;
    const startZCoord = Math.sqrt(
      R * R - TEST_MOUSE_X * TEST_MOUSE_X - TEST_MOUSE_Y * TEST_MOUSE_Y
    );
    const endZCoord = Math.sqrt(R * R - endX * endX - endY * endY);
    // Start vector is background

    const startVector = new Vector3(
      TEST_MOUSE_X,
      -TEST_MOUSE_Y,
      -startZCoord
    ).normalize();

    // End vector is foreground
    const endVector = new Vector3(endX, -endY, endZCoord).normalize();
    const dir = new Vector3().crossVectors(startVector, endVector).normalize();
    expect(newLine.startPoint.positionOnSphere).toBeVector3CloseTo(
      startVector,
      3
    );
    expect(newLine.endPoint.positionOnSphere).toBeVector3CloseTo(endVector, 3);
    expect(newLine.normalDirection).toBeVector3CloseTo(dir, 3);
  });
});

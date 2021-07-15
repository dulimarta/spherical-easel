import Vue from "*.vue";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";

export const TEST_MOUSE_X = 111;
export const TEST_MOUSE_Y = 137;
import { SEPoint } from "@/models/SEPoint";
import { ActionMode } from "@/types";

/**
 * Simulate mouse click at a specific screen position on the sphere.
 *
 * @param wrapper
 * @param xScreenPos
 * @param yScreenPos
 * @param withShift
 */
export async function mouseClickOnSphere(
  wrapper: Wrapper<Vue>,
  xScreenPos: number,
  yScreenPos: number,
  withShift = false
): Promise<void> {
  const target = wrapper.find("#canvas");

  /** IMPORTANT: the Y-coordinate below is supplied with its sign flipped.
   * This is needed to comply with the 2D transformation applied to the canvas
   */
  await target.trigger("mousemove", {
    clientX: xScreenPos,
    clientY: -yScreenPos,
    shiftKey: withShift
  });
  expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
  await target.trigger("mousedown", {
    clientX: xScreenPos,
    clientY: -yScreenPos,
    shiftKey: withShift
  });
  await target.trigger("mouseup", {
    clientX: xScreenPos,
    clientY: -yScreenPos,
    shiftKey: withShift
  });
}

/**
 * Simulate drawing a point at a specific screen location in the canvas
 * @param wrapper
 * @param xScreen
 * @param yScreen
 * @param isBackground
 */
export async function drawPointAt(
  wrapper: Wrapper<Vue>,
  xScreen: number,
  yScreen: number,
  isBackground = false
): Promise<void> {
  SEStore.setActionMode({
    id: "point",
    name: "Tool Name does not matter"
  });
  await wrapper.vm.$nextTick();
  await mouseClickOnSphere(wrapper, xScreen, yScreen, isBackground);
}

export async function makePoint(
  wrapper: Wrapper<Vue>,
  isBackground: boolean
): Promise<SEPoint> {
  await drawPointAt(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isBackground);
  const count = SEStore.sePoints.length;
  // The most recent point
  return SEStore.sePoints[count - 1] as SEPoint;
}

/**
 * Simulate dragging the mouse between two screen positions
 * @param wrapper
 * @param fromXScreen
 * @param fromYScreen
 * @param fromBg
 * @param toXScreen
 * @param toYScreen
 * @param toBg
 * @returns
 */
export async function dragMouse(
  wrapper: Wrapper<Vue>,
  fromXScreen: number,
  fromYScreen: number,
  fromBg: boolean,
  toXScreen: number,
  toYScreen: number,
  toBg: boolean
): Promise<void> {
  const target = wrapper.find("#canvas");
  expect(target.exists).toBeTruthy();
  await target.trigger("mousemove", {
    clientX: fromXScreen,
    clientY: fromYScreen,
    shiftKey: fromBg
  });
  expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
  await target.trigger("mousedown", {
    clientX: fromXScreen,
    clientY: fromYScreen,
    shiftKey: fromBg
  });
  await target.trigger("mousemove", {
    clientX: toXScreen,
    clientY: toYScreen,
    shiftKey: toBg
  });
  expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
  await target.trigger("mouseup", {
    clientX: toXScreen,
    clientY: toYScreen,
    shiftKey: toBg
  });
  return await wrapper.vm.$nextTick();
}

/**
 *
 * @param wrapper Draw a line, segment, or circle specified by two control points on the screen
 * @param drawMode
 * @param x1
 * @param y1
 * @param isPoint1Foreground
 * @param x2
 * @param y2
 * @param isPoint2Foreground
 */
export async function drawOneDimensional(
  wrapper: Wrapper<Vue>,
  drawMode: ActionMode,
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
  await dragMouse(
    wrapper,
    x1,
    y1,
    !isPoint1Foreground,
    x2,
    y2,
    !isPoint2Foreground
  );
}

/**
 * Simulate drawing an ellipse
 * @param wrapper
 * @param focus1_x
 * @param focus1_y
 * @param isFocus1Foreground
 * @param focus2_x
 * @param focus2_y
 * @param isFocus2Foreground
 * @param x3
 * @param y3
 * @param isPoint3Foreground
 */
export async function drawEllipse(
  wrapper: Wrapper<Vue>,
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
  await mouseClickOnSphere(wrapper, focus1_x, focus1_y, !isFocus1Foreground);
  await mouseClickOnSphere(wrapper, focus2_x, focus2_y, !isFocus2Foreground);
  await mouseClickOnSphere(wrapper, x3, y3, !isPoint3Foreground);
}

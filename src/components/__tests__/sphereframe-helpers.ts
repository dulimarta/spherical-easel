import Vue from "*.vue";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";

export const TEST_MOUSE_X = 111;
export const TEST_MOUSE_Y = 137;
import { SEPoint } from "@/models/SEPoint";

export async function mouseClickOnSphere(
  wrapper: Wrapper<Vue>,
  x: number,
  y: number,
  withShift = false
): Promise<void> {
  const target = wrapper.find("#canvas");
  //   expect(target.exists).toBeTruthy();

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

export async function drawPointAt(
  wrapper: Wrapper<Vue>,
  x: number,
  y: number,
  isBackground = false
): Promise<void> {
  SEStore.setActionMode({
    id: "point",
    name: "Tool Name does not matter"
  });
  await mouseClickOnSphere(wrapper, x, y, isBackground);
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

export async function makePoint(
  wrapper: Wrapper<Vue>,
  isBackground: boolean
): Promise<SEPoint> {
  await drawPointAt(wrapper, TEST_MOUSE_X, TEST_MOUSE_Y, isBackground);
  const count = SEStore.sePoints.length;
  // The most recent point
  return SEStore.sePoints[count - 1] as SEPoint;
}

export async function dragMouse(
  wrapper: Wrapper<Vue>,
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

export async function drawOneDimensional(
  wrapper: Wrapper<Vue>,
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

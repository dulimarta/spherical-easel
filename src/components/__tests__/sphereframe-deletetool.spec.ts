import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  drawOneDimensional,
  drawPointAt,
  makePoint,
  mouseClickOnSphere
} from "./sphereframe-helper";
import { Vector3 } from "three";
import SETTINGS from "@/global-settings";

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

  it("deletes lines", async () => {
    async function runDeleteLineTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      // TODO: find a better way to use points at "general location"
      const R = SETTINGS.boundaryCircle.radius;
      const prevLineCount = SEStore.seLines.length;
      await drawOneDimensional(
        wrapper,
        "line",
        0,
        0,
        isPt1Foreground,
        100,
        0,
        isPt2Foreground
      );
      const newLineCount = SEStore.seLines.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newLineCount).toEqual(prevLineCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      await mouseClickOnSphere(wrapper, 80, 0);
      expect(SEStore.seLines.length).toEqual(prevLineCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteLineTest(pt1, pt2);
      }
  });

  it.only("deletes segments", async () => {
    async function runDeleteSegmentTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      // TODO: find a better way to use points at "general location"
      const R = SETTINGS.boundaryCircle.radius;
      const prevSegmentCount = SEStore.seSegments.length;
      await drawOneDimensional(
        wrapper,
        "segment",
        0,
        0,
        isPt1Foreground,
        100,
        0,
        isPt2Foreground
      );
      const newSegmentCount = SEStore.seSegments.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newSegmentCount).toEqual(prevSegmentCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      /* The segment is on the right hemisphere so the first point location will
      dictate the click position */
      await mouseClickOnSphere(wrapper, 80, 0, !isPt1Foreground);
      expect(SEStore.seSegments.length).toEqual(prevSegmentCount);
    }

    for (const pt1 of [false, true])
      for (const pt2 of [false, true]) {
        SEStore.init();
        await runDeleteSegmentTest(pt1, pt2);
      }
  });

  it.only("deletes circles", async () => {
    async function runDeleteCircleTest(
      isPt1Foreground: boolean,
      isPt2Foreground: boolean
    ): Promise<void> {
      // TODO: find a better way to use points at "general location"
      const R = SETTINGS.boundaryCircle.radius;
      const prevCircleCount = SEStore.seCircles.length;
      await drawOneDimensional(
        wrapper,
        "circle",
        0,
        100,
        isPt1Foreground,
        -100,
        0,
        isPt2Foreground
      );
      const newCircleCount = SEStore.seCircles.length;
      const newPointCount = SEStore.sePoints.length;
      expect(newCircleCount).toEqual(prevCircleCount + 1);
      expect(newPointCount).toBeGreaterThanOrEqual(2);
      SEStore.setActionMode({
        id: "delete",
        name: "Tool Name does not matter"
      });
      await wrapper.vm.$nextTick();
      /* The segment is on the right hemisphere so the first point location will
      dictate the click position */
      await mouseClickOnSphere(wrapper, 0, 100, !isPt1Foreground);
      expect(SEStore.seCircles.length).toEqual(prevCircleCount);
    }

    // TODO: add two more variations that mix fg and bg points
    SEStore.init();
    await runDeleteCircleTest(true, true);
    SEStore.init();
    await runDeleteCircleTest(false, false);
  });

  xit("deletes ellipses", () => {});
  xit("deletes antipodes", () => {});
  xit("deletes polar", () => {});
});

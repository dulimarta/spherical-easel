import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  mouseClickOnSphere,
  drawOneDimensional,
  dragMouse
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Measured Circle Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });

  it("adds a new circle (and measurement) while using MeasuredCircleTool using a drawn line segment", async () => {
    // The process was was completed in spherical easel and then I used the coordinate measuring tool to find the locations of all points and click locations(use point on object)
    const prevCircleCount = SEStore.seCircles.length;
    const prevExpressionCount = SEStore.expressions.length;
    const prevPointCount = SEStore.sePoints.length;
    await drawOneDimensional(
      wrapper,
      "segment",
      -0.762 * R,
      0.336 * R,
      true,
      -0.449 * R,
      0.748 * R,
      true
    );
    await wrapper.vm.$nextTick();

    SEStore.setActionMode({
      id: "measuredCircle",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();

    // Click to create the center of the sphere and drag to the line segment
    await dragMouse(wrapper, 0 * R, 0 * R, false, -0.558 * R, 0.644 * R, false); // true means that the click was to the back  of the sphere with the shift key pressed

    // // WARNING: TWO mouseClickOnSphere was NOT the same as a dragMouse between the same two locations.
    // // I don't know why.
    // // Click to create the center of the sphere
    // await mouseClickOnSphere(wrapper, 0 * R, 0 * R, false); // true means that the click was to the back  of the sphere with the shift key pressed
    // await wrapper.vm.$nextTick();

    // // Click on the line segment to create the measured circle
    // await mouseClickOnSphere(wrapper, -0.558 * R, 0.644 * R, false);
    // await wrapper.vm.$nextTick();

    // there should be two new points that are the endpoints of the line segment and one center of the measured circle
    expect(
      SEStore.sePoints.filter(p => !(p instanceof SEIntersectionPoint)).length
    ).toEqual(prevPointCount + 3);

    // There should be 5 total points (two are not usercreate and are the intersection between the circle and the line segment)
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 5);

    // there should be a new measurement of the line segment
    expect(SEStore.expressions.length).toEqual(prevExpressionCount + 1);

    // there should be a new circle
    expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
  });
});

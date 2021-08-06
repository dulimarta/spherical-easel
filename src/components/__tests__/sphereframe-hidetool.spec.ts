import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import {
  drawEllipse,
  drawOneDimensional,
  drawPointAt,
  mouseClickOnSphere
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";

const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Template", () => {
  let wrapper: Wrapper<Vue>;
  let showingSpy: jest.SpyInstance;
  beforeAll(() => {
    showingSpy = jest.spyOn(SENodule.prototype, "showing", "set");
  });
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("hides points", async () => {
    // (1) Create a point
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 79, 173);
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 1);
    const aPoint = SEStore.sePoints[prevPointCount];

    // (2) Hide the point
    SEStore.setActionMode({
      id: "hide",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    await mouseClickOnSphere(
      wrapper,
      aPoint.locationVector.x * R,
      aPoint.locationVector.y * R,
      aPoint.locationVector.z < 0
    );
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides lines", async () => {
    // (1) Create a point
    const prevLineCount = SEStore.seLines.length;
    await drawOneDimensional(wrapper, "line", -79, 173, true, 93, 127, true);
    expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
    const aLine = SEStore.seLines[prevLineCount];

    // (2) Hide the line
    SEStore.setActionMode({
      id: "hide",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const target = aLine.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides segments", async () => {
    // (1) Create a point
    const prevSegmentCount = SEStore.seSegments.length;
    await drawOneDimensional(wrapper, "segment", -79, 173, true, 93, 127, true);
    expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
    const aSegment = SEStore.seSegments[prevSegmentCount];

    // (2) Hide the segment
    SEStore.setActionMode({
      id: "hide",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const target = aSegment.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides circles", async () => {
    // (1) Create a circle
    const prevCircleCount = SEStore.seCircles.length;
    await drawOneDimensional(wrapper, "circle", -79, 173, true, 93, 127, true);
    expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
    const aCircle = SEStore.seCircles[prevCircleCount];

    // (2) Hide the Circle
    SEStore.setActionMode({
      id: "hide",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const target = aCircle.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides ellipses", async () => {
    // (1) Create a circle
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(wrapper, -79, 173, true, 93, 127, true, 17, -71, true);
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount + 1);
    const anEllipse = SEStore.seEllipses[prevEllipseCount];

    // (2) Hide the Ellipse
    SEStore.setActionMode({
      id: "hide",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const target = anEllipse.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });
});

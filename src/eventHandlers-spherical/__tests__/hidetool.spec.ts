import { MockInstance, vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  drawEllipse,
  drawOneDimensional,
  drawPointAt,
  mouseClickOnSphere
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings-spherical";
import { SENodule } from "@/models-spherical/SENodule";
import { Vector3 } from "three";
import { Command } from "@/commands-spherical/Command";
import Handler from "../HideObjectHandler";

const R = SETTINGS.boundaryCircle.radius;

describe("Hide Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let showingSpy: MockInstance;
  let SEStore: SEStoreType;
  beforeAll(() => {
    showingSpy = vi.spyOn(SENodule.prototype, "showing", "set");
  });
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
    SEStore.init();
  });

  it("hides points", async () => {
    // (1) Create a point
    SEStore.setActionMode("point");
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 79, 173);
    expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(prevPointCount + 1);
    const aPoint = SEStore.sePoints[prevPointCount];

    // (2) Hide the point
    SEStore.setActionMode("hide");
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
    SEStore.setActionMode("line");
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seLines.length).toEqual(prevLineCount + 1);
    const aLine = SEStore.seLines[prevLineCount];

    // (2) Hide the line
    SEStore.setActionMode("hide");
    await wrapper.vm.$nextTick();
    const target = aLine.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides segments", async () => {
    // (1) Create a segment
    SEStore.setActionMode("segment");
    const prevSegmentCount = SEStore.seSegments.length;
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seSegments.length).toEqual(prevSegmentCount + 1);
    const aSegment = SEStore.seSegments[prevSegmentCount];

    // (2) Hide the segment
    SEStore.setActionMode("hide");
    await wrapper.vm.$nextTick();
    const target = aSegment.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  it("hides circles", async () => {
    // (1) Create a circle
    SEStore.setActionMode("circle");
    const prevCircleCount = SEStore.seCircles.length;
    await drawOneDimensional(wrapper, -79, 173, true, 93, 127, true);
    expect(SEStore.seCircles.length).toEqual(prevCircleCount + 1);
    const aCircle = SEStore.seCircles[prevCircleCount];

    // (2) Hide the Circle
    SEStore.setActionMode("hide");
    await wrapper.vm.$nextTick();
    const target = aCircle.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });

  // The ellipse hide test triggers a runtime error in TwoJS
  it.skip("hides ellipses", async () => {
    // (1) Create a circle
    SEStore.setActionMode("ellipse");
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(wrapper, -79, 173, true, 93, 127, true, 17, -71, true);
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount + 1);
    const anEllipse = SEStore.seEllipses[prevEllipseCount];

    // (2) Hide the Ellipse
    SEStore.setActionMode("hide");
    await wrapper.vm.$nextTick();
    const target = anEllipse.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(wrapper, target.x * R, target.y * R, target.z < 0);
    expect(showingSpy).toHaveBeenCalled();
    expect(showingSpy).toHaveBeenCalledWith(false);
  });
});

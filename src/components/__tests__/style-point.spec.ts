import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import Nodule, { DisplayStyle } from "../../plottables/Nodule";
import { makePoint } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { StyleCategory } from "@/types/Styles";

const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Template", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
  });

  it("correct default styling of a point", async () => {
    const prevPointCount = SEStore.sePoints.length;
    const p = await makePoint(wrapper, false);
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 1);
    expect(p.showing).toBe(true);

    const pointFrontStyle = p.ref.defaultStyleState(StyleCategory.Front);
    const pointBackStyle = p.ref.defaultStyleState(StyleCategory.Back);
    expect(pointFrontStyle.fillColor).toBe("hsla(0, 100%, 75%, 1)");
    expect(pointFrontStyle.pointRadiusPercent).toBe(100);
    expect(pointFrontStyle.strokeColor).toBe("hsla(240, 55%, 55%, 1)");
    expect(pointBackStyle.dynamicBackStyle).toBe(true);
    expect(pointBackStyle.fillColor).toBe(Nodule.contrastFillColor(SETTINGS.point.drawn.fillColor.front));
    expect(pointBackStyle.pointRadiusPercent).toBe(90);
    expect(pointBackStyle.strokeColor).toBe(Nodule.contrastStrokeColor(SETTINGS.point.drawn.strokeColor.front));
  });

  it("update point fill and stroke color", async () => {
    const prevPointCount = SEStore.sePoints.length;
    const p = await makePoint(wrapper, false);
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 1);
    expect(p.showing).toBe(true);

    var pointCurrentFrontFill = p.ref.currentStyleState(StyleCategory.Front);
    pointCurrentFrontFill.fillColor = "hsla(234, 100%, 75%, 1)";
    expect(pointCurrentFrontFill.fillColor).not.toBe("hsla(0, 100%, 75%, 1)");

    var pointCurrentStrokeColor = p.ref.currentStyleState(StyleCategory.Front);
    pointCurrentStrokeColor.strokeColor = "hsla(234, 100%, 100%, 1)";
    expect(pointCurrentStrokeColor.fillColor).not.toBe("hsla(240, 55%, 55%, 1)");
  });
});

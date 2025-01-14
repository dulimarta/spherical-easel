import SphereFrame from "@/components/SphereFrame.vue";
import { vi } from "vitest";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { makePoint } from "@/eventHandlers/__tests__/sphereframe-helper"
import SETTINGS from "@/global-settings";
import { createTestingPinia } from "@pinia/testing";
import { StyleCategory } from "@/types/Styles";
import Nodule from "@/plottables/Nodule";
import MouseHandler from "@/eventHandlers/MouseHandler";
import { SENodule } from "@/models/internal";
import { Command } from "@/commands/Command";

const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Template", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
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
    wrapper = out.wrapper;
    SEStore = useSEStore(testPinia);
    SENodule.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    MouseHandler.setGlobalStore(SEStore);
  });

  it("correct default styling of a point", async () => {
    const prevPointCount = SEStore.sePoints.length;
    SEStore.setActionMode("point")
    const p = await makePoint(wrapper, SEStore, false);
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
    SEStore.setActionMode("point")
    const p = await makePoint(wrapper, SEStore, false);
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

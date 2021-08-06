import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import Vue from "vue";
import "@/../tests/jest-custom-matchers";
import { Wrapper } from "@vue/test-utils";

/*
TODO: the test cases below create the object using newly created node.
Should we include test cases where the tools select existing objects
during the creation. For instance, when creating a line one of the endpoints 
is already on the sphere
*/
describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<Vue>;
  let svgCanvas: Wrapper<Vue>;
  beforeEach(async () => {
    // It is important to reset the actionMode back to subsequent
    // mutation to actionMode will trigger a Vue Watch update
    wrapper = createWrapper(SphereFrame);
    svgCanvas = wrapper.find("#canvas");
    SEStore.init();
    SEStore.setActionMode({ id: "select", name: "" });
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
});

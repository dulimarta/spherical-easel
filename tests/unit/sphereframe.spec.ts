import SphereFrame from "@/components/SphereFrame.vue";
import { Wrapper, shallowMount, createLocalVue } from "@vue/test-utils";
// import { Store } from "vuex";
import Vuex from "vuex";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import PointHandler from "@/eventHandlers/PointHandler";
import Vue from "vue";
import realStore from "@/store";

describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<SphereFrame>;
  let localVue;
  beforeEach(() => {
    localVue = createLocalVue();
    localVue.use(Vuex);
    wrapper = shallowMount(SphereFrame, { store: realStore, localVue });

    // It is important to reset the editMode back to subsequent
    // mutation to editMode will trigger a Vue Watch update
    wrapper.vm.$store.commit("setEditMode", { id: "", name: "" });
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
    wrapper.vm.$store.commit("setEditMode", { id: "point", name: "PointTool" });
    // wrapper.vm.$data.editMode = "point";
    await Vue.nextTick();
    // console.debug(wrapper.vm.$data.currentTool);
    expect(wrapper.vm.$data.currentTool).toBeInstanceOf(PointHandler);
  });

  it("generates a new (foreground) point when clicking on sphere while using PointTool", async () => {
    // const commitSpy = jest.spyOn(realStore, "commit");

    // wrapper = shallowMount(SphereFrame, { store: realStore, localVue });
    wrapper.vm.$store.commit("setEditMode", {
      id: "point",
      name: "Tool Name does not matter"
    });

    await Vue.nextTick();
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeFalsy();
    const target = wrapper.find("#canvas");
    expect(target.exists).toBeTruthy();
    await target.trigger("mousemove", {
      clientX: 111,
      clientY: 137
    });
    expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    const prevPointCount = wrapper.vm.$store.state.points.length;
    await target.trigger("mousedown", {
      clientX: 111,
      clientY: 137
    });
    await target.trigger("mouseup", {
      clientX: 111,
      clientY: 137
    });
    // expect(wrapper.vm.$data.currentTool.isOnSphere).toBeTruthy();
    // expect(commitSpy).toHaveBeenCalledWith("addPoint", expect.anything());
    await Vue.nextTick();
    const newPointCount = wrapper.vm.$store.state.points.length;
    expect(newPointCount).toBe(prevPointCount + 1);
  });
});

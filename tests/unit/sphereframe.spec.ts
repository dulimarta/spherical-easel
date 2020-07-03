import SphereFrame from "@/components/SphereFrame.vue";
import { Wrapper, shallowMount } from "@vue/test-utils";
import { Store } from "vuex";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";

const mockStore = {
  state: {},
  mutations: {
    setLayers: jest.fn(),
    setZoomTranslation: jest.fn()
  }
};
describe("SphereFrame.vue", () => {
  let wrapper: Wrapper<SphereFrame>;
  let store: Store<unknown>;
  beforeEach(() => {
    store = new Store(mockStore);
    wrapper = shallowMount(SphereFrame, { store });
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
});

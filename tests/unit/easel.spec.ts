import { shallowMount, mount, createLocalVue, Wrapper } from "@vue/test-utils";
import Easel from "@/views/Easel.vue";
import Vue from "vue";
import Vuex, { Store } from "vuex";
import Vuetify from "vuetify";
import { VueConstructor } from "vue/types/umd";
import { AppState } from "@/types";
// import { MockRenderer } from "../stub-modules/MockRenderer"
Vue.use(Vuetify);

// const fakeRenderer = new MockRenderer();
const mockStore = {
  state: {
    editMode: "none",
    layers: [],
    points: [],
    lines: []
  },
  mutations: {
    setSphere: jest.fn(),
    setSphereRadius: jest.fn(),
    setZoomMagnificationFactor: jest.fn(),
    setLayers: jest.fn(),
    setEditMode: jest.fn()
  }
};
describe("Easel.vue", () => {
  let localVue: VueConstructor;
  let store: Store<unknown>;
  let vuetify: typeof Vuetify;
  let wrapper: Wrapper<Easel>;
  beforeEach(() => {
    vuetify = new Vuetify();
    localVue = createLocalVue();
    localVue.use(Vuex);
    store = new Vuex.Store(mockStore);
    wrapper = shallowMount(Easel, {
      mocks: {
        $t: (key: string) => key
      },
      // propsData: {
      //   canvas: null
      // },
      localVue,
      vuetify,
      store
    });
  });

  it("is an instance", () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("switched to tool strategy", async () => {
    wrapper.vm.$store.state.editMode = "point";
    await Vue.nextTick();
    expect(wrapper.vm.$data.currentTool).not.toBeNull();
  });

  describe("Easel.vue with deep mount", () => {
    beforeEach(() => {
      // no code yet
      wrapper = mount(Easel, {
        mocks: { $t: (key: string) => key },
        vuetify,
        store
      });
    });

    it("has multiple split panels", () => {
      // console.debug(wrapper.html());
      const panels = wrapper.findAll(".splitter-pane");
      expect(panels.length).toBeGreaterThan(1);
    });
    it("shows left panel with a v-tab", () => {
      const panels = wrapper.findAll(".splitter-pane");
      const tab = panels.at(0).find(".v-tabs");
      // console.debug(tab.html());
    });
    it("shows buttons with icon in the left panel", async () => {
      // console.debug(wrapper.html());
      const btns = wrapper.findAll("button[value]");
      expect(btns.length).toBeGreaterThan(8);
    });

    it("links button click() to the Vuex store", async () => {
      // console.debug(wrapper.html());
      const btns = wrapper.findAll("button[value]");
      for (let k = 0; k < btns.length; k++) {
        const b = btns.at(k);
        // const txt = b.html().replace(/&quot;/g, "'");
        // console.debug(`Button-${k}:`, txt);
        console.debug(b.attributes().value);
        const obj = JSON.parse(b.attributes().value);
        b.trigger("click");
        await Vue.nextTick();
        expect(mockStore.mutations.setEditMode).toHaveBeenCalled();
        expect(mockStore.mutations.setEditMode).toHaveBeenCalledWith(
          expect.objectContaining({}),
          expect.objectContaining(obj)
        );
      }
    });
    it("has right panel with canvas", () => {
      const panels = wrapper.findAll(".splitter-pane");
      const tab = panels.at(1).find("#canvas svg");
      expect(tab).toBeDefined();
    });
  });
});

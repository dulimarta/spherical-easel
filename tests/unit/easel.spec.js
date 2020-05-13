import { shallowMount, createLocalVue } from "@vue/test-utils";
import Easel from "@/views/Easel.vue";
import Vue from "vue";
import Vuex from "vuex";
import Vuetify from "vuetify";
import { MockRenderer } from "../stub-modules/MockRenderer"
Vue.use(Vuetify);

const fakeRenderer = new MockRenderer();
const mockStore = {
  state: {
    editMode: "none"
  },
  mutations: {
    setSphere: jest.fn(),
    // setEditMode: jest.fn()
  }
}
describe("Easel.vue", () => {
  let localVue;
  let store;
  let vuetify;
  let wrapper;
  beforeEach(() => {
    vuetify = new Vuetify();
    localVue = createLocalVue();
    localVue.use(Vuex);
    store = new Vuex.Store(mockStore);
    wrapper = shallowMount(Easel, {
      propsData: {
        renderer: fakeRenderer,
        canvas: null
      },
      localVue,
      vuetify,
      store
    });
  });

  it("is an instance", () => {

    expect(wrapper).toBeDefined();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("initialized current tool to null", () => {
    expect(wrapper.vm.$data.currentTool).toBeNull();
  })

  it("switched to tool strategy", async () => {

    wrapper.vm.$store.state.editMode = "point";
    await Vue.nextTick();
    expect(wrapper.vm.$data.currentTool).not.toBeNull();
    // fireEvent.mouseMove(fakeRenderer.domElement, { clientX: 0, clientY: 0 })
  });

});

import { shallowMount, createLocalVue } from "@vue/test-utils";
import Easel from "@/components/Easel.vue";
import Vue from "vue";
import Vuex from "vuex";
import Vuetify from "vuetify";
import { MockRenderer } from "../stub-modules/MockRenderer"
Vue.use(Vuetify);

const mockStore = {
  mutations: {
    setSphere() { }
  }
}
describe("Easel.vue", () => {
  let localVue;
  let store;
  let vuetify;
  beforeEach(() => {
    vuetify = new Vuetify();
    localVue = createLocalVue();
    localVue.use(Vuex);
    store = new Vuex.Store(mockStore);
  });

  it("is an instance", () => {
    const wrapper = shallowMount(Easel, {
      propsData: {
        renderer: new MockRenderer(),
        canvas: null
      },
      localVue,
      store
    });
    expect(wrapper).toBeDefined();
  });

  xit("shows edit mode buttons", () => {
    const wrapper = shallowMount(Easel, {
      localVue, vuetify,
      store
    });
    // console.debug(wrapper.html())
    const btns = wrapper.findAll("v-tooltip-stub span");
    expect(btns.length).toEqual(7);
  });

});

import { shallowMount, createLocalVue, mount } from "@vue/test-utils";
import App from "@/App.vue";
import Vue from "vue";
import Vuex from "vuex";
import Vuetify from "vuetify";

Vue.use(Vuetify);
import TooltipMock from "./TooltipMock.vue"
import { MockRenderer } from "../stub-modules/MockRenderer";
// const Tooltip = Vue.component('v-tooltip',
//   {
//     template: "<hans><slot name='activator'></slot></hans>"
//   });
describe("App.vue", () => {
  let localVue;
  let store;
  let vuetify;
  beforeEach(() => {
    vuetify = new Vuetify();
    localVue = createLocalVue();
    localVue.use(Vuex);
    store = new Vuex.Store({});
  });

  it("is an instance", () => {
    const wrapper = shallowMount(App, {
      localVue,
      store,
      provide: {
        renderer: new MockRenderer()
      }

    });
    expect(wrapper).toBeDefined();
  });

  xit("shows edit mode buttons", () => {
    const wrapper = shallowMount(App, {
      localVue, vuetify,
      store,
      stubs: {
        'v-tooltip-stub': TooltipMock
      }
    });
    // console.debug(wrapper.html())
    const btns = wrapper.findAll("v-btn-stub");
    expect(btns.length).toEqual(7);
  });

});

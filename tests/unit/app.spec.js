import { shallowMount, createLocalVue, mount } from "@vue/test-utils";
import App from "@/App.vue";
import Vue from "vue";
import Vuex from "vuex";
// import VueRouter from "vue-router";
import Vuetify from "vuetify";

Vue.use(Vuetify);
// import TooltipMock from "./TooltipMock.vue"
import { MockRenderer } from "../stub-modules/MockRenderer";
// const Tooltip = Vue.component('v-tooltip',
//   {
//     template: "<hans><slot name='activator'></slot></hans>"
//   });

const fakeRenderer = new MockRenderer();
// fakeRenderer.extensions = {
//   get: jest.fn().mockReturnValue(true)
// }
describe("App.vue", () => {


  it("is an instance", () => {
    const wrapper = shallowMount(App, {
      store: new Vuex.Store({}),
      provide: {
        renderer: fakeRenderer
      },
      stubs: {
        'router-link': true,
        'router-view': true
      }
    });
    expect(wrapper).toBeDefined();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  describe("App.vue basic tools with (deep) mount", () => {
    let localVue;
    let store;
    let vuetify;
    let wrapper;
    const storeMutations = {
      setEditMode: jest.fn()
    }
    beforeEach(() => {
      vuetify = new Vuetify();
      localVue = createLocalVue();
      localVue.use(Vuex);
      localVue.use(Vuetify);
      store = new Vuex.Store({
        mutations: storeMutations
      });

      // Use "deep" mount so <v-btn>s are accessible to the test environment
      wrapper = mount(App, {
        localVue, vuetify, store, provide: {
          renderer: fakeRenderer
        },
        data: () => ({
          // leftDrawerMinified: false
        }),
        stubs: {
          'router-link': true,
          'router-view': true
        }
      });
    });

    it("it shows 6 basic tool buttons", () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      expect(basicTools).toHaveLength(6)
      // for (let k = 0; k < basicTools.length; k++) {
      //   const b = basicTools.at(k);
      //   console.debug(b.html());
      // }
    })

    it("switches to move tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(1).trigger('click');
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(expect.anything(), "move");
    });

    it("switches to point tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(2).trigger('click');
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(expect.anything(), "point");
    });

    it("switches to line tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(3).trigger('click');
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(expect.anything(), "line");
    });

    it("switches to segment tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(4).trigger('click');
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(expect.anything(), "segment");
    });

    it("switches to circle tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(5).trigger('click');
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(expect.anything(), "circle");
    });

  })

});

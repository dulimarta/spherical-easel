import {
  shallowMount,
  createLocalVue,
  mount,
  Wrapper,
  RouterLinkStub
} from "@vue/test-utils";
import App from "@/App.vue";
import Vue from "vue";
import Vuex from "vuex";
import VueI18n from "vue-i18n";
// import VueRouter from "vue-router";
import Vuetify from "vuetify";

Vue.use(Vuetify);
Vue.use(Vuex);
Vue.use(VueI18n);
Vue.directive("t", () => {
  /*none*/
});
// const i18n = new VueI18n({});
// import TooltipMock from "./TooltipMock.vue"
// import { MockRenderer } from "../stub-modules/MockRenderer";
// const Tooltip = Vue.component('v-tooltip',
//   {
//     template: "<hans><slot name='activator'></slot></hans>"
//   });

// const fakeRenderer = new MockRenderer();
// fakeRenderer.extensions = {
//   get: jest.fn().mockReturnValue(true)
// }
describe("App.vue", () => {
  let wrapper: Wrapper<App>;
  beforeEach(() => {
    wrapper = shallowMount(App, {
      mocks: {
        $t: (key: string) => key
      },
      store: new Vuex.Store({
        mutations: {
          init: jest.fn()
        }
      }),
      // provide: {
      //   renderer: fakeRenderer
      // },
      stubs: {
        "RouterLink": RouterLinkStub,
        "router-view": true
      }
    });
  });
  it("is an instance", () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  describe("App.vue basic tools with (deep) mount", () => {
    let localVue;
    let store;
    let vuetify;
    let wrapper: Wrapper<Vue>;
    const storeMutations = {
      setEditMode: jest.fn(),
      init: jest.fn()
    };
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
        mocks: {
          $t: (key: string) => key
        },
        localVue,
        vuetify,
        store,
        // provide: {
        //   renderer: fakeRenderer
        // },
        data: () => ({
          // leftDrawerMinified: false
        }),
        stubs: {
          "router-link": true,
          "router-view": true
        }
      });
    });
    it("shows link to Vuepress document", () => {
      const docRef = wrapper.find("a[href]");
      expect(docRef.attributes().href).toBe("/docs");
      // console.debug(docRef.html());
    });

    it("contains route to /setting", () => {
      // console.debug(wrapper.html());
      const rLink = wrapper.findAll("router-link-stub");
      expect(rLink.at(0).attributes().to).toBe("/");
      expect(rLink.at(1).attributes().to).toBe("/settings");
    });

    it("shows footer with text", () => {
      const footer = wrapper.find(".v-footer");
      expect(footer.text()).toContain("No tools");
    });

    xit("it shows 6 basic tool buttons", () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      expect(basicTools).toHaveLength(6);
      // for (let k = 0; k < basicTools.length; k++) {
      //   const b = basicTools.at(k);
      //   console.debug(b.html());
      // }
    });

    xit("switches to move tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(1).trigger("click");
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(
        expect.anything(),
        "move"
      );
    });

    xit("switches to point tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(2).trigger("click");
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(
        expect.anything(),
        "point"
      );
    });

    xit("switches to line tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(3).trigger("click");
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(
        expect.anything(),
        "line"
      );
    });

    xit("switches to segment tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(4).trigger("click");
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(
        expect.anything(),
        "segment"
      );
    });

    xit("switches to circle tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(5).trigger("click");
      await Vue.nextTick();
      expect(storeMutations.setEditMode).toHaveBeenCalledWith(
        expect.anything(),
        "circle"
      );
    });
  });
});

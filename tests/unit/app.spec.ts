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
import Vuetify from "vuetify";
import fakeStore from "./mockStore";
import realStore from "@/store";
import { VueConstructor } from "vue/types/umd";
describe("App.vue", () => {
  let wrapper: Wrapper<App>;
  beforeEach(() => {
    wrapper = shallowMount(App, {
      store: new Vuex.Store(fakeStore),
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
    let localVue: VueConstructor;
    let store;
    let vuetify: typeof Vuetify;
    let wrapper: Wrapper<App>;
    beforeEach(() => {
      vuetify = new Vuetify();
      localVue = createLocalVue();
      localVue.use(Vuex);
      localVue.use(Vuetify);
      store = new Vuex.Store(fakeStore);

      // Use "deep" mount so <v-btn>s are accessible to the test environment
      wrapper = mount(App, {
        localVue,
        vuetify,
        store,
        data: () => ({}),
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
      expect(footer.text()).toContain("buttons.NoToolSelected");
    });

    it("shows the name of selected tool", async () => {
      const TEST_TOOL_NAME = "Tool Name Here";
      wrapper = shallowMount(App, {
        store: realStore.original,
        stubs: {
          "router-link": true,
          "router-view": true
        }
      });
      wrapper.vm.$store.direct.commit.setActionMode({
        id: "point",
        name: TEST_TOOL_NAME
      });
      await Vue.nextTick();
      const footer = wrapper.find("v-footer-stub");
      expect(footer.text()).toContain(TEST_TOOL_NAME);
    });

    xit("switches to move tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(1).trigger("click");
      await Vue.nextTick();

      // FIXME: figure out how to access thee spy function
      // expect(fakeStore.mutations.setActionMode).toHaveBeenCalledWith(
      //   expect.anything(),
      //   "move"
      // );
    });

    xit("switches to point tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(2).trigger("click");
      await Vue.nextTick();
      // FIXME: figure out how to access thee spy function
      // expect(fakeStore.mutations.setActionMode).toHaveBeenCalledWith(
      //   expect.anything(),
      //   "point"
      // );
    });

    xit("switches to line tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(3).trigger("click");
      await Vue.nextTick();
      // FIXME: figure out how to access thee spy function
      // expect(fakeStore.mutations.setActionMode).toHaveBeenCalledWith(
      //   expect.anything(),
      //   "line"
      // );
    });

    xit("switches to segment tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(4).trigger("click");
      await Vue.nextTick();
      // FIXME: figure out how to access thee spy function
      // expect(fakeStore.mutations.setActionMode).toHaveBeenCalledWith(
      //   expect.anything(),
      //   "segment"
      // );
    });

    xit("switches to circle tool ", async () => {
      const basicTools = wrapper.findAll("#basicTools .v-btn");
      basicTools.at(5).trigger("click");
      await Vue.nextTick();
      // FIXME: figure out how to access thee spy function
      // expect(fakeStore.mutations.setActionMode).toHaveBeenCalledWith(
      //   expect.anything(),
      //   "circle"
      // );
    });
  });
});

import ToolGroups from "@/components/ToolGroups.vue";
import { Wrapper, shallowMount, createLocalVue } from "@vue/test-utils";
import Vuetify from "vuetify";
describe("ToolGroups", () => {
  let wrapper: Wrapper<ToolGroups>;
  let vuetify: typeof Vuetify;
  const localVue = createLocalVue();
  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = shallowMount(ToolGroups, { vuetify, localVue });
  });

  xit("is an instance", () => {
    expect(wrapper.isVisible).toBeTruthy();
  });

  xit("has sections and groups of toggle buttons", () => {
    const headers = wrapper.findAll("h3");
    const groups = wrapper.findAll("v-btn-toggle-stub");
    // Each group should have a header
    expect(headers.length).toBeGreaterThanOrEqual(groups.length);
  });
});

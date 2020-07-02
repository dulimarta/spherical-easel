import ToolGroups from "@/components/ToolGroups.vue";
import { Wrapper, mount, shallowMount, createLocalVue } from "@vue/test-utils";
import Vuetify from "vuetify";
describe("ToolGroups", () => {
  let wrapper: Wrapper<ToolGroups>;
  let vuetify: typeof Vuetify;
  let localVue = createLocalVue();
  beforeEach(() => {
    vuetify = new Vuetify();
    wrapper = shallowMount(ToolGroups, { vuetify, localVue });
  });

  it("is an instance", () => {
    expect(wrapper.isVisible).toBeTruthy();
  });

  it("has sections and groups of toggle buttons", () => {
    const headers = wrapper.findAll("h3");
    const groups = wrapper.findAll("v-btn-toggle-stub");
    // Each group should have a header
    expect(headers.length).toBeGreaterThanOrEqual(groups.length);
  });

  it("shows buttons in group", () => {
    console.debug(wrapper.html());
    // sdfsdf;
    //   const groups =
  });
});

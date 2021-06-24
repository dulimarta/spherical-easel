import TestComponent from "../SliderForm.vue";
import store from "@/store";
import { createWrapper } from "@/../tests/vue-helper";

describe("SliderForm.vue", () => {
  it("is a component", () => {
    const wrapper = createWrapper(TestComponent);
    expect(wrapper).toBeDefined();
  });

  it("shows numeric text fields", () => {
    const wrapper = createWrapper(TestComponent);
    const inputFields = wrapper.findAll("._test_input");
    expect(inputFields.length).toEqual(3);
  });
});

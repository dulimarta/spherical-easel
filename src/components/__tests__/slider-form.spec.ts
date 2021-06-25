import TestComponent from "../SliderForm.vue";
import store from "@/store";
import { createWrapper } from "@/../tests/vue-helper";
import { SESlider } from "@/models/SESlider";

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

  it("saves new slider to store", async () => {
    const wrapper = createWrapper(TestComponent);
    const inputMin = wrapper.find("#_test_input_min");
    const inputStep = wrapper.find("#_test_input_step");
    const inputMax = wrapper.find("#_test_input_max");
    const addBtn = wrapper.find("#_test_add_slider");
    await inputMin.setValue("0.3");
    await inputStep.setValue("0.02");
    await inputMax.setValue(0.61);

    // console.info("Min", wrapper.vm.$data.sliderMin);
    expect(wrapper.vm.$data.sliderMin).toEqual(0.3);
    expect(wrapper.vm.$data.sliderStep).toEqual(0.02);
    expect(wrapper.vm.$data.sliderMax).toEqual(0.61);
    const countBefore = store.state.se.expressions.length;
    await addBtn.trigger("click");
    const countAfter = store.state.se.expressions.length;
    expect(countAfter).toEqual(countBefore + 1);
    const slider: SESlider = store.state.se.expressions[countBefore];
    expect(slider.min).toEqual(0.3);
    expect(slider.step).toEqual(0.02);
    expect(slider.max).toEqual(0.61);
  });
});

import TestComponent from "../SliderForm.vue";
import { createWrapper } from "$/vue-helper";
import { VueWrapper } from "@vue/test-utils";
import { useSEStore } from "@/stores/se";
import { Command } from "@/commands-spherical/Command";
import { SESlider } from "@/models-spherical/SESlider";

describe("SliderForm.vue", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestComponent);
    wrapper = out.wrapper;
  });
  it("is a component", () => {
    expect(wrapper).toBeDefined();
  });

  it("shows numeric text fields", () => {
    //   const wrapper = createWrapper(TestComponent);
    const inputFields = wrapper.findAll("._test_input");
    expect(inputFields.length).toEqual(3);
  });
});

describe("SliderForm with store access", () => {
  it("saves new slider to store", async () => {
    const { wrapper, testPinia } = createWrapper(TestComponent);
    const inputMin = wrapper.find("#_test_input_min");
    const inputStep = wrapper.find("#_test_input_step");
    const inputMax = wrapper.find("#_test_input_max");
    const addBtn = wrapper.find("#_test_add_slider");
    await inputMin.setValue("0.3");
    await inputStep.setValue("0.02");
    await inputMax.setValue(0.61);
    await wrapper.vm.$nextTick();
    // console.debug(addBtn.html())

    expect((inputMin.element as HTMLInputElement).value).toBeCloseTo(0.3, 2);
    expect((inputStep.element as HTMLInputElement).value).toBeCloseTo(0.02, 2);
    expect((inputMax.element as HTMLInputElement).value).toBeCloseTo(0.61, 2);
    const s = useSEStore(testPinia);
    Command.setGlobalStore(s);
    const countBefore = s.seExpressions.length;
    await addBtn.trigger("click");
    const countAfter = s.seExpressions.length;
    expect(countAfter).toEqual(countBefore + 1);
    const slider: SESlider = s.seExpressions[countBefore] as SESlider;
    expect(slider.min).toEqual(0.3);
    expect(slider.step).toEqual(0.02);
    expect(slider.max).toEqual(0.61);
  });
});

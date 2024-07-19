import TestComponent from "@/components/SESliderItem.vue";
import { createWrapper } from "$/vue-helper";
import { SESlider } from "@/models/SESlider";

describe("SESliderItem.vue", () => {
  it("is a component", () => {
    const aSlider = new SESlider({ min: 0, max: 1, step: 0.02, value: 0.5 });
    aSlider.showing = true;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
          node: aSlider
      },
      stubOptions: {
        VIcon:true
      }
    });
    expect(wrapper.exists()).toBeTruthy();
  });

  it("show current slider value", () => {
    const aSlider = new SESlider({ min: 0, max: 1, step: 0.02, value: 0.32 });
    aSlider.showing = true;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
          node: aSlider
      },
      stubOptions: {
        VIcon:true
      }
    });
    const sliderWidget = wrapper.find("[data-testid=slider]")
    expect(sliderWidget.exists()).toBeTruthy();
    // console.debug("Slider", sliderWidget.html())
    expect(sliderWidget.text()).toContain("0.32")
  });

});

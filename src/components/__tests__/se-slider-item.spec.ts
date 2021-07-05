import TestComponent from "@/components/SESliderItem.vue";
import { Wrapper } from "@vue/test-utils";
import { createWrapper } from "@/../tests/vue-helper";
import { SESlider } from "@/models/SESlider";

describe("SESiderItem.vue", () => {
  it("is a component", () => {
    const aSlider = new SESlider({ min: 0, max: 1, step: 0.02, value: 0.5 });
    aSlider.showing = true;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: aSlider
        }
      }
    });
    expect(wrapper).toBeDefined();
  });
  it("emits an 'object-select' event", async () => {
    const aSlider = new SESlider({ min: 0, max: 1, step: 0.02, value: 0.5 });
    aSlider.showing = true;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: aSlider
        }
      }
    });
    const handle = wrapper.find(".node");
    await handle.trigger("click");
    expect(wrapper.emitted()["object-select"]).toBeTruthy();
    // expect(wrapper.emitted()['ob']).toMatchObject({ name: "object-select" });
  });
});

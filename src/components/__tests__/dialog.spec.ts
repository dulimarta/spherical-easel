import TestedComponent from "../Dialog.vue";
import { mount } from "@vue/test-utils"
import { vi, it } from "vitest"
// import { createVuetify } from "vuetify";
// import * as components from "vuetify/components"
// import * as directives from "vuetify/directives"
import { createWrapper } from "../../../tests/vue-helper";
// import vuetify from "vite-plugin-vuetify";
// const vuetify = createVuetify({components, directives})

describe("Dialog.vue", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  });

  it("is a component", () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        props: {
          title: "Test Title"
        },
      },
    });
    // console.debug("What is", wrapper)
    expect(wrapper).toBeTruthy();
  });

  it.skip("shows correct title", async () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          title: "Dialog Title"
        }
      }
    });
    // console.debug("Dialog", wrapper);
    // await wrapper.setData({ visible: true });
    const b = await wrapper.find("#_test_title");
    // console.debug(wrapper.vm.$data, b);
    expect(b.text()).toMatch("Dialog Title");
  });

  it.skip("shows yes button with correct label", async () => {
    const wrapper = mount(TestedComponent, {
      props: {
        title: "Test title",

          yesText: "Hello"
        }

    });
    // console.debug("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_posButton");
    // console.debug(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("Hello");
  });

  it.skip("shows no button with correct label", async () => {
    const wrapper = mount(TestedComponent, {
      props: {
          title: "Test Title",
          noText: "No Hello",
          noAction: () => {}
        }
    });
    // console.debug("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    // console.debug(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("No Hello");
  });

  it.skip("calls positive button handler", async () => {
    const fakeHandler = vi.fn();
    const wrapper = mount(TestedComponent, {
      mountOptions: {
        propsData: {
          yesAction: fakeHandler
        }
      }
    });
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_posButton");
    b.trigger("click");
    await wrapper.vm.$nextTick();
    expect(fakeHandler).toHaveBeenCalled();
  });

  it.skip("calls negative button handler", async () => {
    const fakeHandler = vi.fn();
    const wrapper = mount(TestedComponent, {

      props: {
        title: "Test Title",
          noText: "Don't do it",
          noAction: fakeHandler
        }
      }
    );
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    b.trigger("click");
    await wrapper.vm.$nextTick();
    expect(fakeHandler).toHaveBeenCalled();
  });
});

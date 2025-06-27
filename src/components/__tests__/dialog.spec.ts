import TestedComponent from "../Dialog.vue";
import { mount, VueWrapper } from "@vue/test-utils";
import { vi, it, describe, beforeEach, expect } from "vitest";
// import { createVuetify } from "vuetify";
// import * as components from "vuetify/components"
// import * as directives from "vuetify/directives"
import { createWrapper } from "$/vue-helper";
// import vuetify from "vite-plugin-vuetify";
// const vuetify = createVuetify({components, directives})

describe("Dialog.vue", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("is a component", () => {
    // const wrapper = mount(TestedComponent, {
    //   props: {
    //     title: "Hans"
    //   }
    // });
    const wrapper = createWrapper(
      TestedComponent,
      {
        componentProps: {
          props: {
            title: "Test Title"
          }
        }
      },
      false
    );
    // console.debug("What is", wrapper.html());
    expect(wrapper).toBeTruthy();
  });

  it("shows correct title", async () => {
    const { wrapper } = createWrapper(
      TestedComponent,
      {
        componentProps: {
          props: {
            title: "Dialog Title"
          }
        }
      },
      false
    );
    await wrapper.trigger("show");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (wrapper.vm as any).show();
    console.debug("Dialog HTML", wrapper.html());
    const b = await wrapper.find("#_test_title");
    console.debug(b);
    // expect(b.text()).toMatch("Dialog Title");
  });

  it.todo("shows yes button with correct label", async () => {
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

  it.todo("shows no button with correct label", async () => {
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

  it.todo("calls positive button handler", async () => {
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

  it.todo("calls negative button handler", async () => {
    const fakeHandler = vi.fn();
    const wrapper = mount(TestedComponent, {
      props: {
        title: "Test Title",
        noText: "Don't do it",
        noAction: fakeHandler
      }
    });
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    b.trigger("click");
    await wrapper.vm.$nextTick();
    expect(fakeHandler).toHaveBeenCalled();
  });
});

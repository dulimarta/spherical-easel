import TestedComponent from "../Dialog.vue";
import { createWrapper } from "../../../tests/vue-helper";

describe("Dialog.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a component", () => {
    const wrapper = createWrapper(TestedComponent);
    expect(wrapper).toBeTruthy();
  });

  it("shows correct title", async () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          title: "Dialog Title"
        }
      }
    });
    // console.debug("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_title");
    // console.debug(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("Dialog Title");
  });

  it("shows yes button with correct label", async () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          yesText: "Hello"
        }
      }
    });
    // console.debug("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_posButton");
    // console.debug(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("Hello");
  });

  it("shows no button with correct label", async () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          noText: "No Hello",
          noAction: () => {}
        }
      }
    });
    // console.debug("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    // console.debug(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("No Hello");
  });

  it("calls positive button handler", async () => {
    const fakeHandler = jest.fn();
    const wrapper = createWrapper(TestedComponent, {
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

  it("calls negative button handler", async () => {
    const fakeHandler = jest.fn();
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          noText: "Don't do it",
          noAction: fakeHandler
        }
      }
    });
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    b.trigger("click");
    await wrapper.vm.$nextTick();
    expect(fakeHandler).toHaveBeenCalled();
  });
});

import Vue from "vue";
import Vuex from "vuex";
import { mount, createLocalVue, shallowMount } from "@vue/test-utils";
import TestedComponent from "../Dialog.vue";
import vuetify from "@/plugins/vuetify";
import Vuetify from "vuetify";

const localVue = createLocalVue();
// localVue.use(Vuex);
localVue.use(Vuetify);
// Vue.use(Vuetify);

const createComponent = (extraOption: any) => {
  return mount(TestedComponent, {
    // vuetify: Vuetify,
    // store,
    localVue,
    extensions: { plugins: [Vuetify] },
    attachToDocument: true,
    ...extraOption
  });
};

describe("Dialog.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a component", () => {
    const wrapper = createComponent({});
    expect(wrapper).toBeTruthy();
  });

  it("shows correct title", async () => {
    const wrapper = createComponent({
      propsData: {
        title: "Dialog Title"
      }
    });
    // console.log("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_title");
    // console.log(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("Dialog Title");
  });

  it("shows yes button with correct label", async () => {
    const wrapper = createComponent({
      propsData: {
        yesText: "Hello"
      }
    });
    // console.log("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_posButton");
    // console.log(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("Hello");
  });

  it("shows no button with correct label", async () => {
    const wrapper = createComponent({
      propsData: {
        noText: "No Hello",
        noAction: () => {}
      }
    });
    // console.log("Dialog", wrapper.html());
    await wrapper.setData({ visible: true });
    const b = wrapper.find("#_test_negButton");
    // console.log(wrapper.vm.$data.visible, b.html());
    expect(b.text()).toMatch("No Hello");
  });

  it("calls positive button handler", async () => {
    const fakeHandler = jest.fn();
    const wrapper = createComponent({
      propsData: {
        yesAction: fakeHandler
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
    const wrapper = createComponent({
      propsData: {
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

import TestedComponent from "../ParametricCoordinate.vue";
import { createWrapper } from "../../../tests/vue-helper";
import { it, vi } from "vitest";
import { VueWrapper, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { useSEStore } from "../../stores/se";
import { setActivePinia, createPinia } from "pinia";
import { SECalculation } from "../../models/SECalculation";
import { createTestingPinia } from "@pinia/testing";
const vuetify = createVuetify({ components, directives });
global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricCoord.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    // setActivePinia(createPinia());
    wrapper = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd",
        modelValue: ""
      }
    });
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    expect(wrapper).toBeTruthy();
  });

  it("shows the placeholder", () => {
    const textArea = wrapper.find("#__test_textarea");
    // console.debug("Element: ", textArea.attributes('placeholder'))
    // console.debug("Text:", textArea.text());
    // console.debug("HTML:", textArea.html());
    expect(textArea.attributes("placeholder")).toBe("ddddd");
  });
});

describe("ParametricCoord.vue with input", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    // setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  it("shows no error", async () => {
    const wrapper = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * 2"
      }
    });
    const textArea = wrapper.find("#__test_textarea");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text().length).toBe(0);
  });

  it("shows error", async () => {
    const wrapper = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd",
        modelValue: "50 * 2 BADTOKEN"
      }
    });
    const textArea = wrapper.find("#__test_textarea");
    // trigger a keydown even to initiate the internal timer
    // and invoke the parser
    await textArea.trigger("keydown.enter");
    await vi.advanceTimersByTimeAsync(3000);

    console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toContain("BADTOKEN");
  });
});

describe("ParametricCoord.vue with store access", () => {
  let testPinia
  beforeEach(() => {
    const c1 = new SECalculation("");
    testPinia = createTestingPinia({
      initialState: {
        se: {
          seExpressions: [c1]
        }
      }
    });
    setActivePinia(testPinia);
    vi.useFakeTimers()
  });
  it("refers to SEExpressions", async () => {
    // const testPinia =
    // store.addExpression(c1)
    const wrapper = mount(TestedComponent, {
      global: {
        plugins: [vuetify, testPinia]
      },
      props: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * M1 + 1.12"
      }
    });
    // console.debug("Testing pinia", testPinia)
    // const store = useSEStore(testPinia);
    // await store.addExpression(c1)
    // console.debug("Exprs", store.seExpressions);
    const textArea = wrapper.find("#__test_textarea");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    console.debug("Text After input", wrapper.text());
    expect(wrapper.text().length).toBe(0);
  });
});

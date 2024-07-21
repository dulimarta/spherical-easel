import TestedComponent from "../ParametricTExpression.vue";
import { createWrapper } from "$/vue-helper";
import { it, vi } from "vitest";
import { VueWrapper, mount } from "@vue/test-utils";
import { useSEStore } from "@/stores/se";
import { SECalculation } from "@/models/SECalculation";
global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricTExpression.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd",
        modelValue: "",
      }
    });
    wrapper = out.wrapper
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    expect(wrapper).toBeTruthy();
  });

  it("shows the label", () => {
    // console.debug("Element: ", textArea.attributes('placeholder'))
    // console.debug("Text:", textArea.text());
    // console.debug("HTML:", wrapper.text());
    expect(wrapper.text()).toContain("cccc");
  });
});

describe("ParametricTExpression.vue with input", () => {
  // let wrapper: VueWrapper;
  beforeEach(() => {
    // setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  it("shows no error when input is a constant expression (default attribute)", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "173 + 6",
      }
    });
    const textInput = wrapper.find("#__test_textfield");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toContain("179")
  });

  it("shows no error when input is a constant expression (explicit attribute)", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "85 + 2",
        constExpr: false
      }
    });
    const textInput = wrapper.find("#__test_textfield");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toContain("87")
  });

  it("shows error on formula with T variable", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "3.0 * t",
        constExpr: true
      }
    });
    const textInput = wrapper.find("#__test_textfield");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable t/i)
  });

  it("shows error on formula with measurement", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "3.0 * M1",
        constExpr: true
      }
    });
    const textInput = wrapper.find("#__test_textfield");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable M1/i)
  });


});

describe("ParametricTExpression.vue with store access", () => {
  // let testPinia
  beforeEach(() => {
    vi.useFakeTimers()
  });

  it("inspects variables in the Pinia store", async () => {

    const { wrapper, testPinia } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * M1 + 0.4",
        constExpr:true
      }
    });
    const s = useSEStore(testPinia)
    await s.addExpression(new SECalculation("0.1")) // This creates a new expression M1
    const textInput = wrapper.find("#__test_textfield");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable M1/i)
  });


});

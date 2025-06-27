import TestedComponent from "../ParametricCuspParameterValues.vue";
import { createWrapper } from "$/vue-helper";
import { it, vi } from "vitest";
import { VueWrapper } from "@vue/test-utils";
// global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricCuspParameterValues.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        modelValue: ""
      }
    });
    wrapper = out.wrapper;
  });

  it("is a component", () => {
    expect(wrapper).toBeTruthy();
  });

  it("shows the label", () => {
    // console.debug("Element: ", textArea.attributes('placeholder'))
    // console.debug("Text:", textArea.text());
    // console.debug("HTML:", wrapper.text());
    expect(wrapper.text()).toContain("cccc");
  });
});

describe("ParametricCuspParameterValues.vue with input", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  it("shows no error when input is a single constant expression", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        modelValue: "173 + 6"
      }
    });
    const textInput = wrapper.find("[data-testid=textfield]");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text().length).toBe(0);
  });

  it("shows no error when input is a comma separated multiple expressions", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        modelValue: "173 + 6, 2 * PI"
      }
    });
    const textInput = wrapper.find("[data-testid=textfield]");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text().length).toBe(0);
  });

  it("shows error on a single formula with T variable", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        modelValue: "3.0 * t"
      }
    });
    const textInput = wrapper.find("[data-testid=textfield]");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable t/i);
  });

  it("shows error on multiple formulas containing T variable", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        modelValue: "123,-4+t,3.0 * 3"
      }
    });
    const textInput = wrapper.find("[data-testid=textfield]");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable t/i);
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
    const textInput = wrapper.find("[data-testid=textfield]");
    await textInput.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toMatch(/variable M1/i);
  });
});

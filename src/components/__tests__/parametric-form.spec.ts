import TestedComponent from "../ExpressionForm.vue";
import { createWrapper } from "../../../tests/vue-helper";
import { it, vi } from "vitest";
import { VueWrapper, mount } from "@vue/test-utils";
import { useSEStore } from "../../stores/se";
import { SECalculation } from "../../models/SECalculation";
global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricForm.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestedComponent, {
    }, false);
    wrapper = out.wrapper
    vi.useFakeTimers();
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    expect(wrapper).toBeTruthy();
  });

  it("has XYZ formula panel", async () => {
    const xyzPanel = wrapper.find('[data-testid=xyz_formula]')
    expect(xyzPanel).toBeTruthy()
    console.debug("Panel before:", xyzPanel.html());
    xyzPanel.trigger('click')
    await vi.advanceTimersByTimeAsync(2000)
    console.debug("After:", xyzPanel.text());
    expect(xyzPanel).toBeTruthy()
  });
});

describe.skip("Formula panel", () => {
  // let wrapper: VueWrapper;
  beforeEach(() => {
    // setActivePinia(createPinia());
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

describe.skip("ParametricTExpression.vue with store access", () => {
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

import TestedComponent from "../ParametricCoordinate.vue";
import { createWrapper } from "$/vue-helper";
import { it, vi } from "vitest";
import { VueWrapper, mount } from "@vue/test-utils";
import { useSEStore } from "@/stores/se";
import { SECalculation } from "@/models-spherical/SECalculation";
// global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricCoord.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd",
        modelValue: "",
        useTValue: 0
      }
    });
    wrapper = out.wrapper;
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    expect(wrapper).toBeTruthy();
  });

  it("shows the placeholder", () => {
    const textArea = wrapper.find("[data-testid=textarea]").find("textarea");
    // console.debug("Element: ", textArea.attributes('placeholder'))
    console.debug("Text:", textArea.text());
    // console.debug("HTML:", textArea.html());
    expect(textArea.attributes("placeholder")).toBe("ddddd");
  });
});

describe("ParametricCoord.vue with input", () => {
  // let wrapper: VueWrapper;
  beforeEach(() => {
    // setActivePinia(createPinia());
    vi.useFakeTimers();
  });
  it("shows no error", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * 2",
        useTValue: 0
      }
    });
    const textArea = wrapper.find("[data-testid=textarea]");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text().length).toBe(0);
  });

  it("shows no error on formula with T value", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "3.0 * t",
        useTValue: 0.7
      }
    });
    const textArea = wrapper.find("[data-testid=textarea]");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text().length).toBe(0);
  });

  it("shows error", async () => {
    const { wrapper } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd",
        modelValue: "50 * 2 BADTOKEN",
        useTValue: 0
      }
    });
    const textArea = wrapper.find("[data-testid=textarea]");
    // trigger a keydown even to initiate the internal timer
    // and invoke the parser
    await textArea.trigger("keydown.enter");
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text())
    expect(wrapper.text()).toContain("BADTOKEN");
  });
});

describe("ParametricCoord.vue with store access", () => {
  // let testPinia
  beforeEach(() => {
    // testPinia = createTestingPinia({stubActions: false,
    // initialState: {
    // se: {
    //   seExpressionIds: [c1.id],
    //   seExpressionMap: aMap
    // }
    // }
    // });
    // setActivePinia(testPinia);
    vi.useFakeTimers();
  });

  it("inspects variables in the Pinia store", async () => {
    const { wrapper, testPinia } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * M1 + 0.4",
        useTValue: 0.4
      }
    });
    const s = useSEStore(testPinia);
    await s.addExpression(new SECalculation("0.1")); // This creates a new expression M1
    const textArea = wrapper.find("[data-testid=textarea]");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text());
    expect(wrapper.text().length).toBe(0);
  });

  it("shows syntax error when expressions include undefined variables", async () => {
    const { wrapper, testPinia } = createWrapper(TestedComponent, {
      componentProps: {
        tooltip: "",
        label: "",
        placeholder: "",
        modelValue: "50 * M3",
        useTValue: 0
      }
    });
    const s = useSEStore(testPinia);
    await s.addExpression(new SECalculation("0.25")); // This creates a new expression M1
    const textArea = wrapper.find("[data-testid=textarea]");
    await textArea.trigger("keydown.enter");
    // Wait for the setTimeout to work
    await vi.advanceTimersByTimeAsync(3000);

    // console.debug("Text After input", wrapper.text());
    expect(wrapper.text()).toContain("M3");
  });
});

import TestedComponent from "../ParametricForm.vue";
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

  it.skip("has XYZ formula panel", async () => {
    const xyzFormulaPanel = wrapper.find('[data-testid=xyz_formula_panel]')
    const xyzFormula = xyzFormulaPanel.find("[data-testid]")
    console.debug("Visible before", xyzFormula.isVisible())
    // console.debug("Panel before:", xyzFormula.html());
    expect(xyzFormula.isVisible()).toBeFalsy()
    await xyzFormulaPanel.trigger('click')
    vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()
    console.debug("Visible after", xyzFormula.isVisible())
    // console.debug("Panel after:", xyzFormula.html());
    // await vi.advanceTimersByTimeAsync(2000)
    // console.debug("After:", xyzPanel.html());
    // expect(xyzPanel.isVisible()).toBeTruthy()
  });
});

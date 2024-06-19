import TestedComponent from "../ParametricCoordinates.vue";
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
import { SEExpression } from "../../models/SEExpression";
const vuetify = createVuetify({ components, directives });
global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricCoordinates.vue basics", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = createWrapper(TestedComponent, {
      componentProps: {
        coordinateData: [
          { tooltip: "X-info", label: "X-label", placeholder: "X-hint" },
          { tooltip: "Y-info", label: "Y-label", placeholder: "Y-hint" },
          { tooltip: "Z-info", label: "Z-label", placeholder: "Z-hint" }
        ],
        modelValue: ["10", "20 * PI", "cos(2*PI)"],
        label: "Coordinates",
        useTValue: 0
      }
    });
    wrapper = out.wrapper;
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    // console.debug(wrapper.html())
    expect(wrapper).toBeTruthy();
  });

  it("shows label", () => {
    expect(wrapper.text()).toContain("Coordinates");
  });

  it("shows input boxes", () => {
    const main = wrapper.find("#__test_coordinates");
    const labels = main.text()
    console.debug("ZZZZ", labels)
    expect(labels).toContain("X-label")
    expect(labels).toContain("Y-label")
    expect(labels).toContain("Z-label")
  });
});

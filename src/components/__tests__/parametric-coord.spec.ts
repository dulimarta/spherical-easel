import TestedComponent from "../ParametricCoordinate.vue";
import { createWrapper } from "../../../tests/vue-helper";
import { it, test } from "vitest";
import { VueWrapper, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { setActivePinia, createPinia } from "pinia";
const vuetify = createVuetify({ components, directives });
global.ResizeObserver = require("resize-observer-polyfill");

describe("ParametricCoord.vue", () => {
  let wrapper: VueWrapper
  beforeEach(() => {
    setActivePinia(createPinia());
    wrapper = createWrapper(TestedComponent, {
      componentProps: {
        name: "aaaa",
        tooltip: "bbbbb",
        label: "cccc",
        placeholder: "ddddd"
      }
    });
  });

  it("is a component", () => {
    // console.debug("Before createWrapper()");
    // console.debug("After mount");
    expect(wrapper).toBeTruthy()
  });

  it("shows the placeholder", () => {
    const textArea = wrapper.find('#__test_textarea')
    // console.debug("Element: ", textArea.attributes('placeholder'))
    // console.debug("Text:", textArea.text());
    // console.debug("HTML:", textArea.html());
    expect(textArea.attributes('placeholder')).toBe("ddddd")
  })
});

import TestedComponent from "../ExpressionForm.vue";
import { createWrapper } from "$/vue-helper";
import { it, vi } from "vitest"
import { useSEStore } from "@/stores/se";
import { Command } from "@/commands/Command"

import { VueWrapper,mount } from "@vue/test-utils";
global.ResizeObserver = require("resize-observer-polyfill");

describe("ExpressionForm.vue", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    const out = createWrapper(TestedComponent, {})
    wrapper = out.wrapper
  });

  afterEach(() => {
    // jest.useRealTimers();
  });

  it("is a component", () => {
    expect(wrapper).toBeTruthy();
  });

  it("has input textarea", () => {
    // console.debug("What is", wrapper)
    const input = wrapper.find("[data-testid=input_expr]");
    expect(input.exists()).toBeTruthy();
  });

  it("has output result box", () => {
    //   const wrapper = createComponent();
    const output = wrapper.find("[data-testid=output_result]");
    expect(output.exists()).toBeTruthy();
  });

  it("parses and evaluates input", async () => {
    vi.useFakeTimers()
    const input = wrapper.find("[data-testid=input_expr]").find('textarea');
    await input.setValue("2 * 13")
    const input2 = wrapper.find("[data-testid=input_expr]");
    // We must trigger a keydown event to activate the calculation
    await input.trigger("keydown", { key: " " });
    vi.advanceTimersByTime(5000);
    // console.debug((input.element as HTMLTextAreaElement).value)
    await wrapper.vm.$nextTick() // Allow VueJS to update screen
    const output = wrapper.find("[data-testid=output_result]")
    // console.debug("What", output.element)
    expect((output.element as HTMLInputElement).value).toEqual("26");
  });
});

describe.only("ExprForm.vue with store access", () => {
  it("adds expressions to the store", async () => {
    const { wrapper, testPinia } = createWrapper(TestedComponent);
    const store = useSEStore(testPinia)
    Command.setGlobalStore(store)
    const exprBefore = store.seExpressions.length
    vi.useFakeTimers()
    const input = wrapper.find("[data-testid=input_expr]").find('textarea');
    await input.setValue("2 * 13")
    // We must trigger a keydown event to activate the calculation
    await input.trigger("keydown", { key: " " });
    vi.advanceTimersByTime(5000);
    await wrapper.vm.$nextTick() // Allow VueJS to update screen
    const addBtn = wrapper.find("[data-testid=add_expr]")
    console.debug("Add Button", addBtn)
    await addBtn.trigger("click");
    vi.advanceTimersByTime(5000);
    await wrapper.vm.$nextTick() // Allow VueJS to update screen
    const exprAfter = store.seExpressions.length
    expect(exprAfter).toEqual(exprBefore + 1);
  });
});

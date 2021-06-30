import TestComponent from "../ExpressionForm.vue";
import store from "@/store";
import { createWrapper } from "../../../tests/vue-helper";

const createComponent = () =>
  createWrapper(TestComponent, {
    mountOptions: {
      stubs: {
        VIcon: true
      }
    }
  });

describe("ExpressionForm.vue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is a component", () => {
    const wrapper = createComponent();
    expect(wrapper).toBeTruthy();
  });

  it("has input textarea", () => {
    const wrapper = createComponent();
    const input = wrapper.find("#_test_input_expr");
    expect(input.exists()).toBeTruthy();
  });

  it("has output result box", () => {
    const wrapper = createComponent();
    const output = wrapper.find("#_test_output_result");
    expect(output.exists()).toBeTruthy();
  });

  it("parses and evaluates input", async () => {
    jest.useFakeTimers();
    const wrapper = createComponent();
    await wrapper.setData({ calcExpression: "2 * 13" });
    // await wrapper.vm.$nextTick();
    const input = wrapper.find("#_test_input_expr");
    // We must trigger a keydown event to activate the calculation
    // function in the component
    await input.trigger("keydown", { key: " " });
    await wrapper.vm.$nextTick();
    jest.advanceTimersByTime(5000);
    await wrapper.vm.$nextTick();
    // console.debug("Var", wrapper.vm.$data.calcResult);
    expect(wrapper.vm.$data.calcResult).toEqual(26);
  });

  it("adds expressions to the store", async () => {
    const wrapper = createComponent();
    const addBtn = wrapper.find("#_test_add_expr");
    const expr1 = store.state.se.expressions.length;
    // console.debug("Store has", expr1, "expressions");
    await wrapper.setData({ calcExpression: "2 * 13" });

    await addBtn.trigger("click");
    const expr2 = store.state.se.expressions.length;
    // console.debug("Store has", expr2, "expressions");
    expect(expr2).toEqual(expr1 + 1);
  });
});

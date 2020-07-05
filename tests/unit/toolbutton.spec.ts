import ToolButton from "@/components/ToolButton.vue";
import { Wrapper, createLocalVue, mount } from "@vue/test-utils";
import { VueConstructor } from "vue";
import Vuetify from "vuetify";
import Vue from "vue";

const TEST_ICON = "mdi-chair-school";
const TEST_ID = 17;
describe("ToolButton.vue", () => {
  let wrapper: Wrapper<ToolButton>;
  let vuetify: typeof Vuetify;
  let localVue: VueConstructor;
  beforeEach(() => {
    localVue = createLocalVue();
    vuetify = new Vuetify();
    localVue.use(vuetify);
    wrapper = mount(ToolButton, {
      propsData: {
        button: {
          id: TEST_ID,
          actionModeValue: "test",
          displayedName: "Just a Test",
          icon: TEST_ICON,
          toolTipMessage: "Tooltip text",
          toolUseMessage: "How to use"
        }
      },
      localVue,
      vuetify
    });
  });

  it("is an instance", () => {
    expect(wrapper.exists).toBeTruthy();
    expect(wrapper.isVueInstance).toBeTruthy();
  });

  it("has the right icon", () => {
    const icon = wrapper.find(".v-icon");
    expect(icon).toBeDefined();
    expect(icon.attributes().class).toContain(TEST_ICON);
  });

  it("emits event with correct id", async () => {
    // console.debug(wrapper.html());
    const b = wrapper.find(".v-btn");
    // console.debug("Button details", b.html());
    b.trigger("click");
    await Vue.nextTick();
    // console.debug("Emitted", b.emitted());
    const em = wrapper.emitted();
    // console.debug("Emitted", em);
    if (em.displayOnlyThisToolUseMessage) {
      expect(em.displayOnlyThisToolUseMessage.length).toBe(1);
      expect(em.displayOnlyThisToolUseMessage[0]).toContain(TEST_ID);
    } else {
      fail("Event not triggered");
    }
  });
});

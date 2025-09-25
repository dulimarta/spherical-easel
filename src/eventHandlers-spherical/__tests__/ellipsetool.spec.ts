import { vi } from "vitest";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { drawEllipse } from "./sphereframe-helper";
import { createTestingPinia } from "@pinia/testing";
import { SENodule } from "@/models/SENodule";
import { Command } from "@/commands-spherical/Command";
import Handler from "../EllipseHandler";

// TODO: Runtime error with binding vertices in plottable/Ellipse.ts?
describe.skip("Ellipse Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  beforeEach(async () => {
    vi.clearAllMocks();
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    SEStore = useSEStore(testPinia);
    // useAccountStore(testPinia)
    SEStore.init();
    SENodule.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });
  async function runEllipseTest(
    isFocus1Foreground: boolean,
    isFocus2Foreground: boolean,
    isPoint3Foreground: boolean
  ): Promise<void> {
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(
      wrapper,
      101,
      87,
      isFocus1Foreground,
      200,
      113,
      isFocus2Foreground,
      150,
      190,
      isPoint3Foreground
    );
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount + 1);
  }

  it("adds a new ellipse while in EllipseTool", async () => {
    SEStore.setActionMode("ellipse");
    for (const focal1 of [true, false])
      for (const focal2 of [true, false])
        for (const boundaryPt of [true, false]) {
          // SEStore.init();
          await runEllipseTest(focal1, focal2, boundaryPt);
        }
  });
});

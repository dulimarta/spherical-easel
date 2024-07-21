import SphereFrame from "@/components/SphereFrame.vue";
import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import { createWrapper } from "$/vue-helper";
import { SEStoreType,useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { LAYER } from "@/global-settings";
/*
TODO: the test cases below create the object using newly created node.
Should we include test cases where the tools select existing objects
during the creation. For instance, when creating a line one of the endpoints
is already on the sphere
*/
describe("SphereFrame.vue", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  let svgCanvas: VueWrapper;
  beforeEach(async () => {
    // It is important to reset the actionMode back to subsequent
    // mutation to actionMode will trigger a Vue Watch update
    vi.clearAllMocks();
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    wrapper = out.wrapper;
    SEStore = useSEStore(testPinia);
    // SENodule.setGlobalStore(SEStore);
    // Handler.setGlobalStore(SEStore);
    // Command.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();

  });

  it("is an instance", () => {
    expect(wrapper.exists).toBeTruthy();
  });

  it("has SVG element", () => {
    const canvas = wrapper.find("svg");
    expect(canvas.exists).toBeTruthy();
    expect(canvas).toBeDefined();
  });

  it("has TwoJS instance and midground layer", () => {
    // expect(wrapper.vm.$data.twoInstance).toBeDefined();
    // expect(wrapper.vm.$data.layers[LAYER.midground]).toBeDefined();
    expect(Array.isArray(SEStore.twojsLayers)).toBeTruthy()
    expect(SEStore.twojsLayers[LAYER.midground]).toBeDefined()
  });

  // it("contains boundary circle of the right radius", () => {
  //   //   console.debug(wrapper.vm.$data.layers[LAYER.midground]);
  //   const midLayer = SEStore.twojsLayers[LAYER.midground];
  //   expect(midLayer.children.length).toBeGreaterThan(0);
  //   // expect(midLayer.children[0]).toBeInstanceOf(Circle);
  // });
});

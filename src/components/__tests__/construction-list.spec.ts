import ConstructionList from "../ConstructionList.vue";
import { SphericalConstruction } from "../../types";
import { Matrix4 } from "three";
import { mount, shallowMount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { vi } from "vitest";
import axios from "axios";
// import { createWrapper } from "../../../tests/vue-helper";
import { setActivePinia, createPinia } from "pinia";
import { set } from "@vueuse/core";
// import store from "@/";

vi.mock("axios"); // Do this once

const sampleData = () => {
  const arr: Array<SphericalConstruction> = [];
  for (let k = 0; k < 3; k++) {
    arr.push({
      id: "User" + k,
      author: "User" + k,
      dateCreated: "2021-03-02",
      script: "",
      description: "Description #" + k,
      objectCount: 1,
      parsedScript: [],
      preview: "data:image/png," + k,
      sphereRotationMatrix: new Matrix4(),
      version: "1",
      tools: [] /* FIXME */,
      starCount: 0
    });
  }
  return arr;
};

// store.state.se.svgCanvas = document.createElement("div");

const w = shallowMount(ConstructionList, {
  global: {
    plugins: [createTestingPinia()]
  }
});
// const createComponent = (extraOption: any) =>
//   createWrapper(
//     ConstructionList,
//     {
//       mountOptions: {
//         stubs: { VIcon: true },
//         mocks: { $appAuth: { currentUser: null } },
//         // store,
//         ...extraOption
//       }
//     },
//     true // true: shallow mount
//   );

const TEST_DATA = sampleData();
const NO_DATA: Array<SphericalConstruction> = [];
describe("Construction List", () => {
  beforeEach(() => {
    //   wrapper = createComponent();
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it.skip("shows 'No data' when construction list is empty", () => {
    // const wrapper = createComponent({
    //   propsData: { items: NO_DATA, allowSharing: false }
    // });
    // const label = wrapper.find("._test_nodata");
    // expect(label.text()).toContain("No data");
  });

  it.skip("shows the right number of items", () => {
    // const cList = createComponent({
    //   propsData: { items: TEST_DATA, allowSharing: false }
    // }).findAll("._test_constructionItem");
    // expect(cList.length).toBe(TEST_DATA.length);
  });

  it.skip("shows a list of constructions with author name", () => {
    // const cList = createComponent({
    //   propsData: { items: TEST_DATA, allowSharing: false }
    // }).findAll("._test_constructionItem");
    // for (let k = 0; k < cList.length; k++) {
    //   const el = cList.at(k);
    //   expect(el?.text()).toContain(TEST_DATA[k].author);
    // }
  });

  it("shows a list of constructions with description", () => {
    // const cList = createComponent({
    //   propsData: { items: TEST_DATA, allowSharing: false }
    // }).findAll("._test_constructionItem");
    // for (let k = 0; k < cList.length; k++) {
    //   const el = cList.at(k);
    //   expect(el?.text()).toContain(TEST_DATA[k].description);
    // }
  });

  it.skip("shows overlay on mouse hover", async () => {
    // (axios.get as any).mockResolvedValue({ data: "<svg></svg>" });
    // const wrapper = createComponent({
    //   propsData: { items: TEST_DATA, allowSharing: false }
    // });
    // const cList = wrapper.findAll("._test_constructionItem");
    // expect(cList.length).toBeGreaterThan(0);
    // const el = cList.at(0);
    // await el?.trigger("mouseover");
    // await wrapper.vm.$nextTick();
    // const content1 = el?.find("._test_constructionOverlay [style*=opacity]");
    // // content1.element.style.setProperty("opacity", "1.0");
    // // console.debug("After hover", content1.element, content1.element.style);
    // await wrapper.vm.$nextTick();
    // const opaqueContent = el?.find("._test_constructionOverlay");
    // console.debug("Opaque?", opaqueContent?.html());
    // // FIXME:
    // // From inspection of the HTML tree at runtime Vuetify initially hides
    // // the overlay by setting its opacity to 0.
    // // On a mouseover event, the opacity is set to a non-zero value
    // // However, find() is not able to locate the hidden DOM tree
  });

  // TODO: the following emit events can't be tested until
  // we have a way to poke into the hidden items on the v-overlay
  it.skip("emits load-requested", () => {
    // fail("Incomplete test");
  });
  it.skip("emits share-requested", () => {
    // fail("Incomplete test");
  });
  it.skip("emits delete-requested", () => {
    // fail("Incomplete test");
  });
});

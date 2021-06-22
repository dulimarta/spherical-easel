import Vue from "vue";
import Vuex from "vuex";
import { mount, createLocalVue } from "@vue/test-utils";
import ConstructionList from "../ConstructionList.vue";
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
// import vuetify from "@/plugins/vuetify";
import Vuetify from "vuetify";
import store from "@/store";
import axios, { AxiosStatic } from "axios";

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(Vuetify);
jest.mock("axios"); // Do this once

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
      previewData: "data:image/png," + k,
      sphereRotationMatrix: new Matrix4()
    });
  }
  return arr;
};

const createComponent = (extraOption: any) => {
  return mount(ConstructionList, {
    // vuetify: Vuetify,
    propsData: {
      items: []
    },
    store,
    localVue,
    mocks: {
      $appAuth: {
        currentUser: null
      }
    },
    extensions: { plugins: [Vuetify] },
    ...extraOption
  });
};

const TEST_DATA = sampleData();
describe("Construction List", () => {
  beforeEach(() => {
    //   wrapper = createComponent();
    jest.resetAllMocks();
  });

  it("shows 'No data' when construction list is empty", () => {
    const wrapper = createComponent({ propsData: { items: [] } });
    const label = wrapper.find("._test_nodata");
    expect(label.text()).toContain("No data");
  });

  it("shows the right number of items", () => {
    const cList = createComponent({ propsData: { items: TEST_DATA } }).findAll(
      "._test_constructionItem"
    );
    expect(cList.length).toBe(TEST_DATA.length);
  });

  it("shows a list of constructions with author name", () => {
    const cList = createComponent({ propsData: { items: TEST_DATA } }).findAll(
      "._test_constructionItem"
    );
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el.text()).toContain(TEST_DATA[k].author);
    }
  });

  it("shows a list of constructions with description", () => {
    const cList = createComponent({ propsData: { items: TEST_DATA } }).findAll(
      "._test_constructionItem"
    );
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el.text()).toContain(TEST_DATA[k].description);
    }
  });

  it("shows overlay on mouse hover", async () => {
    (axios.get as any).mockResolvedValue({ data: "<svg></svg>" });
    const wrapper = createComponent({ propsData: { items: TEST_DATA } });
    const cList = wrapper.findAll("._test_constructionItem");
    expect(cList.length).toBeGreaterThan(0);
    const el = cList.at(0);
    // console.log("Before mouseover", el.html());
    el.trigger("mouseover");
    await wrapper.vm.$nextTick();
    // console.log("After mouseover", el.html());

    // TODO: the HTML output shows no differences between
    // before and after mouseover.
    // Ideally we should verify that the buttons in the overlay
    // layer exists
    fail("Incomplete test");
  });

  // TODO: the following emit events can't be tested until
  // we have a way to poke into the items on the v-overlay
  xit("emits load-requested", () => {
    fail("Incomplete test");
  });
  xit("emits share-requested", () => {
    fail("Incomplete test");
  });
  xit("emits delete-requested", () => {
    fail("Incomplete test");
  });
});

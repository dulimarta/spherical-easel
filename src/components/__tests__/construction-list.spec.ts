import ConstructionList from "../ConstructionList.vue";
import { SphericalConstruction } from "../../types";
import { Matrix4 } from "three";
import { vi } from "vitest";
import axios from "axios";
import { createWrapper } from "../../../tests/vue-helper";
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
// import f
import { mockFirebase } from "firestore-vitest-mock/mocks/firebase";
import { VueWrapper } from "@vue/test-utils";
// import {getFirestore} from "firebase/firestore"
const TEST_DATA = sampleData();
const NO_DATA: Array<SphericalConstruction> = [];
describe("Construction Lis: empty list", () => {
  let wrapper: VueWrapper
  beforeEach(() => {
    vi.mock("firebase/firestore", () => ({
      getFirestore: vi.fn()
    }))
    vi.mock("firebase/auth", () => ({
      getAuth: vi.fn(() => ({
        onAuthStateChanged: vi.fn()
      }))
    }))
    const out = createWrapper(ConstructionList, {
      componentProps: {
        items: [],
        allowSharing: true,
      }
    });
    wrapper = out.wrapper
    // mockGoogleCloudFirestore({})
    //   wrapper = createComponent();
    // setActivePinia(createPinia());
    // vi.fn().mockImplementation(getFirestore)
  });
  afterEach(() => {
    // vi.resetAllMocks();

  })

  it("is an instance", () => {
    expect(wrapper).toBeTruthy()
  })


  it("shows 'No data' when construction list is empty", () => {
    expect(wrapper.text()).toContain("No data");
  });

});

describe("Construction List: non-empty list", () => {
  let wrapper: VueWrapper
  beforeEach(() => {
    vi.mock("firebase/firestore", () => ({
      getFirestore: vi.fn()
    }))
    vi.mock("firebase/auth", () => ({
      getAuth: vi.fn(() => ({
        onAuthStateChanged: vi.fn()
      }))
    }))
    const out = createWrapper(ConstructionList, {
      componentProps: {
        items: TEST_DATA,
        allowSharing: true,
      }
    });
    wrapper = out.wrapper
  });
  it("shows the right number of items", () => {
    const z = wrapper.findAll("._test_constructionItem")
    expect(z.length).toBe(TEST_DATA.length)
  });

  it("shows a list of constructions with author name", () => {
    const cList = wrapper.findAll("._test_constructionItem")
    expect(cList.length).toBe(TEST_DATA.length)
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el?.text()).toContain(TEST_DATA[k].author);
    }
  });

  it("shows a list of constructions with description", () => {
    const cList = wrapper.findAll("._test_constructionItem")
    expect(cList.length).toBe(TEST_DATA.length)
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el?.text()).toContain(TEST_DATA[k].description);
    }
  });

  it.skip("shows overlay on mouse hover", async () => {
    const cList = wrapper.findAll("._test_constructionItem")
    expect(cList.length).toBe(TEST_DATA.length)
    // (axios.get as any).mockResolvedValue({ data: "<svg></svg>" });
    // const wrapper = createComponent({
    //   propsData: { items: TEST_DATA, allowSharing: false }
    // });
    // const cList = wrapper.findAll("._test_constructionItem");
    // expect(cList.length).toBeGreaterThan(0);
    const el = cList.at(0);
    await el?.trigger("mouseover");
    // await wrapper.vm.$nextTick();
    const content1 = wrapper.find("._test_constructionOverlay");
    // content1.element.style.setProperty("opacity", "1.0");
    console.debug("After hover", wrapper.html());
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

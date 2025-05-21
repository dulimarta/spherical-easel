import ConstructionList from "@/components/ConstructionList.vue";
import { SphericalConstruction } from "@/types/ConstructionTypes";
import { createWrapper } from "$/vue-helper";
import {mockedStore} from "$/mock-utils"
import { Matrix4 } from "three";
import { vi } from "vitest";
import { useAccountStore } from "@/stores/account";
import { useConstructionStore } from "@/stores/construction"
import { VueWrapper } from "@vue/test-utils";
import { User, UserCredential } from "firebase/auth";
import { DocumentSnapshot, QuerySnapshot } from "firebase/firestore";
import { TestingPinia } from "@pinia/testing";

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


// import { mockFirebase } from "firestore-vitest-mock/mocks/firebase";
function prepareWrapper(
) {
  vi.mock("firebase/firestore", async fn_arg => {
    const firestoreObject = (await fn_arg()) as object;

    // console.debug("Construction-list.spec.ts: What is this?", firestoreObject);
    return {
      collection: vi.fn(),
      doc: vi.fn(),
      // docs: vi.fn(),
      updateDoc: vi.fn(),
      getDoc: vi.fn().mockResolvedValue({} as DocumentSnapshot),
      getDocs: vi.fn().mockImplementation(() => {
        console.debug(
          "construction-list.spec.ts: Mocked implementation of getDocs is called"
        );
        return {
          docs: []
        };
      }),
      getFirestore: vi.fn()
    };
  });
  vi.mock("firebase/auth", () => {
    console.debug("Inside firebase/auth mock")
    const u: UserCredential = {
      user: {
        emailVerified: true
      } as User,
      providerId: null,
      operationType: 'signIn'
    }
    return {
      getAuth: vi.fn(() => ({
        onAuthStateChanged: vi.fn()
      })),
      signInWithEmailAndPassword: vi.fn().mockResolvedValue(u)
    };
  });
  return createWrapper(ConstructionList, {
    componentProps: {
      items: [],
      allowSharing: false
    }
  });
}
const TEST_DATA = sampleData();
const NO_DATA: Array<SphericalConstruction> = [];
describe("Construction Lis: empty list", () => {
  let wrapper: VueWrapper;
  beforeEach(() => {
    const out = prepareWrapper();
    wrapper = out.wrapper;
    // mockGoogleCloudFirestore({})
    //   wrapper = createComponent();
    // setActivePinia(createPinia());
    // vi.fn().mockImplementation(getFirestore)
  });
  afterEach(() => {
    // vi.resetAllMocks();
  });

  it("is an instance", () => {
    expect(wrapper).toBeTruthy();
  });

  it("shows 'No data' when construction list is empty", () => {
    expect(wrapper.text()).toContain("No data");
  });
});

describe("Construction List: non-empty list", () => {
  let wrapper: VueWrapper;
  let testPinia: TestingPinia
  beforeEach(async() => {
    const out = prepareWrapper();
    wrapper = out.wrapper;
    testPinia = out.testPinia
    vi.clearAllTimers();
    await wrapper.setProps({items: TEST_DATA, allowSharing: false})
  });
  it("shows the right number of items", async () => {
    const z = wrapper.findAll("[data-testid=constructionItem]");
    expect(z.length).toBe(TEST_DATA.length);
  });

  it("shows a list of constructions with author name", () => {
    const cList = wrapper.findAll("[data-testid=constructionItem]");
    expect(cList.length).toBe(TEST_DATA.length);
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el?.text()).toContain(TEST_DATA[k].author);
    }
  });

  it("shows a list of constructions with description", () => {
    const cList = wrapper.findAll("[data-testid=constructionItem]");
    expect(cList.length).toBe(TEST_DATA.length);
    for (let k = 0; k < cList.length; k++) {
      const el = cList.at(k);
      expect(el?.text()).toContain(TEST_DATA[k].description);
    }
  });
});

describe("Construction List: Overlay buttons", () => {
  let wrapper: VueWrapper
  let testPinia: TestingPinia
  // let overlayContent: DOMWrapper<Element> | undefined
  beforeEach(() => {
    vi.useFakeTimers();
    const out = prepareWrapper()
    wrapper = out.wrapper
    testPinia = out.testPinia
  });
  afterEach(() => {
    vi.clearAllTimers();
  });
  async function hoverToFirstItem(w: VueWrapper) {
    const cList = w.findAll("[data-testid=constructionItem]");
    expect(cList.length).toBe(TEST_DATA.length);
    const el = cList.at(0);
    // To simulate hovering, it is important that we also trigger a "mouseneter" event
    await el?.trigger("mouseenter");
    await vi.advanceTimersByTime(1000);
    await w.vm.$nextTick();
    return el?.find("[data-testid=buttonOverlay]");
  }

  it("has overlay with button(s)", async () => {
    await wrapper.setProps({items: TEST_DATA, allowSharing: true})
    const overlayContent = await hoverToFirstItem(wrapper);
    expect(overlayContent?.exists).toBeTruthy();
    const buttons = overlayContent?.findAll("button");
    expect(buttons?.length).toBeGreaterThan(0);
  });

  it("shows load button", async () => {
    await wrapper.setProps({ items: TEST_DATA, allowSharing: true });
    const overlayContent = await hoverToFirstItem(wrapper);
    const btn = overlayContent?.find("[data-testid=load_btn]");
    expect(btn?.text()).not.toBeNull();
  });

  it("shows share button", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      publicDocId: `PUBLICDOC${idx}`,
    }));
    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const overlayContent = await hoverToFirstItem(wrapper);
    const btn = overlayContent?.find("[data-testid=share_btn]");
    // console.debug("Button", btn?.html())
    expect(btn?.text()).not.toBeNull();
  });

  it("shows make private button", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      publicDocId: `PUBLICDOC${idx}`,
      author: 'me@test.com'
    }));
    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const acctStore = useAccountStore(testPinia);
    acctStore.userEmail = "me@test.com"
    const overlayContent = await hoverToFirstItem(wrapper);
    // console.debug("Overlay", overlayContent?.html())
    const btn = overlayContent?.find("[data-testid=make_private_btn]");
    // // console.debug("Button", btn?.html())
    expect(btn?.exists()).toBeTruthy()
  });

  it("shows make public button for constructions owned by a user", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      author: 'me@test.com'
    }));

    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const acctStore = useAccountStore(testPinia);
    acctStore.userEmail = "me@test.com"
    const overlayContent = await hoverToFirstItem(wrapper);
    const btn = overlayContent?.find("[data-testid=make_public_btn]");
    // console.debug("Button", btn?.html())
    expect(btn?.exists()).toBeTruthy()
  });

  it("shows delete button on constructions owned by a user", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      author: 'me@test.com'
    }));
    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const acctStore = useAccountStore(testPinia);
    acctStore.userEmail = "me@test.com"
    const overlayContent = await hoverToFirstItem(wrapper);
    const btn = overlayContent?.find("[data-testid=delete_btn]");
    // console.debug("Button", btn?.html())
    expect(btn?.exists()).toBeTruthy()
  });

  it("shows star button on constructions owned by someone else", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      publicDocId: `PUBLICDOC${idx}`,
      author: 'otheruser@test.com'
    }));
    // console.debug("TestPinia", testPinia.state.value)
    const acctStore = useAccountStore(testPinia);
    const constructionStore = mockedStore(useConstructionStore)
    // constructionStore.repopulateArrays.mockImplementation(async () => {
    //   console.debug("Mocked firebaseUid watcher")
    // })
    acctStore.userEmail = "me@test.com"
    acctStore.firebaseUid = "OID61123GYZ"
    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const overlayContent = await hoverToFirstItem(wrapper);
    // console.debug("Overlay", overlayContent?.html())
    const btn = overlayContent?.find("[data-testid=star_btn]");
    // console.debug("Button", btn?.html())
    expect(btn?.exists()).toBeTruthy
  });

  it("shows unstar button on constructions in my star list", async () => {
    const testDataPublic = TEST_DATA.map((z, idx) => ({
      ...z,
      publicDocId: `PUBLICDOC${idx}`,
      author: 'otheruser@test.com'
    }));
    const acctStore = useAccountStore(testPinia);
    acctStore.userEmail = "me@test.com"
    acctStore.firebaseUid = "OID61123GYZ"
    acctStore.starredConstructionIDs = ["PUBLICDOC0"]
    await wrapper.setProps({ items: testDataPublic, allowSharing: true });
    const overlayContent = await hoverToFirstItem(wrapper);
    // console.debug("Overlay", overlayContent?.html())
    const btn = overlayContent?.find("[data-testid=unstar_btn]");
    // console.debug("Button", btn?.html())
    expect(btn?.exists()).toBeTruthy
  });

});

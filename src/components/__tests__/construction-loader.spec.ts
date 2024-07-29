import TestedComponent from "../ConstructionLoader.vue";
import { vi, describe, beforeEach, it, expect } from "vitest";
import { createWrapper } from "$/vue-helper";
import { createI18n, useI18n } from "vue-i18n";
import { useConstructionStore } from "@/stores/construction";
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";
// import firebasemock from "firebase-mock";
// const mockAuth = new firebasemock.MockAuthentication();
// const mockFirestore = new firebasemock.MockFirestore();
// const mockStorage = new firebasemock.MockStorage();
// const mockSDK = new firebasemock.MockFirebaseSdk(
//   () => null, // Realtime DB
//   // () => mockAuth,
//   // () => mockFirestore,
//   // () => mockStorage,
//   () => null // Messaging
// );
// import i18n from "../../i18n";
// mockFirebase()
// import firebase from "firebase/app";

// const fakeFirebase = firebaseStub(
//   {
//     database: {
//       users: [
//         {
//           id: "USR001",
//           _collections: {
//             constructions: []
//           }
//         }
//       ],
//       constructions: []
//     },
//     currentUser: fakeUser
//   },
//   {
//     includeIdsInData: true,
//     mutable: true
//   }
// );

// vi.mock("vue-i18n", async orig => {
//   const z = (await orig()) as object;
//   console.debug("i18N mock", z);
//   // console.debug("What is this?", orig, "and also this", z);
//   return { ...z, t: (key: string) => key };
// });

//

const sampleData = () => {
  const arr: Array<SphericalConstruction> = [];
  for (let k = 0; k < 3; k++) {
    arr.push({
      id: "Construction #" + k,
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

vi.mock("firebase/firestore", async orig => {
  const z = (await orig()) as object;

  // console.debug("What is this?", z);
  return {
    ...z,
    getFirestore: vi.fn().mockReturnThis(),
    collection: vi.fn(),
    getDocs: vi.fn().mockImplementation(() => {
      console.debug("Inside mocked getDocs()");
      return {
        docs: []
      };
    })
  };
});

// vi.mock("firebase/storage", async orig => {
//   const z = (await orig()) as object;
//   // console.debug("What is this?", z);
//   return {
//     ...z,
//     getStorage: vi.fn().mockReturnThis()
//   };
// });
vi.mock("firebase/auth", async orig => {
  const z = (await orig()) as object;
  // console.debug("What is this?", z);
  return {
    ...z,
    getAuth: vi.fn().mockReturnThis(),
    onAuthStateChanged: vi.fn()
  };
});
// // vi.mock("./firebase", () => mockSDK);
// config.global.mocks = {
//   // t: (key: string) => key,
//   // getAuth: vi.fn()
// };

describe("Construction Loader", () => {
  const i18n = createI18n({});

  beforeEach(() => {
    vi.clearAllMocks();
    // vi.stubGlobal("getAuth", vi.fn());
    // initializeApp(firebaseConfig);
    // vi.fn().mockImplementation(getAuth);
  });

  it("is a component", () => {
    const { wrapper } = createWrapper(TestedComponent, {
      // globalOptions: {
      //   stubs: {
      //     ConstructionList: true
      //   }
      // }
    });
    // const wrapper = createWrapper(TestedComponent, {
    //   mountOptions: {
    //     propsData: {
    //       items: []
    //     }
    //   },
    //   mockOptions: {
    //     $appAuth: fakeFirebase.auth(),
    //     $appDB: fakeFirebase.firestore()
    //   }
    // });
    expect(wrapper).toBeTruthy();
  });

  it("shows public constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData();
    constructionStore.publicConstructions = testData;
    await wrapper.vm.$nextTick();
    const pubPanel = wrapper.find("[data-testid=publicPanel");
    console.debug("Public panel", pubPanel.text());
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    console.debug("Public panel (after click)", pubPanel.text());
    const pub = wrapper.find("[data-testid=publicList");
    const pubText = pub.text();
    testData.forEach(s => {
      expect(pubText).toContain(s.author);
      expect(pubText).toContain(s.description);
      expect(pubText).toContain(s.dateCreated);
    });
  });

  it("shows private constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const acctStore = useAccountStore(testPinia);
    acctStore.firebaseUid = "AbCD17618U";
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    constructionStore.privateConstructions = testData;
    // console.debug("Wrapper", wrapper.text())
    const privatePanel = wrapper.find("[data-testid=privatePanel");
    // console.debug("Private panel", privatePanel.text())
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    // console.debug("Private panel (after idle)", privatePanel.text())
    const priv = wrapper.find("[data-testid=privateList");
    const privateText = priv.text();
    testData.forEach(s => {
      expect(privateText).toContain(s.author);
      expect(privateText).toContain(s.dateCreated);
    });
  });

  it("shows starred constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const acctStore = useAccountStore(testPinia);
    acctStore.firebaseUid = "AbCD17618U";
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    constructionStore.starredConstructions = testData;
    // console.debug("Wrapper", wrapper.text())
    const panel = wrapper.find("[data-testid=starredPanel");
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    // console.debug("Private panel (after idle)", privatePanel.text())
    const starred = wrapper.find("[data-testid=starredList");
    const text = starred.text();
    testData.forEach(s => {
      expect(text).toContain(s.author);
      expect(text).toContain(s.dateCreated);
    });
  });

  it("shows filtered list of public constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData();
    testData[0].description = "Euler theorem";
    constructionStore.publicConstructions.push(...testData);
    await wrapper.vm.$nextTick();
    const searchInput = wrapper.find("[data-testid=searchInput").find("input");
    const publicList = wrapper.find("[data-testid=publicList]");
    searchInput.setValue("euler");
    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    // console.debug("Search", searchInput.html())
    const outputText = publicList.text();
    testData.forEach((s, pos) => {
      if (pos == 0) expect(outputText).toContain(s.description);
      else expect(outputText).not.toContain(s.description);
    });
    // console.debug("Public list", publicList.html())
  });
  it("shows filtered list of private constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const acctStore = useAccountStore(testPinia);
    acctStore.firebaseUid = "AbCD17618U";
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    testData[0].description = "Euler theorem";
    constructionStore.privateConstructions.push(...testData);
    await wrapper.vm.$nextTick();
    const searchInput = wrapper.find("[data-testid=searchInput").find("input");
    const cList = wrapper.find("[data-testid=privateList]");
    expect(cList.exists()).toBeTruthy();
    searchInput.setValue("euler");
    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    // console.debug("Search", searchInput.html())
    const outputText = cList.text();
    testData.forEach((s, pos) => {
      if (pos == 0) expect(outputText).toContain(s.description);
      else expect(outputText).not.toContain(s.description);
    });
    // console.debug("Public list", publicList.html())
  });

  it.skip("shows filtered list of starred constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData().map((s, pos) => ({
      ...s,
      publicDocId: `PublicConstruction #${pos}`,
    }));
    testData[0].description = "Venn diagram";
    // Pass a copy into the store so we have an unmodified test data
    // for reference
    constructionStore.publicConstructions = testData.slice(0)
    await wrapper.vm.$nextTick();
    const acctStore = useAccountStore(testPinia);
    acctStore.starredConstructionIDs.push(testData[0].publicDocId, testData[1].publicDocId);
    acctStore.firebaseUid = "AbCD17618U";
    await vi.advanceTimersByTime(1100);
    const searchInput = wrapper.find("[data-testid=searchInput").find("input");
    const cList = wrapper.find("[data-testid=starredList]");
    const cPanel = wrapper.find("[data-testid=starredPanel]")

    // Must click to expand the panel
    await cPanel.trigger('click')
    expect(cList.exists()).toBeTruthy();
    searchInput.setValue("Venn");
    vi.advanceTimersByTime(1500);
    await wrapper.vm.$nextTick(); // Allow VueJS to update
    const outputText = cList.text();
    testData.forEach((s, pos) => {
      if (pos == 0) expect(outputText).toContain(s.description);
      else expect(outputText).not.toContain(s.description);
    });
  });
});

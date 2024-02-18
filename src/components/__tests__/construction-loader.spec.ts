// import Vue from "vue";
import TestedComponent from "../ConstructionLoader.vue";
import { vi } from "vitest";
import { createWrapper } from "../../../tests/vue-helper";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../firebase-config";
import { shallowMount, config, mount } from "@vue/test-utils";
import { createI18n, useI18n } from "vue-i18n";
import { createVuetify } from "vuetify";
import firebasemock from "firebase-mock";
const mockAuth = new firebasemock.MockAuthentication();
const mockFirestore = new firebasemock.MockFirestore();
const mockStorage = new firebasemock.MockStorage();
const mockSDK = new firebasemock.MockFirebaseSdk(
  () => null, // Realtime DB
  () => mockAuth,
  () => mockFirestore,
  () => mockStorage,
  () => null // Messaging
);
// import i18n from "../../i18n";
const fakeUser = {
  uid: "JG712HZ"
};
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

vi.mock("firebase/firestore", async orig => {
  const z = (await orig()) as object;
  // console.debug("What is this?", z);
  return {
    ...z,
    getFirestore: vi.fn().mockReturnThis(),
    collection: vi.fn(),
    getDocs: vi.fn().mockResolvedValue([])
  };
});

vi.mock("firebase/storage", async orig => {
  const z = (await orig()) as object;
  // console.debug("What is this?", z);
  return {
    ...z,
    getStorage: vi.fn().mockReturnThis()
  };
});
vi.mock("firebase/auth", async orig => {
  const z = (await orig()) as object;
  // console.debug("What is this?", z);
  return {
    ...z,
    getAuth: vi.fn().mockReturnThis(),
    onAuthStateChanged: vi.fn()
  };
});
// vi.mock("./firebase", () => mockSDK);
config.global.mocks = {
  // t: (key: string) => key,
  // getAuth: vi.fn()
};

describe("Construction Loader", () => {
  const i18n = createI18n({});

  beforeEach(() => {
    vi.clearAllMocks();
    // vi.stubGlobal("getAuth", vi.fn());
    // initializeApp(firebaseConfig);
    // vi.fn().mockImplementation(getAuth);
  });

  it("is a component", () => {
    const wrapper = createWrapper(TestedComponent, {
      globalOptions: {
        stubs: {
          ConstructionList: true
        }
      }
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

  it.skip("shows the share dialog", async () => {
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
    // const d1 = wrapper.find("#_test_constructionShareDialog");
    // const before = d1.find("p");
    // console.info("What is before", d1, before);
    // // expect(d1).toBeUndefined();
    // wrapper.vm.$emit("share-requested", { docId: "1234" });
    // await wrapper.vm.$nextTick();
    // const after = wrapper.find("p");
    // console.info("What is after", after);
  });
});

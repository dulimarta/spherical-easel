// import Vue from "vue";
import Vuex from "vuex";
import { mount, createLocalVue, shallowMount } from "@vue/test-utils";
import TestedComponent from "../ConstructionLoader.vue";
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
// import vuetify from "@/plugins/vuetify";
import Vuetify from "vuetify";
import store, { SEStore } from "@/store";
// import axios from "axios";
import { mockFirebase, FakeFirestore, FakeAuth } from "firestore-jest-mock";
import { firebaseStub } from "firestore-jest-mock/mocks/firebase";
// import { mockInitializeApp } from "firestore-jest-mock/mocks/firebase";
// import firebase from "firebase/app";
// import { FirebaseAuth } from "@firebase/auth-types";
// import { FirebaseFirestore } from "@firebase/firestore-types";
// import "firebase/firestore";

const fakeUser = {
  uid: "JG712HZ"
};

const localVue = createLocalVue();
// localVue.use(Vuex);
localVue.use(Vuetify);
const fakeFirebase = firebaseStub(
  {
    database: {
      users: [
        {
          id: "USR001",
          _collections: {
            constructions: []
          }
        }
      ],
      constructions: []
    },
    currentUser: fakeUser
  },
  {
    includeIdsInData: true,
    mutable: true
  }
);

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
  return mount(TestedComponent, {
    // vuetify: Vuetify,
    propsData: {
      items: []
    },
    store,
    localVue,
    mocks: {
      $appAuth: fakeFirebase.auth(),
      $appDB: fakeFirebase.firestore()
    },
    extensions: { plugins: [Vuetify] },
    ...extraOption
  });
};

describe("Construction Loader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a component", () => {
    const wrapper = createComponent({});
    expect(wrapper).toBeTruthy();
  });

  xit("shows the share dialog", async () => {
    const wrapper = createComponent({});
    const d1 = wrapper.find("#_test_constructionShareDialog");
    const before = d1.find("p");
    console.info("What is before", d1, before);
    // expect(d1).toBeUndefined();
    wrapper.vm.$emit("share-requested", { docId: "1234" });
    await wrapper.vm.$nextTick();
    const after = wrapper.find("p");
    console.info("What is after", after);
  });
});

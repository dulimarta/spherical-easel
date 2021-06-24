// import Vue from "vue";
import TestedComponent from "../ConstructionLoader.vue";
import { firebaseStub } from "firestore-jest-mock/mocks/firebase";
import { createWrapper } from "../../../tests/vue-helper";

const fakeUser = {
  uid: "JG712HZ"
};

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

describe("Construction Loader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("is a component", () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          items: []
        }
      },
      mockOptions: {
        $appAuth: fakeFirebase.auth(),
        $appDB: fakeFirebase.firestore()
      }
    });
    expect(wrapper).toBeTruthy();
  });

  xit("shows the share dialog", async () => {
    const wrapper = createWrapper(TestedComponent, {
      mountOptions: {
        propsData: {
          items: []
        }
      },
      mockOptions: {
        $appAuth: fakeFirebase.auth(),
        $appDB: fakeFirebase.firestore()
      }
    });
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

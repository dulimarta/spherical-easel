import TestedComponent from "../ConstructionLoader.vue";
import { vi, describe, beforeEach, it, expect } from "vitest";
import { createWrapper } from "$/vue-helper";
import { useConstructionStore } from "@/stores/construction";
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
import { useAccountStore } from "@/stores/account";

// potential improvements:
//  - when testing that private/public/starred constructions are shown, place some constructions in another "bucket"
//    to ensure that only the desired constructions are shown and no others.

// generate sample data for the unit tests; produces 3 SphericalConstruction objects
// in an array with consecutive increasing IDs
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

// mock the firestore class
vi.mock("firebase/firestore", async fnArg => {
  // not sure I understand this cast - I think this, combined with the "...firestoreObject" line,
  // results in a regular firestore object with just the getFirestore/collection/getDocs functions overridden?
  const firestoreObject = (await fnArg()) as object;

  // console.debug("Construction-loader.spec.ts: What is this?", firestoreObject);
  return {
    // "..." is the spread operator, which works almost identically to the
    // * operator in python.
    ...firestoreObject,
    // replace the getFirestore method with a mocked version that will return a reference
    // to the firestore object when called
    getFirestore: vi.fn().mockReturnThis(),
    // replace the collection method with a mocked version; since no function is given,
    // this will return `undefined` when invoked.
    collection: vi.fn(),
    // replace the getDocs method with a mocked version that will execute the lambda passed
    // to the mockImplementation() call when run
    getDocs: vi.fn().mockImplementation(() => {
      console.debug("Inside mocked getDocs()");
      return {
        docs: []
      };
    })
  };
});

// mock the firebase auth class; like the firebase class above,
// I believe this creates an otherwise unmodified firebase auth
// class but with mocked getAuth and onAuthStateChanged methods.
vi.mock("firebase/auth", async orig => {
  const z = (await orig()) as object;

  return {
    ...z,
    getAuth: vi.fn().mockReturnThis(),
    onAuthStateChanged: vi.fn()
  };
});

// define the actual test environment! Syntax appears very similar to
// the rake library/DSL for Ruby. This call to "describe" creates a test suite
// called "construction loader"
describe("Construction Loader", () => {
  // reset all mocked symbols before running each individual test
  beforeEach(() => {
    vi.clearAllMocks();
    // vi.stubGlobal("getAuth", vi.fn());
    // initializeApp(firebaseConfig);
    // vi.fn().mockImplementation(getAuth);
  });

  // define a test named "is a component"; in the suite execution,
  // this shows up as "Construction Loader > is a component"
  it("is a component", () => {
    const { wrapper } = createWrapper(TestedComponent, {});
    // this call checks if the wrapper object is truthy, which in javascript
    // means that the wrapper object is not false, null, undefined, NaN, 0, -0, 0n,
    // "", or document.all.
    expect(wrapper).toBeTruthy();
  });

  it("shows public constructions", async () => {
    // mock all calls to timers (setTimeout, setInterval, clearTimeout, clearInterval,
    // setImmediate, clearImmediate, and Date)
    vi.useFakeTimers();
    // createWrapper is a helper function defined in `tests/vue-helper.ts` that creates a
    // mocked pinia object and a "wrapper" object that is created by a call to
    // vue's `mount` function, which I don't yet understand.
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    // get a store for the constructions from the mocked pinia object
    const constructionStore = useConstructionStore(testPinia);
    // create a reference to the sample data we created above
    const testData = sampleData();
    // place the sample data into the construction store as the public constructions
    constructionStore.publicConstructions = testData;
    // as I understand it, Vue maintains a virtual DOM that it modifies in place
    // of the real DOM before syncing the two on a timer. This function call just makes
    // the sync happen right away instead of waiting, since with timers mocked the wait
    // would be indefinite. This makes the overall test more predictable and is a good
    // thing for a unit test to be doing.
    await wrapper.vm.$nextTick();
    // grab the public panel component
    const pubPanel = wrapper.find("[data-testid=publicPanel]");
    // print the panel's text to the console
    console.debug("Public panel", pubPanel.text());
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    // print the panel's text to console again; not sure what the "after click" means here.
    console.debug("Public panel (after idle)", pubPanel.text());
    // grab the public list component
    const pub = wrapper.find("[data-testid=publicList]");
    // grab the text of the public list
    const pubText = pub.text();
    // ensure the public list text contains the author, description, and date created of each
    // test data element; this will check in the same order that we store them in the test data
    // array
    testData.forEach(s => {
      expect(pubText).toContain(s.author);
      expect(pubText).toContain(s.description);
      expect(pubText).toContain(s.dateCreated);
    });
  });

  // same as the last test, but with private constructions
  it("shows private constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const acctStore = useAccountStore(testPinia);
    // hard coded firebase UIDs? The actual value doesn't seem to matter,
    // it just needs to be defined.
    acctStore.firebaseUid = "test";
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    constructionStore.privateConstructions = testData;
    // console.debug("Wrapper", wrapper.text())
    const privatePanel = wrapper.find("[data-testid=privatePanel]");
    // console.debug("Private panel", privatePanel.text())
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    // console.debug("Private panel (after idle)", privatePanel.text())
    const priv = wrapper.find("[data-testid=privateList]");
    const privateText = priv.text();
    testData.forEach(s => {
      expect(privateText).toContain(s.author);
      expect(privateText).toContain(s.dateCreated);
    });
    console.debug(privateText);
  });

  // same as the first 2 tests, but with starred constructions
  it("shows starred constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const acctStore = useAccountStore(testPinia);
    acctStore.firebaseUid = "test";
    // difference between this and advancing by 1500?
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    constructionStore.starredConstructions = testData;
    // console.debug("Wrapper", wrapper.text())
    const panel = wrapper.find("[data-testid=starredPanel]");
    // Give the idle timer a chance to run
    await vi.advanceTimersByTime(1500);
    // console.debug("Private panel (after idle)", privatePanel.text())
    const starred = wrapper.find("[data-testid=starredList]");
    const text = starred.text();
    testData.forEach(s => {
      expect(text).toContain(s.author);
      expect(text).toContain(s.dateCreated);
    });
  });

  // test the search functionality; does it filter out non-matching components?
  it("shows filtered list of public constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData();
    testData[0].description = "Euler theorem";
    constructionStore.publicConstructions.push(...testData);
    await wrapper.vm.$nextTick();
    const searchInput = wrapper.find("[data-testid=searchInput]").find("input");
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
    acctStore.firebaseUid = "test";
    await wrapper.vm.$nextTick();
    const testData = sampleData();
    testData[0].description = "Euler theorem";
    constructionStore.privateConstructions.push(...testData);
    await wrapper.vm.$nextTick();
    const searchInput = wrapper.find("[data-testid=searchInput]").find("input");
    const cList = wrapper.find("[data-testid=privateList]");
    expect(cList.exists()).toBeTruthy();
    searchInput.setValue("euler");
    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    const outputText = cList.text();
    // expect the output to only contain the first item, which was modified to contain the
    // search string.
    testData.forEach((s, pos) => {
      if (pos == 0) expect(outputText).toContain(s.description);
      else expect(outputText).not.toContain(s.description);
    });
  });

  it.skip("shows filtered list of starred constructions", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData().map((s, pos) => ({
      ...s,
      publicDocId: `PublicConstruction #${pos}`
    }));
    testData[0].description = "Venn diagram";
    // Pass a copy into the store so we have an unmodified test data
    // for reference
    constructionStore.publicConstructions = testData.slice(0);
    await wrapper.vm.$nextTick();
    const acctStore = useAccountStore(testPinia);
    acctStore.starredConstructionIDs.push(
      testData[0].publicDocId,
      testData[1].publicDocId
    );
    acctStore.firebaseUid = "test";
    await vi.advanceTimersByTime(1100);
    const searchInput = wrapper.find("[data-testid=searchInput]").find("input");
    const cList = wrapper.find("[data-testid=starredList]");
    const cPanel = wrapper.find("[data-testid=starredPanel]");

    // Must click to expand the panel
    await cPanel.trigger("click");
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

  // try to search for non-ascii characters
  it("can search for non-ascii characters", async () => {
    vi.useFakeTimers();
    const { wrapper, testPinia } = createWrapper(TestedComponent, {});
    const constructionStore = useConstructionStore(testPinia);
    const testData = sampleData();
    testData[0].description = "😱";
    constructionStore.publicConstructions.push(...testData);
    await wrapper.vm.$nextTick();
    const searchInput = wrapper.find("[data-testid=searchInput").find("input");
    const publicList = wrapper.find("[data-testid=publicList]");
    searchInput.setValue("😱");
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
});

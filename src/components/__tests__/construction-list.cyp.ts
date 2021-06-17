import Vuex from "vuex";
import Vue from "vue";
import { mount } from "@cypress/vue";
import { createDirectStore } from "direct-vuex";
import ConstructionList from "../ConstructionList.vue";
Vue.use(Vuex);
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
import { each } from "cypress/types/bluebird";
import vuetify from "@/plugins/vuetify";
import Vuetify from "vuetify";

const { store } = createDirectStore({
  state: {
    inverseTotalRotationMatrix: new Matrix4(),
    svgCanvas: null
  }
});
//
// const localVue = createLocalVue();
// localVue.use(Vuex);

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
    vuetify,
    propsData: {
      items: []
    },
    store: store.original as any,
    // localVue
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
  // let wrapper: any;
  beforeEach(() => {
    //   wrapper = createComponent();
  });

  it("shows 'No data' when construction list is empty", () => {
    const wrapper = createComponent({ propsData: { items: [] } });
    cy.get(".nodata").should("exist");
  });

  it("shows the right number of items", () => {
    createComponent({ propsData: { items: TEST_DATA } })
      .get(".constructionItem")
      .should("have.length", TEST_DATA.length);

    // wrapper.setProps({ items: TEST_DATA });
    // console.log(wrapper.html());
    // const list = wrapper.findAll("v-hover-stub");
    // list.at(0).setProps({ value: true });
    // await wrapper.vm.$nextTick();
    // console.log(wrapper.html());
    // expect(list.length).toBe(TEST_DATA.length);
  });

  it("shows a list of constructions with author name", () => {
    createComponent({ propsData: { items: TEST_DATA } })
      .get(".constructionItem")
      .each((el: Cypress.Chainable, pos: number) => {
        cy.wrap(el).should("contain", TEST_DATA[pos].author);
      });
  });

  it("shows a list of constructions with description", () => {
    createComponent({ propsData: { items: TEST_DATA } })
      .get(".constructionItem")
      .each((el: Cypress.Chainable, pos: number) => {
        cy.wrap(el).should("contain", TEST_DATA[pos].description);
      });
  });

  it("shows overlay on mouse hover", () => {
    createComponent({ propsData: { items: TEST_DATA } })
      .get(".constructionItem:first-child")
      .trigger("mouseover")
      .get(".constructionOverlay")
      .should("be.visible");
  });
  // it("shows share fab", () => {
  //   createComponent({ propsData: { items: TEST_DATA } })
  //     .get(".constructionItem:first-child")
  //     .trigger("mouseover");
  //   cy.get(".loadfab").should("exist");
  // });
});

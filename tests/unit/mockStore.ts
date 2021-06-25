import { createDirectStore } from "direct-vuex";

const shadowStore = {
  state: {
    actionMode: "none",
    layers: [],
    points: [],
    lines: []
  },
  mutations: {
    init: jest.fn(),
    setSphere: jest.fn(),
    setSphereRadius: jest.fn(),
    setZoomMagnificationFactor: jest.fn(),
    setZoomTranslation: jest.fn(),
    setLayers: jest.fn(),
    setActionMode: jest.fn()
  },
  actions: {
    changeZoomFactor: jest.fn()
  },
  getters: {}
};

const { store } = createDirectStore(shadowStore);

export default store;

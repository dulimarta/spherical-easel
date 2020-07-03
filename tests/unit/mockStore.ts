export default {
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
  getters: {}
};

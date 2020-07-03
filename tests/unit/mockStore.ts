export default {
  state: {
    editMode: "none",
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
    setEditMode: jest.fn()
  },
  getters: {}
};

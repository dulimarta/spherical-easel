import { describe, it, expect, vi, beforeEach } from "vitest";
import Label from "../Label";
import { LabelParentTypes, LabelDisplayMode } from "@/types";
import { DisplayStyle } from "../Nodule";
import { StyleCategory } from "@/types/Styles";
import SETTINGS, { LAYER } from "@/global-settings";

Number.prototype.toDegrees = function (): number {
  return (Number(this) / Math.PI) * 180;
};

// Mock SETTINGS and two.js dependencies
vi.mock("@/global-settings", () => {
  const mockDefault = {
    label: {
      fontSize: 12,
      glowingStrokeColor: { front: "#fff", back: "#000" },
      glowingStrokeWidth: { front: 1, back: 1 },
      maxLabelDisplayTextLength: 20,
      maxLabelDisplayCaptionLength: 40,
      fillColor: { front: "#fff", back: "#000" },
      style: "normal",
      family: "sans-serif",
      decoration: "none"
    },
    boundaryCircle: { radius: 1 },
    decimalPrecision: 2,
    point: { defaultLabelMode: 0 },
    line: { defaultLabelMode: 0 },
    segment: { defaultLabelMode: 0 },
    circle: { defaultLabelMode: 0 },
    angleMarker: { defaultLabelMode: 0 },
    parametric: { defaultLabelMode: 0 },
    ellipse: { defaultLabelMode: 0 },
    polygon: { defaultLabelMode: 0 },
    earthMode: { radiusMiles: 1, radiusKilometers: 1 }
  };
  enum mockLAYER {
    backgroundGlowing,
    backgroundFills,
    background,
    backgroundAngleMarkersGlowing,
    backgroundAngleMarkers,
    backgroundPointsGlowing,
    backgroundPoints,
    backgroundLabelGlowing,
    backgroundLabel,
    midground,
    foregroundGlowing,
    foregroundFills,
    foreground,
    foregroundAngleMarkersGlowing,
    foregroundAngleMarkers,
    foregroundPointsGlowing,
    foregroundPoints,
    foregroundLabelGlowing,
    foregroundLabel,
    foregroundText
  };
  return { default: mockDefault, LAYER: mockLAYER };
});

vi.mock("two.js/src/vector", () => ({
  Vector: class { set() {} }
}));
vi.mock("two.js/src/text", () => ({
  Text: class {
    constructor() { this.value = ""; this.visible = true; this.family = ""; this.style = ""; this.weight = 500; this.decoration = ""; this.rotation = 0; this.scale = 1; }
    set value(val) { this.value = val; }
    get value() { return this.value; }
    set visible(val) { this.visible = val; }
    get visible() { return this.visible; }
    set family(val) { this.family = val; }
    get family() { return this.family; }
    set style(val) { this.style = val; }
    get style() { return this.style; }
    set weight(val) { this.weight = val; }
    get weight() { return this.weight; }
    set decoration(val) { this.decoration = val; }
    get decoration() { return this.decoration; }
    set rotation(val) { this.rotation = val; }
    get rotation() { return this.rotation; }
    set scale(val) { this.scale = val; }
    get scale() { return this.scale; }
    getBoundingClientRect() { return { bottom: 0, height: 10, left: 0, right: 10, top: 0, width: 10 }; }
    noStroke() {}
  }
}));
vi.mock("two.js/src/group", () => ({
  Group: class {}
}));

describe("Label", () => {
  let label: Label;

  beforeEach(() => {
    label = new Label("TestLabel", "point" as LabelParentTypes);
  });

  //Constructor
  //Simply checks to make sure we can actually use the constructor. Very simple but good to check
  it("can be constructed", () => {
    expect(label).toBeInstanceOf(Label);
    expect(label.shortUserName).toBe("");
  });

  //Setters
  //Tests setters to make sure they are properly assigned
  it("sets and gets shortUserName", () => {
    label.shortUserName = "A";
    expect(label.shortUserName).toBe("A");
  });

  it("sets and gets caption", () => {
    label.caption = "Test Caption";
    expect(label.caption).toBe("Test Caption");
  });

  it("sets and gets value", () => {
    label.value = [1, 2, 3];
    expect(label.value).toEqual([1, 2, 3]);
  });

  //Display
  //Test methods that affect the display of the label
  it("shows front text when z > 0 in updateDisplay", () => {
    label.positionVector.x = 1;
    label.positionVector.y = 0;
    label.positionVector.z = 1; // z > 0
    label.updateDisplay();
    // @ts-expect-error: accessing protected for test
    expect(label.frontText.visible).toBe(true);
    // @ts-expect-error: accessing protected for test
    expect(label.backText.visible).toBe(false);
  });

it("shows back text when z <= 0 in updateDisplay", () => {
  label.positionVector.x = 1;
  label.positionVector.y = 0;
  label.positionVector.z = -1; // z <= 0
  label.updateDisplay();
  // @ts-expect-error: accessing protected for test
  expect(label.frontText.visible).toBe(false);
  // @ts-expect-error: accessing protected for test
  expect(label.backText.visible).toBe(true);
});

it("sets visibility correctly in frontGlowingDisplay", () => {
  label.frontGlowingDisplay();
  // @ts-expect-error: accessing protected for test
  expect(label.frontText.visible).toBe(true);
  // @ts-expect-error: accessing protected for test
  expect(label.glowingFrontText.visible).toBe(true);
  // @ts-expect-error: accessing protected for test
  expect(label.backText.visible).toBe(false);
  // @ts-expect-error: accessing protected for test
  expect(label.glowingBackText.visible).toBe(false);
});

it("backGlowingDisplay sets correct visibility", () => {
  label.backGlowingDisplay();
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.glowingFrontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(true);
  // @ts-expect-error: protected for test
  expect(label.glowingBackText.visible).toBe(true);
});

it("glowingDisplay calls front/back glowing based on z", () => {
  label._locationVector.z = 1;
  label.glowingDisplay();
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(true);
  label._locationVector.z = -1;
  label.glowingDisplay();
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(true);
});

it("frontNormalDisplay sets correct visibility", () => {
  label.frontNormalDisplay();
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(true);
  // @ts-expect-error: protected for test
  expect(label.glowingFrontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.glowingBackText.visible).toBe(false);
});

it("backNormalDisplay sets correct visibility", () => {
  label.backNormalDisplay();
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.glowingFrontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(true);
  // @ts-expect-error: protected for test
  expect(label.glowingBackText.visible).toBe(false);
});

it("normalDisplay calls front/back normal based on z", () => {
  label._locationVector.z = 1;
  label.normalDisplay();
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(true);
  label._locationVector.z = -1;
  label.normalDisplay();
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(true);
});

// Layer management
it("addToLayers adds each text object to the correct layer", () => {
  const addMocks = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
  // Create an array of 18 elements, all default to empty objects
  const layers = Array(18).fill({});

  // Assign your mock objects to the correct indices
  layers[LAYER.foregroundLabel] = { add: addMocks[0] };
  layers[LAYER.foregroundLabelGlowing] = { add: addMocks[1] };
  layers[LAYER.backgroundLabel] = { add: addMocks[2] };
  layers[LAYER.backgroundLabelGlowing] = { add: addMocks[3] };

  label.addToLayers(layers as any);

  // @ts-expect-error: protected for test
  expect(addMocks[0]).toHaveBeenCalledWith(label.frontText);
  // @ts-expect-error: protected for test
  expect(addMocks[1]).toHaveBeenCalledWith(label.glowingFrontText);
  // @ts-expect-error: protected for test
  expect(addMocks[2]).toHaveBeenCalledWith(label.backText);
  // @ts-expect-error: protected for test
  expect(addMocks[3]).toHaveBeenCalledWith(label.glowingBackText);
});



it("removeFromLayers removes text objects from correct layers", () => {
  const removeMocks = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
  // Create an array of 18 elements, all default to empty objects
  const layers = Array(18).fill({});

  // Assign your mock objects to the correct indices
  layers[LAYER.foregroundLabel] = { remove: removeMocks[0] };
  layers[LAYER.foregroundLabelGlowing] = { remove: removeMocks[1] };
  layers[LAYER.backgroundLabel] = { remove: removeMocks[2] };
  layers[LAYER.backgroundLabelGlowing] = { remove: removeMocks[3] };

  label.removeFromLayers(layers as any);

  // @ts-expect-error: protected for test
  expect(removeMocks[0]).toHaveBeenCalledWith(label.frontText);
  // @ts-expect-error: protected for test
  expect(removeMocks[1]).toHaveBeenCalledWith(label.glowingFrontText);
  // @ts-expect-error: protected for test
  expect(removeMocks[2]).toHaveBeenCalledWith(label.backText);
  // @ts-expect-error: protected for test
  expect(removeMocks[3]).toHaveBeenCalledWith(label.glowingBackText);
});


// setVisible
it("setVisible(false) hides all text objects", () => {
  label.setVisible(false);
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.glowingFrontText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(false);
  // @ts-expect-error: protected for test
  expect(label.glowingBackText.visible).toBe(false);
});

it("setVisible(true) shows correct text objects based on z", () => {
  label._locationVector.z = 1;
  label.setVisible(true);
  // @ts-expect-error: protected for test
  expect(label.frontText.visible).toBe(true);
  label._locationVector.z = -1;
  label.setVisible(true);
  // @ts-expect-error: protected for test
  expect(label.backText.visible).toBe(true);
});

// adjustSize
it("adjustSize sets scale for all text objects", () => {
  label.adjustSize();
  // @ts-expect-error: protected for test
  expect(label.frontText.scale).toBeTypeOf("number");
  // @ts-expect-error: protected for test
  expect(label.backText.scale).toBeTypeOf("number");
  // @ts-expect-error: protected for test
  expect(label.glowingFrontText.scale).toBeTypeOf("number");
  // @ts-expect-error: protected for test
  expect(label.glowingBackText.scale).toBeTypeOf("number");
});

// stylize
  it("stylize(DisplayStyle.ApplyCurrentVariables) sets text values", () => {
    // @ts-expect-error: protected for test
    label._value = [1, 2, 3];
    // @ts-expect-error: private for test
    label.seLabelParentType = "point";
    // Set display mode to ValueOnly
    label.updateStyle(StyleCategory.Label, { labelDisplayMode: LabelDisplayMode.ValueOnly });
    label.stylize(DisplayStyle.ApplyCurrentVariables);
    // @ts-expect-error: protected for test
    expect(label.frontText.value).toContain("(");
    // @ts-expect-error: protected for test
    expect(label.backText.value).toContain("(");
  });

// toSVG
it("toSVG returns correct SVG for front or back", () => {
  label._locationVector.z = 1;
  const svgFront = label.toSVG();
  expect(svgFront[0].type).toBe("label");
  label._locationVector.z = -1;
  const svgBack = label.toSVG();
  expect(svgBack[0].type).toBe("label");
});

// updateStyle
it("updateStyle sets shortUserName and caption", () => {
  label.updateStyle(StyleCategory.Label, { labelDisplayText: "TestName", labelDisplayCaption: "TestCaption" });
  expect(label.shortUserName).toBe("TestName");
  expect(label.caption).toBe("TestCaption");
});

// defaultStyleState
it("defaultStyleState returns correct defaults for point", () => {
  // @ts-expect-error: private for test
  label.seLabelParentType = "point";
  const defaults = label.defaultStyleState(StyleCategory.Label);
  // @ts-expect-error: private for test
  expect(defaults.labelDisplayText).toBe(label._defaultName);
  expect(defaults.labelDisplayMode).toBeDefined();
});


  //Coordinate Method
  //Tests for converting coordiantes from XYZ to latitude and longitude
  it("converts coordinates correctlly in NW quadrant in convertXYZtoLatLong", ()=>{
    const coords = [0.5, -0.5, Math.sqrt(0.5)];
    const result = label.convertXYZtoLatLong(coords);
    expect(result).toBe("(45.000\u{00B0}N,45.000\u{00B0}W)");
  });

  it("converts coordinates correctlly in NE quadrant in convertXYZtoLatLong", ()=>{
    const coords = [0.5, 0.5, Math.sqrt(0.5)];
    const result = label.convertXYZtoLatLong(coords);
    expect(result).toBe("(45.000\u{00B0}N,45.000\u{00B0}E)");
  });

  it("converts coordinates correctlly in SW quadrant in convertXYZtoLatLong", ()=>{
     // SW quadrant: x < 0, y < 0, z < 0 (southern hemisphere, west)
     const coords = [0.5, -0.5, -Math.sqrt(0.5)];
     const result = label.convertXYZtoLatLong(coords);
     expect(result).toBe("(45.000\u{00B0}S,45.000\u{00B0}W)");
  });

  it("converts coordinates correctlly in SE quadrant in convertXYZtoLatLong", ()=>{
     const coords = [0.5, 0.5, -Math.sqrt(0.5)];
     const result = label.convertXYZtoLatLong(coords);
     expect(result).toBe("(45.000\u{00B0}S,45.000\u{00B0}E)");
  });
});
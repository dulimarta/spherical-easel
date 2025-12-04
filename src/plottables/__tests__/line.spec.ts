import { describe, it, expect, vi, beforeEach } from "vitest";
import Line from "../Line";
import SETTINGS from "../../global-settings";
import { Vector3 } from "three";
import { DisplayStyle } from "../Nodule";

/* ===== Line: constructor and visibility initialization ===== */
describe("Line: constructor generates a valid line plottable", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("can be constructed with visible front/back arcs and hidden glowing arcs", () => {
    expect(line._frontHalf.visible).toBe(true);
    expect(line._backHalf.visible).toBe(true);
    expect(line._glowingFrontHalf.visible).toBe(false);
    expect(line._glowingBackHalf.visible).toBe(false);
  });
});

/* ===== Line: display functions ===== */
describe("Line: display functions properly set visibility", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("shows glowing arcs in glowingDisplay", () => {
    line.glowingDisplay();
    expect(line._glowingFrontHalf.visible).toBe(true);
    expect(line._glowingBackHalf.visible).toBe(true);
  });

  it("hides glowing arcs again in normalDisplay", () => {
    line.glowingDisplay();
    line.normalDisplay();
    expect(line._glowingFrontHalf.visible).toBe(false);
    expect(line._glowingBackHalf.visible).toBe(false);
  });

  it("toggles visibility correctly with setVisible", () => {
    line.setVisible(false);
    expect(line._frontHalf.visible).toBe(false);
    expect(line._backHalf.visible).toBe(false);
    line.setVisible(true);
    expect(line._frontHalf.visible).toBe(true);
    expect(line._backHalf.visible).toBe(true);
  });
});

/* ===== Line: vector and transformation behavior ===== */
describe("Line: vector and transformation behavior", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("sets and gets normalVector as a Vector3", () => {
    const newVec = new Vector3(1, 2, 3);
    line._normalVector = newVec;
    expect(line._normalVector).toBeInstanceOf(Vector3);
  });

  it("applies rotation and height in updateDisplay", () => {
    line._normalVector = new Vector3(1, 0, 0.5);
    line.updateDisplay();
    expect(line._frontHalf.rotation).not.toBeUndefined();
    expect(line._frontHalf.height).not.toBe(0);
  });

  it("handles near-zero axis values gracefully in updateDisplay", () => {
    line._normalVector = new Vector3(0, 0, 1e-12);
    line.updateDisplay();
    expect(line._frontHalf.rotation).not.toBeUndefined();
    expect(line._frontHalf.height).toBeGreaterThanOrEqual(0);
  });
});

/* ===== Line: SVG output ===== */
describe("Line: SVG export functions correctly", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("produces a line element in toSVG", () => {
    const svg = line.toSVG();
    expect(Array.isArray(svg)).toBe(true);
    expect(svg[0].type).toBe("line");
  });

  it("uses the correct path flag when normal vector points forward", () => {
    line._normalVector = new Vector3(0, 0, 1);
    const svg = line.toSVG();
    expect(svg[0].type).toBe("line");
  });

  it("uses the correct path flag when normal vector points backward", () => {
    line._normalVector = new Vector3(0, 0, -1);
    const svg = line.toSVG();
    expect(svg[0].type).toBe("line");
  });
});

/* ===== Line: styling behavior ===== */
describe("Line: styling functions properly adjust appearance", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("adjusts arc linewidths with adjustSize", () => {
    line.adjustSize();
    expect(line._frontHalf.linewidth).toBeGreaterThan(0);
    expect(line._backHalf.linewidth).toBeGreaterThan(0);
  });

  it("applies temporary stroke color in stylize", () => {
    const mockDashes: any = { clear: vi.fn(), push: vi.fn(), reverse: vi.fn() };
    line._frontHalf.dashes = { ...mockDashes };
    line._backHalf.dashes = { ...mockDashes };
    line._glowingFrontHalf.dashes = { ...mockDashes };
    line._glowingBackHalf.dashes = { ...mockDashes };

    const oldStroke = line._frontHalf.stroke;
    line.stylize(DisplayStyle.ApplyTemporaryVariables);
    expect(line._frontHalf.stroke).not.toBe(oldStroke);
  });

  it("applies dash arrays safely in stylize", () => {
    const mockDashes: any = { clear: vi.fn(), push: vi.fn(), reverse: vi.fn() };
    line._frontHalf.dashes = { ...mockDashes };
    line._backHalf.dashes = { ...mockDashes };
    line._glowingFrontHalf.dashes = { ...mockDashes };
    line._glowingBackHalf.dashes = { ...mockDashes };

    const frontStyle = line.styleOptions.get("Front");
    if (frontStyle) {
      frontStyle.useDashPattern = true;
      frontStyle.dashArray = [2, 4];
    }

    line.stylize(DisplayStyle.ApplyCurrentVariables);
    expect(line._frontHalf.dashes.clear).toHaveBeenCalled();
    expect(line._frontHalf.dashes.push).toHaveBeenCalled();
  });

  it("applies dynamic back style in stylize when enabled", () => {
    const mockDashes: any = { clear: vi.fn(), push: vi.fn(), reverse: vi.fn() };
    line._frontHalf.dashes = { ...mockDashes };
    line._backHalf.dashes = { ...mockDashes };
    line._glowingFrontHalf.dashes = { ...mockDashes };
    line._glowingBackHalf.dashes = { ...mockDashes };

    const backStyle = line.styleOptions.get("Back");
    if (backStyle) {
      backStyle.dynamicBackStyle = true;
    }

    line.stylize(DisplayStyle.ApplyCurrentVariables);
    expect(line._backHalf.stroke).toBeDefined();
    expect(line._backHalf.stroke).not.toBe("");
  });
});

/* ===== Line: layer management ===== */
describe("Line: layer management properly adds and removes arcs", () => {
  let line: any;
  beforeEach(() => {
    line = new Line("Line");
  });

  it("adds arcs to groups in addToLayers", () => {
    const added: any[] = [];
    const fakeGroup = { add: (obj: any) => added.push(obj) };
    const layers = Array(19).fill(null).map(() => fakeGroup);

    line.addToLayers(layers);
    expect(added).toContain(line._frontHalf);
    expect(added).toContain(line._backHalf);
  });

  it("removes arcs from layers in removeFromLayers", () => {
    line._frontHalf.remove = vi.fn();
    line._backHalf.remove = vi.fn();
    line._glowingFrontHalf.remove = vi.fn();
    line._glowingBackHalf.remove = vi.fn();

    line.removeFromLayers();

    expect(line._frontHalf.remove).toHaveBeenCalled();
    expect(line._backHalf.remove).toHaveBeenCalled();
    expect(line._glowingFrontHalf.remove).toHaveBeenCalled();
    expect(line._glowingBackHalf.remove).toHaveBeenCalled();
  });
});

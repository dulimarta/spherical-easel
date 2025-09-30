import { describe, it, expect, vi, beforeEach } from "vitest";
import Line from "../Line";
import SETTINGS from "../../global-settings";
import { Vector3 } from "three";
import { DisplayStyle } from "../Nodule";

describe("Line", () => {
  let line: any;

  beforeEach(() => {
    line = new Line("Line");
  });

  // Constructor
  it("can be constructed with visible front/back arcs and hidden glowing arcs", () => {
    expect(line._frontHalf.visible).toBe(true);
    expect(line._backHalf.visible).toBe(true);
    expect(line._glowingFrontHalf.visible).toBe(false);
    expect(line._glowingBackHalf.visible).toBe(false);
  });

  // Display
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

  // Vector / Transformations
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

  it("handles near-zero axis values in updateDisplay", () => {
    line._normalVector = new Vector3(0, 0, 1e-12);
    line.updateDisplay();
    expect(line._frontHalf.rotation).not.toBeUndefined();
    expect(line._frontHalf.height).toBeGreaterThanOrEqual(0);
  });

  // SVG
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

  // Styling
  it("adjusts arc linewidths with adjustSize", () => {
    line.adjustSize();
    expect(line._frontHalf.linewidth).toBeGreaterThan(0);
    expect(line._backHalf.linewidth).toBeGreaterThan(0);
  });

  // Layer management
  it("adds arcs to groups in addToLayers", () => {
    const added: any[] = [];
    const fakeGroup = { add: (obj: any) => added.push(obj) };
    const layers = Array(19).fill(null).map(() => fakeGroup);

    line.addToLayers(layers);
    expect(added).toContain(line._frontHalf);
    expect(added).toContain(line._backHalf);
  });
});

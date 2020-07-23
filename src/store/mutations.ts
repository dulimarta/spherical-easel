import { AppState, SEOneDimensional } from "@/types";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { Matrix4 } from "three";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { SELine } from "@/models/SELine";
import { SENodule } from "@/models/SENodule";
import { Vector3 } from "three";
import { StyleOptions } from "@/types/Styles";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";
import { UpdateMode, UpdateStateType } from "@/types";

// const tmpMatrix = new Matrix4();

//#region appState
export const initialState: AppState = {
  // AppState is a type defined in @/types/index.ts
  sphereRadius: 0, // Is this needed? TODO: remove?
  actionMode: "rotate", // The action mode of the Sphere Canvas
  previousActionMode: "rotate", // The previous action mode
  activeToolName: "", // The active tool for handling user mouse input
  previousActiveToolName: "", // The active tool for handling user mouse input
  zoomMagnificationFactor: 1, // The CSSTransform magnification factor
  previousZoomMagnificationFactor: 1, // The previous CSSTransform magnification factor
  zoomTranslation: [0, 0], // The CSSTransform translation vector
  nodules: [], // An array of all SENodules
  selections: [], // An array of selected SENodules
  layers: [], // An array of Two.Group pointer to the layers in the twoInstance
  points: [], // An array of all SEPoints
  lines: [], // An array of all SELines
  segments: [], // An array of all SESegments
  circles: [], // An array of all SECircles
  intersections: [] // An array of all SEPoints that are intersections of the one-dimensional objects in the arrangement
};
//#endregion appState

const rotationVisitor = new RotationVisitor();
const pointMoverVisitor = new PointMoverVisitor();
const lineNormalVisitor = new LineNormalVisitor();
const segmentNormalArcLengthVisitor = new SegmentNormalArcLengthVisitor();

export default {
  init(state: AppState): void {
    state.actionMode = "";
    state.activeToolName = "";
    // Do not clear the layers array!
    state.nodules.clear();
    state.points.clear();
    state.lines.clear();
    state.segments.clear();
    state.circles.clear();
    state.selections.clear();
    state.intersections.clear();
  },
  setLayers(state: AppState, layers: Two.Group[]): void {
    state.layers = layers;
  },
  setSphereRadius(state: AppState, radius: number): void {
    state.sphereRadius = radius;
  },
  setActionMode(state: AppState, mode: { id: string; name: string }): void {
    // zoomFit is a one-off tool, so the previousActionMode should never be "zoomFit" (avoid infinite loops too!)
    if (state.actionMode != "zoomFit") {
      state.previousActionMode = state.actionMode;
      state.previousActiveToolName = state.activeToolName;
    }
    state.actionMode = mode.id;
    state.activeToolName = mode.name;
  },

  revertActionMode(state: AppState, st: string): void {
    state.actionMode = state.previousActionMode;
    state.activeToolName = state.previousActiveToolName;
  },

  setZoomMagnificationFactor(state: AppState, mag: number): void {
    state.previousZoomMagnificationFactor = state.zoomMagnificationFactor;
    state.zoomMagnificationFactor = mag;
  },
  setZoomTranslation(state: AppState, vec: number[]): void {
    for (let i = 0; i < 2; i++) {
      state.zoomTranslation[i] = vec[i];
    }
  },

  //#region addPoint
  addPoint(state: AppState, point: SEPoint): void {
    state.points.push(point);
    state.nodules.push(point);
    point.ref.addToLayers(state.layers);
  },
  //#endregion addPoint

  removePoint(state: AppState, pointId: number): void {
    const pos = state.points.findIndex(x => x.id === pointId);
    const pos2 = state.nodules.findIndex(x => x.id === pointId);
    if (pos >= 0) {
      const victimPoint = state.points[pos];
      state.points.splice(pos, 1);
      state.nodules.splice(pos2, 1);
      // Remove the associated plottable (Nodule) object from being rendered
      victimPoint.ref.removeFromLayers();
    }
  },

  addLine(state: AppState, line: SELine): void {
    state.lines.push(line);
    state.nodules.push(line);
    line.ref.addToLayers(state.layers);
  },
  removeLine(state: AppState, lineId: number): void {
    const pos = state.lines.findIndex(x => x.id === lineId);
    const pos2 = state.nodules.findIndex(x => x.id === lineId);
    if (pos >= 0) {
      /* victim line is found */
      const victimLine = state.lines[pos];
      victimLine.ref.removeFromLayers();
      state.lines.splice(pos, 1); // Remove the line from the list
      state.nodules.splice(pos2, 1);
    }
  },
  addSegment(state: AppState, segment: SESegment): void {
    state.segments.push(segment);
    state.nodules.push(segment);
    segment.ref.addToLayers(state.layers);
  },
  removeSegment(state: AppState, segId: number): void {
    const pos = state.segments.findIndex(x => x.id === segId);
    const pos2 = state.nodules.findIndex(x => x.id === segId);
    if (pos >= 0) {
      const victimSegment = state.segments[pos];
      victimSegment.ref.removeFromLayers();
      state.segments.splice(pos, 1);
      state.nodules.splice(pos2, 1);
    }
  },
  addCircle(state: AppState, circle: SECircle): void {
    state.circles.push(circle);
    state.nodules.push(circle);
    circle.ref.addToLayers(state.layers);
  },
  removeCircle(state: AppState, circleId: number): void {
    const circlePos = state.circles.findIndex(x => x.id === circleId);
    const pos2 = state.nodules.findIndex(x => x.id === circleId);
    if (circlePos >= 0) {
      /* victim line is found */
      const victimCircle: SECircle = state.circles[circlePos];
      victimCircle.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      state.circles.splice(circlePos, 1); // Remove the line from the list
      state.nodules.splice(pos2, 1);
    }
  },
  //#region rotateSphere
  rotateSphere(state: AppState, rotationMat: Matrix4): void {
    rotationVisitor.setTransform(rotationMat);
    state.points.forEach((p: SEPoint) => {
      p.accept(rotationVisitor);
    });
  },
  //#endregion rotateSphere
  movePoint(
    state: AppState,
    move: { pointId: number; location: Vector3 }
  ): void {
    pointMoverVisitor.setNewLocation(move.location);
    const pos = state.points.findIndex(x => x.id === move.pointId);
    state.points[pos].accept(pointMoverVisitor);
  },
  changeLineNormalVector(
    state: AppState,
    change: { lineId: number; normal: Vector3 }
  ): void {
    lineNormalVisitor.setNewNormal(change.normal);
    const pos = state.lines.findIndex(x => x.id === change.lineId);
    if (pos >= 0) state.lines[pos].accept(lineNormalVisitor);
  },
  changeSegmentNormalVectorArcLength(
    state: AppState,
    change: { segmentId: number; normal: Vector3; arcLength: number }
  ): void {
    segmentNormalArcLengthVisitor.setNewNormal(change.normal);
    segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
    const pos = state.segments.findIndex(x => x.id === change.segmentId);
    if (pos >= 0) state.segments[pos].accept(segmentNormalArcLengthVisitor);
  },
  setSelectedObjects(state: AppState, payload: SENodule[]): void {
    state.selections.splice(0);
    state.selections.push(...payload);
  },
  // Update the display of all free SEPoints to update the entire display
  updateDisplay(state: AppState): void {
    state.nodules
      .filter(obj => obj.isFreePoint())
      .forEach(obj =>
        obj.update({ mode: UpdateMode.DisplayOnly, stateArray: [] })
      );
  },
  // TODO: combine the following changeXXXX functions
  changeStrokeWidth(state: AppState, percent: number): void {
    const opt: StyleOptions = {
      strokeWidthPercentage: percent
    };
    state.selections
      .filter(n => !(n instanceof SEPoint))
      .map(n => n as SEOneDimensional) // TODO: handle other object types
      .forEach((n: SEOneDimensional) => {
        // console.debug(`Changing stroke width of ${n.name} to ${width}`);
        n.ref.updateStyle(opt);
      });
  },
  changeColor(
    state: AppState,
    { color, props }: { color: string; props: string[] }
  ): void {
    const opt: any = {};
    props.forEach(s => {
      opt[s] = color;
    });
    state.selections
      .filter(n => !(n instanceof SEPoint))
      .map(n => n as SEOneDimensional) // TODO: handle other object types
      .forEach((n: SEOneDimensional) => {
        // console.debug(`Changing stroke color of ${n.name} to ${color}`);
        n.ref.updateStyle(opt);
      });
  },
  changeDashPattern(state: AppState, dashPattern: number[]): void {
    const opt: StyleOptions = {
      dashPattern
    };
    state.selections
      .filter(n => !(n instanceof SEPoint))
      .map(n => n as SEOneDimensional) // TODO: handle other object types
      .forEach((n: SEOneDimensional) => {
        // console.debug(`Changing stroke color of ${n.name} to ${color}`);
        n.ref.updateStyle(opt);
      });
  }
};

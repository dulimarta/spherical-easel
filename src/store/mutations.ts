import { AppState } from "@/types";
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

// const tmpMatrix = new Matrix4();

//#region appState
export const initialState: AppState = {
  sphereRadius: 0, // Is this needed? TODO: remove?
  actionMode: "rotate", // The action mode of the Sphere Canvas
  activeToolName: "", // The active tool for handling user mouse input
  zoomMagnificationFactor: 1, // The CSSTransform magnification factor
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
    state.intersections.clear();
  },
  setLayers(state: AppState, layers: Two.Group[]): void {
    state.layers = layers;
  },
  setSphereRadius(state: AppState, radius: number): void {
    state.sphereRadius = radius;
  },
  setActionMode(state: AppState, mode: { id: string; name: string }): void {
    state.actionMode = mode.id;
    state.activeToolName = mode.name;
  },
  setZoomMagnificationFactor(state: AppState, mag: number): void {
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
      // Remove the associated plottable (Nodule) object from being rendered
      victimPoint.ref.removeFromLayers();
      // Remove the victim point from the parent/kid data structure -- needed?
      //victimPoint.removeSelfSafely();
      state.points.splice(pos, 1);
      state.nodules.splice(pos2, 1);
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
      //victimLine.removeSelfSafely(); // needed?
      state.lines.splice(pos, 1); // Remove the line from the list
      state.nodules.splice(pos2, 1);
    }
  },
  addSegment(state: AppState, segment: SESegment): void {
    state.segments.push(segment);
    state.nodules.push(segment);
    segment.ref.addToLayers(state.layers);
    console.log("parent 0", segment.parents[0].name);
    console.log("parent 1", segment.parents[1].name);
  },
  removeSegment(state: AppState, segId: number): void {
    const pos = state.segments.findIndex(x => x.id === segId);
    const pos2 = state.nodules.findIndex(x => x.id === segId);
    if (pos >= 0) {
      const victimSegment = state.segments[pos];
      victimSegment.ref.removeFromLayers();
      // victimSegment.removeSelfSafely();
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
    //Update all the other objects in the arrangement.
    // We shouldn't have to do this. Everything should depend on points.
    // state.lines.forEach((l: SELine) => {
    //   l.accept(positionVisitor);
    // });
    // state.circles.forEach((l: SECircle) => {
    //   l.accept(positionVisitor);
    // });
    // state.segments.forEach((s: SESegment) => {
    //   s.accept(positionVisitor);
    // });
  },
  //#endregion rotateSphere
  movePoint(
    state: AppState,
    move: { pointId: number; location: Vector3 }
  ): void {
    pointMoverVisitor.setNewLocation(move.location);
    const pos = state.points.findIndex(x => x.id === move.pointId);
    state.points[pos].accept(pointMoverVisitor);
    //Update all the other objects in the arrangement.
    // We shouldn't have to do this. Everything should depend on points.
    // state.lines.forEach((l: SELine) => {
    //   l.accept(positionVisitor);
    // });
    // state.circles.forEach((l: SECircle) => {
    //   l.accept(positionVisitor);
    // });
    // state.segments.forEach((s: SESegment) => {
    //   s.accept(positionVisitor);
    // });
  },
  setSelectedObjects(state: AppState, selection: SENodule[]): void {
    state.selections.clear();
    state.selections.push(...selection);
  }
};

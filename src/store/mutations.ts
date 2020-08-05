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
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import { SEMeasurement } from "@/models/SEMeasurement";
import { SECalculation } from "@/models/SECalculation";
import SETTINGS from "@/global-settings";

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
  seNodules: [], // An array of all SENodules
  selections: [], // An array of selected SENodules
  layers: [], // An array of Two.Group pointer to the layers in the twoInstance
  sePoints: [], // An array of all SEPoints
  seLines: [], // An array of all SELines
  seSegments: [], // An array of all SESegments
  seCircles: [], // An array of all SECircles
  temporaryNodules: [], // An array of all Nodules that are temporary - created by the handlers.
  intersections: [],
  measurements: [],
  calculations: [],
  initialStyleStates: [],
  defaultStyleStates: [],
  initialBackStyleContrast: SETTINGS.style.backStyleContrast
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
    state.seNodules.clear();
    state.sePoints.clear();
    state.seLines.clear();
    state.seSegments.clear();
    state.seCircles.clear();
    state.selections.clear();
    state.intersections.clear();
    state.measurements.clear();
    state.calculations.clear();
    state.initialStyleStates.clear();
    state.defaultStyleStates.clear();
    //state.temporaryNodules.clear(); // Do not clear the temporaryNodules array
    // because the constructors of the tools (handlers) place the temporary Nodules
    // in this array *before* the this.init is called in App.vue mount.
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

  revertActionMode(state: AppState): void {
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
    state.sePoints.push(point);
    state.seNodules.push(point);
    point.ref.addToLayers(state.layers);
  },
  //#endregion addPoint
  removePoint(state: AppState, pointId: number): void {
    const pos = state.sePoints.findIndex(x => x.id === pointId);
    const pos2 = state.seNodules.findIndex(x => x.id === pointId);
    if (pos >= 0) {
      const victimPoint = state.sePoints[pos];
      state.sePoints.splice(pos, 1);
      state.seNodules.splice(pos2, 1);
      // Remove the associated plottable (Nodule) object from being rendered
      victimPoint.ref.removeFromLayers();
    }
  },
  addLine(state: AppState, line: SELine): void {
    state.seLines.push(line);
    state.seNodules.push(line);
    line.ref.addToLayers(state.layers);
  },
  removeLine(state: AppState, lineId: number): void {
    const pos = state.seLines.findIndex(x => x.id === lineId);
    const pos2 = state.seNodules.findIndex(x => x.id === lineId);
    if (pos >= 0) {
      /* victim line is found */
      const victimLine = state.seLines[pos];
      victimLine.ref.removeFromLayers();
      state.seLines.splice(pos, 1); // Remove the line from the list
      state.seNodules.splice(pos2, 1);
    }
  },
  addSegment(state: AppState, segment: SESegment): void {
    state.seSegments.push(segment);
    state.seNodules.push(segment);
    segment.ref.addToLayers(state.layers);
  },
  removeSegment(state: AppState, segId: number): void {
    const pos = state.seSegments.findIndex(x => x.id === segId);
    const pos2 = state.seNodules.findIndex(x => x.id === segId);
    if (pos >= 0) {
      const victimSegment = state.seSegments[pos];
      victimSegment.ref.removeFromLayers();
      state.seSegments.splice(pos, 1);
      state.seNodules.splice(pos2, 1);
    }
  },
  addCircle(state: AppState, circle: SECircle): void {
    state.seCircles.push(circle);
    state.seNodules.push(circle);
    circle.ref.addToLayers(state.layers);
  },
  removeCircle(state: AppState, circleId: number): void {
    const circlePos = state.seCircles.findIndex(x => x.id === circleId);
    const pos2 = state.seNodules.findIndex(x => x.id === circleId);
    if (circlePos >= 0) {
      /* victim line is found */
      const victimCircle: SECircle = state.seCircles[circlePos];
      victimCircle.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      state.seCircles.splice(circlePos, 1); // Remove the line from the list
      state.seNodules.splice(pos2, 1);
    }
  },
  // These are added to the store so that I can update the size of the temporary objects when there is a resize event.
  addTemporaryNodule(state: AppState, nodule: Nodule): void {
    state.temporaryNodules.push(nodule);
  },
  // The temporary nodules are added to the store when a handler is constructed, when are they removed? Do I need a removeTemporaryNodule?
  //#region rotateSphere
  rotateSphere(state: AppState, rotationMat: Matrix4): void {
    rotationVisitor.setTransform(rotationMat);
    state.sePoints.forEach((p: SEPoint) => {
      p.accept(rotationVisitor);
    });
  },
  //#endregion rotateSphere
  movePoint(
    state: AppState,
    move: { pointId: number; location: Vector3 }
  ): void {
    pointMoverVisitor.setNewLocation(move.location);
    const pos = state.sePoints.findIndex(x => x.id === move.pointId);
    state.sePoints[pos].accept(pointMoverVisitor);
  },
  changeLineNormalVector(
    state: AppState,
    change: { lineId: number; normal: Vector3 }
  ): void {
    lineNormalVisitor.setNewNormal(change.normal);
    const pos = state.seLines.findIndex(x => x.id === change.lineId);
    if (pos >= 0) state.seLines[pos].accept(lineNormalVisitor);
  },
  changeSegmentNormalVectorArcLength(
    state: AppState,
    change: { segmentId: number; normal: Vector3; arcLength: number }
  ): void {
    segmentNormalArcLengthVisitor.setNewNormal(change.normal);
    segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
    const pos = state.seSegments.findIndex(x => x.id === change.segmentId);
    if (pos >= 0) state.seSegments[pos].accept(segmentNormalArcLengthVisitor);
  },
  setSelectedSENodules(state: AppState, payload: SENodule[]): void {
    state.selections.splice(0);
    state.selections.push(...payload);
  },
  // Update the display of all free SEPoints to update the entire display
  updateDisplay(state: AppState): void {
    state.seNodules
      .filter(obj => obj.isFreePoint())
      .forEach(obj => {
        // First mark the kids out of date so that the update method does a topological sort
        obj.markKidsOutOfDate();
        obj.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      });
  },
  changeStyle(
    state: AppState,
    {
      selected, // The selected SENodules that this change applies to, passing this as a argument allows styling to be undone.
      payload
    }: {
      selected: SENodule[];
      payload: StyleOptions;
    }
  ): void {
    const opt: any = {
      front: payload.front,
      strokeWidthPercent: payload.strokeWidthPercent,
      strokeColor: payload.strokeColor,
      fillColor: payload.fillColor,
      dashArray: payload.dashArray,
      opacity: payload.opacity,
      dynamicBackStyle: payload.dynamicBackStyle,
      pointRadiusPercent: payload.pointRadiusPercent
    };
    if (
      payload.backStyleContrast &&
      payload.backStyleContrast != Nodule.getBackStyleContrast()
    ) {
      // Update all Nodules because more than just the selected nodules depend on the backStyleContrast
      Nodule.setBackStyleContrast(payload.backStyleContrast);
      state.seNodules.forEach((n: SENodule) => {
        n.ref?.stylize(DisplayStyle.APPLYCURRENTVARIABLES);
      });
    }
    selected.forEach((n: SENodule) => {
      n.ref?.updateStyle(opt as StyleOptions);
    });
  },
  addMeasurement(state: AppState, measurement: SEMeasurement): void {
    state.measurements.push(measurement);
    state.seNodules.push(measurement);
  },
  removeMeasurement(state: AppState, measId: number): void {
    const pos = state.measurements.findIndex(x => x.id === measId);
    const pos2 = state.seNodules.findIndex(x => x.id === measId);
    if (pos >= 0) {
      // const victimSegment = state.measurements[pos];
      state.measurements.splice(pos, 1);
      state.seNodules.splice(pos2, 1);
    }
  },
  addCalculation(state: AppState, calc: SECalculation): void {
    // TODO: should we also push it to state.nodules?
    // state.nodules.push(calc);
    state.calculations.push(calc);
  },
  removeCalculation(state: AppState, calcId: number): void {
    const pos = state.calculations.findIndex(c => c.id === calcId);
    // const pos2 = state.nodules.findIndex(x => x.id === calcId);
    if (pos >= 0) {
      state.calculations.splice(pos, 1);
      // state.nodules.splice(pos2, 1);
    }
  },
  setStyleState(
    state: AppState,
    {
      selected, // The selected SENodules that this change applies to, passing this as a argument allows styling to be undone.
      backContrast
    }: {
      selected: SENodule[];
      backContrast: number;
    }
  ): void {
    state.initialStyleStates.clear();
    state.defaultStyleStates.clear();
    selected.forEach(seNodule => {
      // The first half is the front style settings, the second half the back
      if (seNodule.ref) {
        state.initialStyleStates.push(
          seNodule.ref.currentStyleState(SETTINGS.style.frontFace)
        );
        state.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(SETTINGS.style.frontFace)
        );
      }
    });
    selected.forEach(seNodule => {
      if (seNodule.ref) {
        state.initialStyleStates.push(
          seNodule.ref.currentStyleState(SETTINGS.style.backFace)
        );
        state.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(SETTINGS.style.backFace)
        );
      }
    });
    state.initialBackStyleContrast = backContrast;
  }
};

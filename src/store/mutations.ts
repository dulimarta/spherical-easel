import { AppState, Labelable } from "@/types";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { LabelMoverVisitor } from "@/visitors/LabelMoverVisitor";
import { SELine } from "@/models/SELine";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { Vector3, Matrix4 } from "three";
import { StyleOptions, StyleEditPanels } from "@/types/Styles";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";
import { UpdateMode } from "@/types";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import SETTINGS from "@/global-settings";
import { SEExpression } from "@/models/SEExpression";
import { SEAngleMarker } from "@/models/SEAngleMarker";

const tmpMatrix = new Matrix4();
//const tmpVector = new Vector3();

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
  canvasWidth: 0, //A temporary canvas width;
  seNodules: [], // An array of all SENodules
  selections: [], // An array of selected SENodules
  layers: [], // An array of Two.Group pointer to the layers in the twoInstance
  sePoints: [], // An array of all SEPoints
  seLines: [], // An array of all SELines
  seSegments: [], // An array of all SESegments
  seCircles: [], // An array of all SECircles
  seAngleMarkers: [], // An array of all SEAngleMarkers
  seLabels: [], // An array of all SELabels
  temporaryNodules: [], // An array of all Nodules that are temporary - created by the handlers.
  intersections: [],
  // measurements: [],
  expressions: [],
  initialStyleStates: [],
  defaultStyleStates: [],
  initialBackStyleContrast: SETTINGS.style.backStyleContrast,
  useLabelMode: false,
  inverseTotalRotationMatrix: new Matrix4() //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
};
//#endregion appState

const rotationVisitor = new RotationVisitor();
const pointMoverVisitor = new PointMoverVisitor();
const labelMoverVisitor = new LabelMoverVisitor();
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
    state.seAngleMarkers.clear();
    state.seLabels.clear();
    state.selections.clear();
    state.intersections.clear();
    state.expressions.clear();
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
  // In the case of one non-labe object being selected, the label panel should edit that object's label and the fore/back ground should edit
  // that selectedObject fore and back properties: useLabelMode indicates that we are doing this.
  setUseLabelMode(state: AppState, value: boolean): void {
    state.useLabelMode = value;
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
  addLabel(state: AppState, label: SELabel): void {
    state.seLabels.push(label);
    state.seNodules.push(label);
    label.ref.addToLayers(state.layers);
  },
  removeLabel(state: AppState, labelId: number): void {
    const pos = state.seLabels.findIndex(x => x.id === labelId);
    const pos2 = state.seNodules.findIndex(x => x.id === labelId);
    if (pos >= 0) {
      const victimLabel = state.seLabels[pos];
      state.seLabels.splice(pos, 1);
      state.seNodules.splice(pos2, 1);
      // Remove the associated plottable (Nodule) object from being rendered
      victimLabel.ref.removeFromLayers(state.layers);
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
      state.seCircles.splice(circlePos, 1); // Remove the circle from the list
      state.seNodules.splice(pos2, 1);
    }
  },
  addAngleMarkerAndExpression(
    state: AppState,
    angleMarker: SEAngleMarker
  ): void {
    state.expressions.push(angleMarker);
    state.seAngleMarkers.push(angleMarker);
    state.seNodules.push(angleMarker);
    angleMarker.ref.addToLayers(state.layers);
  },
  removeAngleMarkerAndExpression(state: AppState, angleMarkerId: number): void {
    const angleMarkerPos = state.seAngleMarkers.findIndex(
      x => x.id === angleMarkerId
    );
    const pos2 = state.seNodules.findIndex(x => x.id === angleMarkerId);
    const pos3 = state.expressions.findIndex(x => x.id === angleMarkerId);
    if (angleMarkerPos >= 0) {
      /* victim angleMarker is found */
      const victimAngleMarker: SEAngleMarker =
        state.seAngleMarkers[angleMarkerPos];
      victimAngleMarker.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      state.seAngleMarkers.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
      state.seNodules.splice(pos2, 1);
      state.expressions.splice(pos3, 1);
    }
  },
  addExpression(state: AppState, measurement: SEExpression): void {
    state.expressions.push(measurement);
    state.seNodules.push(measurement);
  },
  removeExpression(state: AppState, measId: number): void {
    const pos = state.expressions.findIndex(x => x.id === measId);
    const pos2 = state.seNodules.findIndex(x => x.id === measId);
    if (pos >= 0) {
      // const victimSegment = state.measurements[pos];
      state.expressions.splice(pos, 1);
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
    // Update the inverseTotalRotationMatrix. We have a new rotationMat which is transforming by
    //   rotationMat*oldTotalRotationMatrix * VEC
    // so to undo that action we find the inverse which is
    //  inverseTotalRotationMatrix*(inverse of rotationMat)
    tmpMatrix.copy(rotationMat);
    state.inverseTotalRotationMatrix.multiply(tmpMatrix.getInverse(tmpMatrix));
    rotationVisitor.setTransform(rotationMat);
    // apply the rotation to the line, segments, labels, then points.
    state.seLines.forEach((m: SELine) => {
      m.accept(rotationVisitor); // Does no updating of the display
    });
    state.seSegments.forEach((s: SESegment) => {
      s.accept(rotationVisitor); // Does no updating of the display
    });
    state.seLabels.forEach((l: SELabel) => {
      l.accept(rotationVisitor); // Does no updating of the display
    });
    state.sePoints.forEach((p: SEPoint) => {
      p.accept(rotationVisitor); // Does no updating of the display
    });
    // now do the update of the free points so that display is correct
    state.sePoints.forEach((p: SEPoint) => {
      if (p.isFreeToMove()) {
        p.markKidsOutOfDate(); // so this does a topological sort and update is only executed once on each point
        p.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
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
  moveLabel(
    state: AppState,
    move: { labelId: number; location: Vector3 }
  ): void {
    labelMoverVisitor.setNewLocation(move.location);
    const pos = state.seLabels.findIndex(x => x.id === move.labelId);
    state.seLabels[pos].accept(labelMoverVisitor);
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
  unglowAllSENodules(state: AppState): void {
    state.seNodules.forEach((p: SENodule) => {
      p.glowing = false;
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
    const opt: StyleOptions = {
      panel: payload.panel,
      strokeWidthPercent: payload.strokeWidthPercent,
      strokeColor: payload.strokeColor,
      fillColor: payload.fillColor,
      dashArray: payload.dashArray,
      opacity: payload.opacity,
      dynamicBackStyle: payload.dynamicBackStyle,
      pointRadiusPercent: payload.pointRadiusPercent,
      labelTextStyle: payload.labelTextStyle,
      labelTextFamily: payload.labelTextFamily,
      labelTextDecoration: payload.labelTextDecoration,
      labelTextRotation: payload.labelTextRotation,
      labelTextScalePercent: payload.labelTextScalePercent,
      labelDisplayText: payload.labelDisplayText,
      labelDisplayCaption: payload.labelDisplayCaption,
      labelDisplayMode: payload.labelDisplayMode,
      labelVisibility: payload.labelVisibility,
      objectVisibility: payload.objectVisibility
    };
    if (
      payload.backStyleContrast &&
      payload.backStyleContrast != Nodule.getBackStyleContrast()
    ) {
      // Update all Nodules because more than just the selected nodules depend on the backStyleContrast
      Nodule.setBackStyleContrast(payload.backStyleContrast);
      state.seNodules.forEach((n: SENodule) => {
        n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      });
    }
    selected.forEach((n: SENodule) => {
      n.ref?.updateStyle(opt);
    });
  },

  // addCalculation(state: AppState, calc: SECalculation): void {
  //   // TODO: should we also push it to state.nodules?
  //   // state.nodules.push(calc);
  //   state.calculations.push(calc);
  // },
  // removeCalculation(state: AppState, calcId: number): void {
  //   const pos = state.calculations.findIndex(c => c.id === calcId);
  //   // const pos2 = state.nodules.findIndex(x => x.id === calcId);
  //   if (pos >= 0) {
  //     state.calculations.splice(pos, 1);
  //     // state.nodules.splice(pos2, 1);
  //   }
  // },
  recordStyleState(
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
    //  console.log("record style selected", selected);
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule.ref) {
        state.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Front)
        );
        state.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Front)
        );
      }
    });
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule.ref !== undefined) {
        state.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Back)
        );
        state.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Back)
        );
      }
    });
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule instanceof SELabel && seNodule.ref !== undefined) {
        state.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Basic)
        );
        state.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Basic)
        );
      } else {
        const label = ((seNodule as unknown) as Labelable).label;
        if (label !== undefined) {
          state.initialStyleStates.push(
            label.ref.currentStyleState(StyleEditPanels.Basic)
          );
          state.defaultStyleStates.push(
            label.ref.defaultStyleState(StyleEditPanels.Basic)
          );
        } else {
          throw "Attempted to use the label of an unlabelable SENodule in recordStyleState in mutations.ts";
        }
      }
    });
    state.initialBackStyleContrast = backContrast;
  },
  setCanvasWidth(state: AppState, canvasWidth: number): void {
    state.canvasWidth = canvasWidth;
  }
};

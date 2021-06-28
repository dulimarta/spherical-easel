import { Module, VuexModule, Mutation } from "vuex-module-decorators";
import { AppState, Labelable, SEIntersectionReturnType } from "@/types";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";

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
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import {
  intersectLineWithLine,
  intersectLineWithSegment,
  intersectLineWithCircle,
  intersectSegmentWithSegment,
  intersectSegmentWithCircle,
  intersectCircles,
  intersectLineWithEllipse,
  intersectSegmentWithEllipse,
  intersectCircleWithEllipse,
  intersectEllipseWithEllipse
} from "@/utils/intersections";
const tmpMatrix = new Matrix4();
//const tmpVector = new Vector3();

const rotationVisitor = new RotationVisitor();
const pointMoverVisitor = new PointMoverVisitor();
const labelMoverVisitor = new LabelMoverVisitor();
const lineNormalVisitor = new LineNormalVisitor();
const segmentNormalArcLengthVisitor = new SegmentNormalArcLengthVisitor();

/* IMPORTANT: the "name" property below must match exactly the property name
used in modules declaration of Vuex.Store:

{
  state: {  }.
  mutations: {  },
  modules: {
    se: _____
  }
}
*/

//#region SEModuleHeader
@Module({ name: "se", namespaced: true })
export default class SE extends VuexModule implements AppState {
  //#endregion SEModuleHeader

  //#region appState

  sphereRadius = 0; // Is this needed? TODO = remove?
  actionMode = "rotate"; // The action mode of the Sphere Canvas
  previousActionMode = "rotate"; // The previous action mode
  activeToolName = ""; // The active tool for handling user mouse input
  previousActiveToolName = ""; // The active tool for handling user mouse input
  zoomMagnificationFactor = 1; // The CSSTransform magnification factor
  previousZoomMagnificationFactor = 1; // The previous CSSTransform magnification factor
  zoomTranslation = [0, 0]; // The CSSTransform translation vector
  canvasWidth = 0; //A temporary canvas width;
  seNodules: SENodule[] = []; // An array of all SENodules
  selectedSENodules: SENodule[] = []; // An array of selected SENodules
  oldStyleSelections: SENodule[] = []; // An array of previous selected SENodules
  layers: Two.Group[] = []; // An array of Two.Group pointer to the layers in the twoInstance
  sePoints: SEPoint[] = []; // An array of all SEPoints
  seLines: SELine[] = []; // An array of all SELines
  seSegments: SESegment[] = []; // An array of all SESegments
  seCircles: SECircle[] = []; // An array of all SECircles
  seEllipses: SEEllipse[] = []; // An array of all SEEllipse
  seAngleMarkers: SEAngleMarker[] = []; // An array of all SEAngleMarkers
  seLabels: SELabel[] = []; // An array of all SELabels
  temporaryNodules: Nodule[] = []; // An array of all Nodules that are temporary - created by the handlers.
  intersections: SEIntersectionPoint[] = [];
  // measurements = [],
  expressions: SEExpression[] = [];
  initialStyleStates: StyleOptions[] = [];
  defaultStyleStates: StyleOptions[] = [];
  styleSavedFromPanel = StyleEditPanels.Label;
  initialBackStyleContrast = SETTINGS.style.backStyleContrast;
  inverseTotalRotationMatrix = new Matrix4(); //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
  svgCanvas: HTMLDivElement | null = null;
  hasUnsavedNodules = false;
  temporaryProfilePicture = "";

  //#endregion appState

  @Mutation
  init(): void {
    this.actionMode = "";
    this.activeToolName = "";
    // Do not clear the layers array!
    // Replace clear() with splice(0). Since clear() is an extension function
    // Update to these arrays are not automatically picked up by VueJS
    this.seNodules.splice(0);
    this.sePoints.splice(0);
    this.seLines.splice(0);
    this.seSegments.splice(0);
    this.seCircles.splice(0);
    this.seAngleMarkers.splice(0);
    this.seEllipses.splice(0);
    this.seLabels.splice(0);
    this.selectedSENodules.splice(0);
    this.intersections.splice(0);
    this.expressions.splice(0);
    this.initialStyleStates.splice(0);
    this.defaultStyleStates.splice(0);
    this.hasUnsavedNodules = false;
    //this.temporaryNodules.clear(); // Do not clear the temporaryNodules array
    // because the constructors of the tools (handlers) place the temporary Nodules
    // in this array *before* the this.init is called in App.vue mount.
  }

  @Mutation
  setCanvas(c: HTMLDivElement | null): void {
    this.svgCanvas = c;
  }

  @Mutation
  setLayers(layers: Two.Group[]): void {
    this.layers = layers;
  }

  @Mutation
  setSphereRadius(radius: number): void {
    this.sphereRadius = radius;
  }

  @Mutation
  setActionMode(mode: { id: string; name: string }): void {
    // zoomFit is a one-off tool, so the previousActionMode should never be "zoomFit" (avoid infinite loops too!)
    if (!(this.actionMode == "zoomFit" || this.actionMode === "iconFactory")) {
      this.previousActionMode = this.actionMode;
      this.previousActiveToolName = this.activeToolName;
    }
    this.actionMode = mode.id;
    this.activeToolName = mode.name;
  }

  @Mutation
  revertActionMode(): void {
    this.actionMode = this.previousActionMode;
    this.activeToolName = this.previousActiveToolName;
  }

  @Mutation
  setZoomMagnificationFactor(mag: number): void {
    this.previousZoomMagnificationFactor = this.zoomMagnificationFactor;
    this.zoomMagnificationFactor = mag;
  }

  @Mutation
  setZoomTranslation(vec: number[]): void {
    for (let i = 0; i < 2; i++) {
      this.zoomTranslation[i] = vec[i];
    }
  }

  //#region addPoint
  @Mutation
  addPoint(point: SEPoint): void {
    this.sePoints.push(point);
    this.seNodules.push(point);
    point.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }
  //#endregion addPoint

  @Mutation
  removeAllFromLayers(): void {
    this.seAngleMarkers.forEach((x: SEAngleMarker) => x.ref.removeFromLayers());
    this.seCircles.forEach((x: SECircle) => x.ref.removeFromLayers());
    this.seEllipses.forEach((x: SEEllipse) => x.ref.removeFromLayers());
    this.seLabels.forEach((x: SELabel) => x.ref.removeFromLayers(this.layers));
    this.seLines.forEach((x: SELine) => x.ref.removeFromLayers());
    this.sePoints.forEach((x: SEPoint) => x.ref.removeFromLayers());
    this.seSegments.forEach((x: SESegment) => x.ref.removeFromLayers());
  }

  @Mutation
  removePoint(pointId: number): void {
    const pos = this.sePoints.findIndex((x: SEPoint) => x.id === pointId);
    const pos2 = this.seNodules.findIndex((x: SENodule) => x.id === pointId);
    if (pos >= 0) {
      const victimPoint = this.sePoints[pos];
      this.sePoints.splice(pos, 1);
      this.seNodules.splice(pos2, 1);
      // Remove the associated plottable (Nodule) object from being rendered
      victimPoint.ref.removeFromLayers();
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addLabel(label: SELabel): void {
    this.seLabels.push(label);
    this.seNodules.push(label);
    label.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeLabel(labelId: number): void {
    const pos = this.seLabels.findIndex((x: SELabel) => x.id === labelId);
    const pos2 = this.seNodules.findIndex((x: SENodule) => x.id === labelId);
    if (pos >= 0) {
      const victimLabel = this.seLabels[pos];
      this.seLabels.splice(pos, 1);
      this.seNodules.splice(pos2, 1);
      // Remove the associated plottable (Nodule) object from being rendered
      victimLabel.ref.removeFromLayers(this.layers);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addLine(line: SELine): void {
    this.seLines.push(line);
    this.seNodules.push(line as SENodule);
    line.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeLine(lineId: number): void {
    const pos = this.seLines.findIndex(x => x.id === lineId);
    const pos2 = this.seNodules.findIndex(x => x.id === lineId);
    if (pos >= 0) {
      /* victim line is found */
      const victimLine = this.seLines[pos];
      victimLine.ref.removeFromLayers();
      this.seLines.splice(pos, 1); // Remove the line from the list
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addSegment(segment: SESegment): void {
    this.seSegments.push(segment);
    this.seNodules.push(segment);
    segment.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeSegment(segId: number): void {
    const pos = this.seSegments.findIndex(x => x.id === segId);
    const pos2 = this.seNodules.findIndex(x => x.id === segId);
    if (pos >= 0) {
      const victimSegment = this.seSegments[pos];
      victimSegment.ref.removeFromLayers();
      this.seSegments.splice(pos, 1);
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addCircle(circle: SECircle): void {
    this.seCircles.push(circle);
    this.seNodules.push(circle);
    circle.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeCircle(circleId: number): void {
    const circlePos = this.seCircles.findIndex(x => x.id === circleId);
    const pos2 = this.seNodules.findIndex(x => x.id === circleId);
    if (circlePos >= 0) {
      /* victim line is found */
      const victimCircle: SECircle = this.seCircles[circlePos];
      victimCircle.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      this.seCircles.splice(circlePos, 1); // Remove the circle from the list
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addEllipse(ellipse: SEEllipse): void {
    this.seEllipses.push(ellipse);
    this.seNodules.push(ellipse);
    ellipse.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeEllipse(ellipseId: number): void {
    const ellipsePos = this.seEllipses.findIndex(x => x.id === ellipseId);
    const pos2 = this.seNodules.findIndex(x => x.id === ellipseId);
    if (ellipsePos >= 0) {
      /* victim line is found */
      const victimEllipse: SEEllipse = this.seEllipses[ellipsePos];
      victimEllipse.ref.removeFromLayers();
      // victimEllipse.removeSelfSafely();
      this.seEllipses.splice(ellipsePos, 1); // Remove the ellipse from the list
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }
  @Mutation
  addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
    this.expressions.push(angleMarker);
    this.seAngleMarkers.push(angleMarker);
    this.seNodules.push(angleMarker);
    angleMarker.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeAngleMarkerAndExpression(angleMarkerId: number): void {
    const angleMarkerPos = this.seAngleMarkers.findIndex(
      x => x.id === angleMarkerId
    );
    const pos2 = this.seNodules.findIndex(x => x.id === angleMarkerId);
    const pos3 = this.expressions.findIndex(x => x.id === angleMarkerId);
    if (angleMarkerPos >= 0) {
      /* victim angleMarker is found */
      const victimAngleMarker: SEAngleMarker = this.seAngleMarkers[
        angleMarkerPos
      ];
      victimAngleMarker.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      this.seAngleMarkers.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
      this.seNodules.splice(pos2, 1);
      this.expressions.splice(pos3, 1);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addExpression(measurement: SEExpression): void {
    this.expressions.push(measurement);
    this.seNodules.push(measurement);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeExpression(measId: number): void {
    const pos = this.expressions.findIndex(x => x.id === measId);
    const pos2 = this.seNodules.findIndex(x => x.id === measId);
    if (pos >= 0) {
      // const victimSegment = this.measurements[pos];
      this.expressions.splice(pos, 1);
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }

  // These are added to the store so that I can update the size of the temporary objects when there is a resize event.
  @Mutation
  addTemporaryNodule(nodule: Nodule): void {
    this.temporaryNodules.push(nodule);
  }

  // The temporary nodules are added to the store when a handler is constructed, when are they removed? Do I need a removeTemporaryNodule?
  //#region rotateSphere
  @Mutation
  rotateSphere(rotationMat: Matrix4): void {
    // Update the inverseTotalRotationMatrix. We have a new rotationMat which is transforming by
    //   rotationMat*oldTotalRotationMatrix * VEC
    // so to undo that action we find the inverse which is
    //  inverseTotalRotationMatrix*(inverse of rotationMat)
    tmpMatrix.copy(rotationMat);
    this.inverseTotalRotationMatrix.multiply(tmpMatrix.getInverse(tmpMatrix));
    rotationVisitor.setTransform(rotationMat);
    // apply the rotation to the line, segments, labels, then points. (Circles and ellipses are determined by their parent points so no need to update them)
    this.seLines.forEach((m: SELine) => {
      m.accept(rotationVisitor); // Does no updating of the display
    });
    this.seSegments.forEach((s: SESegment) => {
      s.accept(rotationVisitor); // Does no updating of the display
    });
    this.seLabels.forEach((l: SELabel) => {
      l.accept(rotationVisitor); // Does no updating of the display
    });
    this.sePoints.forEach((p: SEPoint) => {
      p.accept(rotationVisitor); // Does no updating of the display
    });
    // now do the update of the free points so that display is correct
    this.sePoints.forEach((p: SEPoint) => {
      if (p.isFreeToMove()) {
        p.markKidsOutOfDate(); // so this does a topological sort and update is only executed once on each point
        p.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    });
  }
  //#endregion rotateSphere

  @Mutation
  movePoint(move: { pointId: number; location: Vector3 }): void {
    pointMoverVisitor.setNewLocation(move.location);
    const pos = this.sePoints.findIndex(x => x.id === move.pointId);
    this.sePoints[pos].accept(pointMoverVisitor);
  }

  @Mutation
  moveLabel(move: { labelId: number; location: Vector3 }): void {
    labelMoverVisitor.setNewLocation(move.location);
    const pos = this.seLabels.findIndex(x => x.id === move.labelId);
    this.seLabels[pos].accept(labelMoverVisitor);
  }

  @Mutation
  changeLineNormalVector(change: { lineId: number; normal: Vector3 }): void {
    lineNormalVisitor.setNewNormal(change.normal);
    const pos = this.seLines.findIndex(x => x.id === change.lineId);
    if (pos >= 0) this.seLines[pos].accept(lineNormalVisitor);
  }

  @Mutation
  changeSegmentNormalVectorArcLength(change: {
    segmentId: number;
    normal: Vector3;
    arcLength: number;
  }): void {
    segmentNormalArcLengthVisitor.setNewNormal(change.normal);
    segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
    const pos = this.seSegments.findIndex(x => x.id === change.segmentId);
    if (pos >= 0) this.seSegments[pos].accept(segmentNormalArcLengthVisitor);
  }

  @Mutation
  setSelectedSENodules(payload: SENodule[]): void {
    //reset the glowing color to usual
    this.selectedSENodules.forEach(n => {
      n.ref?.setSelectedColoring(false);
    });
    this.selectedSENodules.splice(0);
    this.selectedSENodules.push(...payload);
    //set the glowing color to selected
    this.selectedSENodules.forEach(n => {
      n.ref?.setSelectedColoring(true);
    });
  }

  // Update the display of all free SEPoints to update the entire display
  @Mutation
  updateDisplay(): void {
    this.seNodules
      .filter(obj => obj.isFreePoint())
      .forEach(obj => {
        // First mark the kids out of date so that the update method does a topological sort
        obj.markKidsOutOfDate();
        obj.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      });
  }

  @Mutation
  unglowAllSENodules(): void {
    this.seNodules.forEach((p: SENodule) => {
      if (!p.selected) {
        p.glowing = false;
      }
    });
  }

  // This is the previous set of nodes that was selected
  // If created from the LabelPanel they are all SSELabels (So we can't justs copy selections before updating it)
  @Mutation
  setOldStyleSelection(payload: SENodule[]): void {
    this.oldStyleSelections.splice(0);
    this.oldStyleSelections.push(...payload);
  }

  @Mutation
  setSavedFromPanel(panel: StyleEditPanels): void {
    this.styleSavedFromPanel = panel;
  }

  @Mutation
  changeStyle({
    selected, // The selected SENodules that this change applies to, passing this as a argument allows styling to be undone.
    payload
  }: {
    selected: SENodule[];
    payload: StyleOptions;
  }): void {
    const opt: StyleOptions = {
      panel: payload.panel,
      strokeWidthPercent: payload.strokeWidthPercent,
      strokeColor: payload.strokeColor,
      fillColor: payload.fillColor,
      dashArray: payload.dashArray,
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
      // labelVisibility: payload.labelVisibility,
      labelFrontFillColor: payload.labelFrontFillColor,
      labelBackFillColor: payload.labelBackFillColor,
      // objectVisibility: payload.objectVisibility,
      angleMarkerRadiusPercent: payload.angleMarkerRadiusPercent,
      angleMarkerTickMark: payload.angleMarkerTickMark,
      angleMarkerDoubleArc: payload.angleMarkerDoubleArc
    };
    if (
      payload.backStyleContrast &&
      payload.backStyleContrast != Nodule.getBackStyleContrast()
    ) {
      // Update all Nodules because more than just the selected nodules depend on the backStyleContrast
      Nodule.setBackStyleContrast(payload.backStyleContrast);
      this.seNodules.forEach((n: SENodule) => {
        n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      });
    }
    selected.forEach((n: SENodule) => {
      n.ref?.updateStyle(opt);
      if (opt.pointRadiusPercent !== undefined) {
        // if the point radius Percent changes then this can effects the label location so run update
        n.update({ mode: UpdateMode.DisplayOnly, stateArray: [] });
      }
    });
  }

  // addCalculation(calc: SECalculation): void {
  //   // TODO: should we also push it to this.nodules?
  //   // this.nodules.push(calc);
  //   this.calculations.push(calc);
  // },
  // removeCalculation(calcId: number): void {
  //   const pos = this.calculations.findIndex(c => c.id === calcId);
  //   // const pos2 = this.nodules.findIndex(x => x.id === calcId);
  //   if (pos >= 0) {
  //     this.calculations.splice(pos, 1);
  //     // this.nodules.splice(pos2, 1);
  //   }
  // },

  @Mutation
  recordStyleState({
    selected, // The selected SENodules that this change applies to, passing this as a argument allows styling to be undone.
    backContrast
  }: {
    selected: SENodule[];
    backContrast: number;
  }): void {
    this.initialStyleStates.splice(0);
    this.defaultStyleStates.splice(0);
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule.ref) {
        this.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Front)
        );
        this.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Front)
        );
      }
    });
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule.ref !== undefined) {
        this.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Back)
        );
        this.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Back)
        );
      }
    });
    selected.forEach(seNodule => {
      // The first third is the front style settings, the second third is the back, the final third are the corresponding labels
      if (seNodule instanceof SELabel && seNodule.ref !== undefined) {
        this.initialStyleStates.push(
          seNodule.ref.currentStyleState(StyleEditPanels.Label)
        );
        this.defaultStyleStates.push(
          seNodule.ref.defaultStyleState(StyleEditPanels.Label)
        );
      } else {
        const label = ((seNodule as unknown) as Labelable).label;
        if (label !== undefined) {
          this.initialStyleStates.push(
            label.ref.currentStyleState(StyleEditPanels.Label)
          );
          this.defaultStyleStates.push(
            label.ref.defaultStyleState(StyleEditPanels.Label)
          );
        } else {
          throw "Attempted to use the label of an unlabelable SENodule in recordStyleState in mutations.ts";
        }
      }
    });
    this.initialBackStyleContrast = backContrast;
  }

  @Mutation
  setCanvasWidth(canvasWidth: number): void {
    this.canvasWidth = canvasWidth;
  }

  @Mutation
  setInverseRotationMatrix(m: Matrix4): void {
    this.inverseTotalRotationMatrix.copy(m);
  }
  @Mutation
  clearUnsavedFlag(): void {
    this.hasUnsavedNodules = false;
  }

  @Mutation
  setTemporaryProfilePicture(imageHexString: string): void {
    this.temporaryProfilePicture = imageHexString;
  }

  //#region findNearbyGetter
  get findNearbySENodules(): (_p: Vector3, _s: Two.Vector) => SENodule[] {
    return (
      unitIdealVector: Vector3,
      screenPosition: Two.Vector
    ): SENodule[] => {
      return this.seNodules.filter(obj =>
        obj.isHitAt(unitIdealVector, this.zoomMagnificationFactor)
      );
    };
  }
  //#endregion findNearbyGetter

  /**
   * Create the intersection of two one-dimensional objects
   * Make sure the SENodules are in the correct order: SELines, SESegments, SECircles then SEEllipses.
   * That the (one,two) pair is one of:
   *  (SELine,SELine), (SELine,SESegment), (SELine,SECircle), (SELine,SEEllipse), (SESegment, SESegment),
   *      (SESegment, SECircle), (SESegment, SEEllipse),(SECircle, SECircle), (SECircle, SEEllipse)
   *      (SEEllipse, SEEllipse)
   * If they have the same type put them in alphabetical order.
   * The creation of the intersection objects automatically follows this convention in assigning parents.
   */

  get createAllIntersectionsWithLine(): FnSELineToSEIntersection {
    return (newLine: SELine): SEIntersectionReturnType[] => {
      // Avoid creating an intersection where any SEPoint already exists
      const avoidVectors: Vector3[] = [];
      // First add the two parent points of the newLine, if they are new, then
      //  they won't have been added to the state.points array yet so add them first
      avoidVectors.push(newLine.startSEPoint.locationVector);
      // Onle perpendiculare to line through point, the SEEndPoint is auto generated SEPoint (never added to the state)
      // and the user cannot interact with it. So it is *not* a vector to avoid for intersections.
      if (!(newLine instanceof SEPerpendicularLineThruPoint)) {
        avoidVectors.push(newLine.endSEPoint.locationVector);
      }
      this.sePoints.forEach(pt => avoidVectors.push(pt.locationVector));

      // The intersectionPointList to return
      const intersectionPointList: SEIntersectionReturnType[] = [];

      // Intersect this new line with all old lines
      this.seLines
        .filter((line: SELine) => line.id !== newLine.id) // ignore self
        .forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithLine(oldLine, newLine);
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                this.tempVec.subVectors(info.vector, v).isZero()
              )
            ) {
              // info.vector is not on the avoidVectors array, so create an intersection
              const newPt = new NonFreePoint();
              newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
              newPt.adjustSize();
              const newSEIntersectionPt = new SEIntersectionPoint(
                newPt,
                oldLine,
                newLine,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: oldLine,
                parent2: newLine
              });
            }
          });
        });
      //Intersect this new line with all old segments
      this.seSegments.forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectLineWithSegment(newLine, oldSegment);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newLine,
              oldSegment,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newLine,
              parent2: oldSegment
            });
          }
        });
      });
      //Intersect this new line with all old circles
      this.seCircles.forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectLineWithCircle(newLine, oldCircle);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newLine,
              oldCircle,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newLine,
              parent2: oldCircle
            });
          }
        });
      });
      //Intersect this new line with all old ellipses
      this.seEllipses.forEach((oldEllipse: SEEllipse) => {
        const intersectionInfo = intersectLineWithEllipse(newLine, oldEllipse);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newLine,
              oldEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newLine,
              parent2: oldEllipse
            });
          }
        });
      });
      return intersectionPointList;
    };
  }

  get createAllIntersectionsWithSegment(): (
    _s: SESegment
  ) => SEIntersectionReturnType[] {
    return (newSegment: SESegment): SEIntersectionReturnType[] => {
      // Avoid creating an intersection where any SEPoint already exists
      const avoidVectors: Vector3[] = [];
      // First add the two parent points of the newLine, if they are new, then
      //  they won't have been added to the state.points array yet so add them first
      avoidVectors.push(newSegment.startSEPoint.locationVector);
      avoidVectors.push(newSegment.endSEPoint.locationVector);
      this.sePoints.forEach(pt => avoidVectors.push(pt.locationVector));

      // The intersectionPointList to return
      const intersectionPointList: SEIntersectionReturnType[] = [];
      // Intersect this new segment with all old lines
      this.seLines.forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithSegment(oldLine, newSegment);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldLine,
              newSegment,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;

            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldLine,
              parent2: newSegment
            });
          }
        });
      });
      //Intersect this new segment with all old segments
      this.seSegments
        .filter((segment: SESegment) => segment.id !== newSegment.id) // ignore self
        .forEach((oldSegment: SESegment) => {
          const intersectionInfo = intersectSegmentWithSegment(
            oldSegment,
            newSegment
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                this.tempVec.subVectors(info.vector, v).isZero()
              )
            ) {
              const newPt = new NonFreePoint();
              newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
              newPt.adjustSize();
              const newSEIntersectionPt = new SEIntersectionPoint(
                newPt,
                oldSegment,
                newSegment,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: oldSegment,
                parent2: newSegment
              });
            }
          });
        });
      //Intersect this new segment with all old circles
      this.seCircles.forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectSegmentWithCircle(
          newSegment,
          oldCircle
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newSegment,
              oldCircle,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newSegment,
              parent2: oldCircle
            });
          }
        });
      });
      //Intersect this new segment with all old ellipses
      this.seEllipses.forEach((oldEllipse: SEEllipse) => {
        const intersectionInfo = intersectSegmentWithEllipse(
          newSegment,
          oldEllipse
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newSegment,
              oldEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newSegment,
              parent2: oldEllipse
            });
          }
        });
      });

      return intersectionPointList;
    };
  }

  get createAllIntersectionsWithCircle(): (
    _: SECircle
  ) => SEIntersectionReturnType[] {
    return (newCircle: SECircle): SEIntersectionReturnType[] => {
      // Avoid creating an intersection where any SEPoint already exists
      const avoidVectors: Vector3[] = [];
      // First add the two parent points of the newLine, if they are new, then
      //  they won't have been added to the state.points array yet so add them first
      avoidVectors.push(newCircle.centerSEPoint.locationVector);
      avoidVectors.push(newCircle.circleSEPoint.locationVector);
      this.sePoints.forEach(pt => avoidVectors.push(pt.locationVector));
      // The intersectionPointList to return
      const intersectionPointList: SEIntersectionReturnType[] = [];
      // Intersect this new circle with all old lines
      this.seLines.forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithCircle(oldLine, newCircle);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldLine,
              newCircle,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldLine,
              parent2: newCircle
            });
          }
        });
      });
      //Intersect this new circle with all old segments
      this.seSegments.forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectSegmentWithCircle(
          oldSegment,
          newCircle
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldSegment,
              newCircle,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldSegment,
              parent2: newCircle
            });
          }
        });
      });
      //Intersect this new circle with all old circles
      this.seCircles
        .filter((circle: SECircle) => circle.id !== newCircle.id) // ignore self
        .forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectCircles(
            oldCircle.centerSEPoint.locationVector,
            oldCircle.circleRadius,
            newCircle.centerSEPoint.locationVector,
            newCircle.circleRadius
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                this.tempVec.subVectors(info.vector, v).isZero()
              )
            ) {
              // info.vector is not on the avoidVectors array, so create an intersection
              const newPt = new NonFreePoint();
              newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
              newPt.adjustSize();
              const newSEIntersectionPt = new SEIntersectionPoint(
                newPt,
                oldCircle,
                newCircle,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: oldCircle,
                parent2: newCircle
              });
            }
          });
        });

      //Intersect this new circle with all old ellipses
      this.seEllipses.forEach((oldEllipse: SEEllipse) => {
        const intersectionInfo = intersectCircleWithEllipse(
          newCircle,
          oldEllipse
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              newCircle,
              oldEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newCircle,
              parent2: oldEllipse
            });
          }
        });
      });
      return intersectionPointList;
    };
  }

  get createAllIntersectionsWithEllipse(): (
    _: SEEllipse
  ) => SEIntersectionReturnType[] {
    return (newEllipse: SEEllipse): SEIntersectionReturnType[] => {
      // Avoid creating an intersection where any SEPoint already exists
      const avoidVectors: Vector3[] = [];
      // First add the three parent points of the newEllipse, if they are new, then
      //  they won't have been added to the state.points array yet so add them first
      avoidVectors.push(newEllipse.focus1SEPoint.locationVector);
      avoidVectors.push(newEllipse.focus2SEPoint.locationVector);
      avoidVectors.push(newEllipse.ellipseSEPoint.locationVector);
      this.sePoints.forEach(pt => avoidVectors.push(pt.locationVector));
      // The intersectionPointList to return
      const intersectionPointList: SEIntersectionReturnType[] = [];

      // Intersect this new ellipse with all old lines
      this.seLines.forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithEllipse(oldLine, newEllipse);
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldLine,
              newEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldLine,
              parent2: newEllipse
            });
          }
        });
      });

      //Intersect this new ellipse with all old segments
      this.seSegments.forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectSegmentWithEllipse(
          oldSegment,
          newEllipse
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldSegment,
              newEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldSegment,
              parent2: newEllipse
            });
          }
        });
      });

      //Intersect this new ellipse with all old circles
      this.seCircles.forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectCircleWithEllipse(
          oldCircle,
          newEllipse
        );
        intersectionInfo.forEach((info, index) => {
          if (
            !avoidVectors.some(v =>
              this.tempVec.subVectors(info.vector, v).isZero()
            )
          ) {
            // info.vector is not on the avoidVectors array, so create an intersection
            const newPt = new NonFreePoint();
            newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
            newPt.adjustSize();
            const newSEIntersectionPt = new SEIntersectionPoint(
              newPt,
              oldCircle,
              newEllipse,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldCircle,
              parent2: newEllipse
            });
          }
        });
      });

      //Intersect this new ellipse with all old ellipses
      this.seEllipses
        .filter((ellipe: SEEllipse) => ellipe.id !== newEllipse.id) // ignore self
        .forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectEllipseWithEllipse(
            oldEllipse,
            newEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                this.tempVec.subVectors(info.vector, v).isZero()
              )
            ) {
              // info.vector is not on the avoidVectors array, so create an intersection
              const newPt = new NonFreePoint();
              newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
              newPt.adjustSize();
              const newSEIntersectionPt = new SEIntersectionPoint(
                newPt,
                newEllipse,
                oldEllipse,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: newEllipse,
                parent2: oldEllipse
              });
            }
          });
        });

      return intersectionPointList;
    };
  }

  get findIntersectionPointsByParent(): (_: string) => SEIntersectionPoint[] {
    return (parentName: string): SEIntersectionPoint[] => {
      return this.sePoints
        .filter(
          p => p instanceof SEIntersectionPoint && p.name.includes(parentName)
        )
        .map(obj => obj as SEIntersectionPoint);
    };
  }

  get getDefaultStyleState(): (panel: StyleEditPanels) => StyleOptions[] {
    return (panel: StyleEditPanels): StyleOptions[] => {
      switch (panel) {
        case StyleEditPanels.Front: {
          return this.defaultStyleStates.slice(
            0,
            this.defaultStyleStates.length / 3
          );
        }

        case StyleEditPanels.Back: {
          return this.defaultStyleStates.slice(
            this.defaultStyleStates.length / 3,
            (2 * this.defaultStyleStates.length) / 3
          );
        }
        default:
        case StyleEditPanels.Label: {
          return this.defaultStyleStates.slice(
            (2 * this.defaultStyleStates.length) / 3,
            this.defaultStyleStates.length
          );
        }
      }
    };
  }
  get getInitialStyleState(): (panel: StyleEditPanels) => StyleOptions[] {
    return (panel: StyleEditPanels): StyleOptions[] => {
      switch (panel) {
        case StyleEditPanels.Front: {
          return this.initialStyleStates.slice(
            0,
            this.initialStyleStates.length / 3
          );
        }
        case StyleEditPanels.Back: {
          return this.initialStyleStates.slice(
            this.initialStyleStates.length / 3,
            (2 * this.initialStyleStates.length) / 3
          );
        }
        default:
        case StyleEditPanels.Label: {
          return this.initialStyleStates.slice(
            (2 * this.initialStyleStates.length) / 3,
            this.initialStyleStates.length
          );
        }
      }
    };
  }

  get getSENoduleById(): (_: number) => SENodule | undefined {
    return (id: number): SENodule | undefined => {
      return this.seNodules.find((z: SENodule) => z.id === id);
    };
  }
  private tempVec = new Vector3();

  //Given a test point, does there exist an *exact* antipode of it?

  get hasNoAntipode(): (_: SEPoint) => boolean {
    return (testPoint: SEPoint): boolean => {
      // create the antipode location vector
      this.tempVec.copy(testPoint.locationVector).multiplyScalar(-1);
      // search for the antipode location vector
      const ind = this.sePoints.findIndex(p => {
        return this.tempVec.equals(p.locationVector);
      });
      if (ind < 0) {
        // If -1*testPoint.location doesn't appear on the sePoints array then there is *no* antipode to testPoint (so return true)
        return true;
      } else {
        //now realize that the intersection of two lines/segments creates two SEPoints (which are an antipodal pair A and B) and
        // puts them on the sePoints array, but some of them may or may not be user created.
        // if the user try to create the antipode of one of the intersections A, then -1*A appears on the list as B
        // (1) if B is user created, then we should *not* create the antipode at -1*A so return false (not no antipode = antipode exists)
        // (2) if B is not user created, then we we should still create the antipode at -1*A, so return true (these is no antipode)

        // In the case that (2) happens it is possible that there are two points in the array sePoint with *exactly* the
        // same location vector at -1*A, if that happens then the antipode is already created and we should return false (not no antipode = antipode exists)
        const ind2 = this.sePoints.findIndex((p, index) => {
          if (index <= ind) {
            // ignore the entries in sePoint upto index ind, because they have already been searched
            return false;
          } else {
            return this.tempVec.equals(p.locationVector);
          }
        });
        // the -1*testPoint.location appears twice!
        if (ind2 >= 0) {
          return false;
        }

        if (this.sePoints[ind] instanceof SEIntersectionPoint) {
          if (!(this.sePoints[ind] as SEIntersectionPoint).isUserCreated) {
            return true; // Case (2)
          } else {
            return false; // Case (1)
          }
        } else {
          return false;
        }
      }
    };
  }
}
type FnSELineToSEIntersection = (l: SELine) => SEIntersectionReturnType[];

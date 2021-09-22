import { Module, VuexModule, Mutation } from "vuex-module-decorators";
import { AppState, SEIntersectionReturnType, ActionMode } from "@/types";
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
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import { SEExpression } from "@/models/SEExpression";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import NonFreePoint from "@/plottables/NonFreePoint";
import {
  intersectLineWithLine,
  intersectLineWithSegment,
  intersectLineWithCircle,
  intersectLineWithEllipse,
  intersectLineWithParametric,
  intersectSegmentWithSegment,
  intersectSegmentWithCircle,
  intersectSegmentWithEllipse,
  //intersectSegmentWithParametric,
  intersectCircles,
  intersectCircleWithEllipse,
  //intersectCircleWithParametric,
  intersectEllipseWithEllipse,
  intersectSegmentWithParametric,
  intersectCircleWithParametric,
  intersectEllipseWithParametric,
  intersectParametricWithParametric
  //intersectEllipseWithParametric,
  //intersectParametrics
} from "@/utils/intersections";
import EventBus from "@/eventHandlers/EventBus";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEParametric } from "@/models/SEParametric";
import Parametric from "@/plottables/Parametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SENSectLine } from "@/models/SENSectLine";
import { SEPencil } from "@/models/SEPencil";
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
  actionMode: ActionMode = "rotate"; // The action mode of the Sphere Canvas
  previousActionMode: ActionMode = "rotate"; // The previous action mode
  activeToolName = ""; // The active tool for handling user mouse input
  previousActiveToolName = ""; // The active tool for handling user mouse input
  zoomMagnificationFactor = 1; // The CSSTransform magnification factor
  // previousZoomMagnificationFactor = 1; // The previous CSSTransform magnification factor
  zoomTranslation = [0, 0]; // The CSSTransform translation vector
  canvasWidth = 0; //A temporary canvas width;
  seNodules: SENodule[] = []; // An array of all SENodules
  selectedSENodules: SENodule[] = []; // An array of selected SENodules
  oldSelections: SENodule[] = []; // An array of previous selected SENodules
  layers: Two.Group[] = []; // An array of Two.Group pointer to the layers in the twoInstance
  sePoints: SEPoint[] = []; // An array of all SEPoints
  seLines: SELine[] = []; // An array of all SELines
  seSegments: SESegment[] = []; // An array of all SESegments
  seCircles: SECircle[] = []; // An array of all SECircles
  seEllipses: SEEllipse[] = []; // An array of all SEEllipse
  seParametrics: SEParametric[] = []; // An array of all SEParametric
  seAngleMarkers: SEAngleMarker[] = []; // An array of all SEAngleMarkers
  sePolygons: SEPolygon[] = []; // An array of all SEAngleMarkers
  seLabels: SELabel[] = []; // An array of all SELabels
  temporaryNodules: Nodule[] = []; // An array of all Nodules that are temporary - created by the handlers.
  intersections: SEIntersectionPoint[] = [];
  // measurements = [],
  expressions: SEExpression[] = [];
  sePencils: SEPencil[] = [];
  // TODO: replace the following arrays with the Map below
  initialStyleStates: StyleOptions[] = [];
  defaultStyleStates: StyleOptions[] = [];
  initialStyleStatesMap: Map<StyleEditPanels, StyleOptions[]> = new Map();
  defaultStyleStatesMap: Map<StyleEditPanels, StyleOptions[]> = new Map();
  styleSavedFromPanel = StyleEditPanels.Label;
  // initialBackStyleContrast = SETTINGS.style.backStyleContrast;
  inverseTotalRotationMatrix = new Matrix4(); //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
  svgCanvas: HTMLDivElement | null = null;
  hasUnsavedNodules = false;
  temporaryProfilePicture = "";

  //#endregion appState

  @Mutation
  init(): void {
    this.actionMode = "rotate";
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
    this.sePolygons.splice(0);
    this.seEllipses.splice(0);
    this.seParametrics.splice(0);
    this.sePencils.splice(0);
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
  setActionMode(mode: { id: ActionMode; name: string }): void {
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
    // console.log("setZoomMagFactor");
    EventBus.fire("magnification-updated", {
      factor: this.zoomMagnificationFactor / mag
    });
    // this.previousZoomMagnificationFactor = ;
    this.zoomMagnificationFactor = mag;
  }

  @Mutation
  setZoomTranslation(vec: number[]): void {
    for (let i = 0; i < 2; i++) {
      this.zoomTranslation[i] = vec[i];
    }
  }

  @Mutation
  removeAllFromLayers(): void {
    this.seAngleMarkers.forEach((x: SEAngleMarker) => x.ref.removeFromLayers());
    this.seCircles.forEach((x: SECircle) => x.ref.removeFromLayers());
    this.seEllipses.forEach((x: SEEllipse) => x.ref.removeFromLayers());
    this.seLabels.forEach((x: SELabel) => x.ref.removeFromLayers(this.layers));
    this.seLines.forEach((x: SELine) => x.ref.removeFromLayers());
    this.sePoints.forEach((x: SEPoint) => x.ref.removeFromLayers());
    this.seSegments.forEach((x: SESegment) => x.ref.removeFromLayers());
    this.seParametrics.forEach((x: SEParametric) => {
      let ptr: Parametric | null = x.ref;
      while (ptr !== null) {
        ptr.removeFromLayers();
        ptr = ptr.next;
      }
    });
    this.sePencils.forEach((p: SEPencil) => {
      p.lines.forEach((l: SEPerpendicularLineThruPoint) => {
        l.ref.removeFromLayers();
      });
    });
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
  addParametric(parametric: SEParametric): void {
    this.seParametrics.push(parametric);
    this.seNodules.push(parametric);
    let ptr: Parametric | null = parametric.ref;
    while (ptr) {
      ptr.addToLayers(this.layers);
      ptr = ptr.next;
    }
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removeParametric(parametricId: number): void {
    const parametricPos = this.seParametrics.findIndex(
      x => x.id === parametricId
    );
    const pos2 = this.seNodules.findIndex(x => x.id === parametricId);
    if (parametricPos >= 0) {
      /* victim line is found */
      const victimParametric: SEParametric = this.seParametrics[parametricPos];
      let ptr: Parametric | null = victimParametric.ref;
      while (ptr !== null) {
        ptr.removeFromLayers();
        ptr = ptr.next;
      }
      // victimParametric.removeSelfSafely();
      this.seParametrics.splice(parametricPos, 1); // Remove the parametric from the list
      this.seNodules.splice(pos2, 1);
      this.hasUnsavedNodules = true;
    }
  }

  // @Mutation
  // addPencil(pencil: SEPencil): void {
  //   this.sePencils.push(pencil);
  //   this.seNodules.push(pencil);
  //   pencil.lines.forEach((ln: SEPerpendicularLineThruPoint) => {
  //     this.seLines.push(ln);
  //     this.seNodules.push(ln);
  //     ln.ref.addToLayers(this.layers);
  //   });
  //   this.hasUnsavedNodules = true;
  // }

  // @Mutation
  // removePencil(pencilId: number): void {
  //   const pos = this.sePencils.findIndex((p: SEPencil) => p.id === pencilId);
  //   const pos2 = this.seNodules.findIndex((p: SENodule) => p.id === pencilId);
  //   if (pos >= 0) {
  //     this.sePencils.splice(pos, 1);
  //     this.seNodules.splice(pos2, 1);
  //     this.sePencils[pos].lines.forEach((ln: SEPerpendicularLineThruPoint) => {
  //       // this.removeLine(ln.id);
  //       ln.ref.removeFromLayers();
  //     });
  //     this.hasUnsavedNodules = true;
  //   }
  // }

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
      // when removing expressions that have effects on the labels, we must set those label display arrays to empty
      if (victimAngleMarker.label) {
        victimAngleMarker.label.ref.value = [];
      }
      victimAngleMarker.ref.removeFromLayers();
      // victimCircle.removeSelfSafely();
      this.seAngleMarkers.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
      this.seNodules.splice(pos2, 1);
      this.expressions.splice(pos3, 1);
      this.hasUnsavedNodules = true;
    }
  }

  @Mutation
  addPolygonAndExpression(polygon: SEPolygon): void {
    this.expressions.push(polygon);
    this.sePolygons.push(polygon);
    this.seNodules.push(polygon);
    polygon.ref.addToLayers(this.layers);
    this.hasUnsavedNodules = true;
  }

  @Mutation
  removePolygonAndExpression(polygonId: number): void {
    const polygonPos = this.sePolygons.findIndex(x => x.id === polygonId);
    const pos2 = this.seNodules.findIndex(x => x.id === polygonId);
    const pos3 = this.expressions.findIndex(x => x.id === polygonId);
    if (polygonPos >= 0) {
      /* victim polygon is found */
      const victimPolygon: SEPolygon = this.sePolygons[polygonPos];
      // when removing expressions that have effects on the labels, we must set those label display arrays to empty
      if (victimPolygon.label) {
        victimPolygon.label.ref.value = [];
      }
      victimPolygon.ref.removeFromLayers();
      this.sePolygons.splice(polygonPos, 1); // Remove the polygon from the list
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
    this.seParametrics.forEach((para: SEParametric) => {
      para.accept(rotationVisitor); //update the display because the parametric do not depend on any other geometric objects
    });
    // now do the update of the free points so that display is correct
    this.sePoints.forEach((p: SEPoint) => {
      if (p.isFreeToMove()) {
        p.markKidsOutOfDate(); // so this does a topological sort and update is only executed once on each point
        p.update();
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
    // console.log("update display");
    this.seNodules
      .filter(obj => obj.isFreeToMove())
      .forEach(obj => {
        // First mark the kids out of date so that the update method does a topological sort
        obj.markKidsOutOfDate();
        obj.update();
        // console.log("name", obj.name, "show", obj.showing, "exist", obj.exists);
      });
  }

  @Mutation
  unglowAllSENodules(): void {
    this.seNodules.forEach((p: SENodule) => {
      if (!p.selected && p.exists) {
        p.glowing = false;
      }
    });
  }

  // This is the previous set of nodes that was selected
  // If created from the LabelPanel they are all SSELabels (So we can't justs copy selections before updating it)
  @Mutation
  setOldSelection(payload: SENodule[]): void {
    this.oldSelections.splice(0);
    this.oldSelections.push(...payload);
  }

  @Mutation
  setSavedFromPanel(panel: StyleEditPanels): void {
    this.styleSavedFromPanel = panel;
  }

  @Mutation
  changeStyle({
    selected, // The selected SENodules that this change applies to, passing this as a argument allows styling to be undone.
    panel,
    payload
  }: {
    selected: Nodule[];
    panel: StyleEditPanels;
    payload: StyleOptions;
  }): void {
    // Important: object destructuring below seems to solve the issue
    // of merging undefined properties in updateStyle()
    const opt: StyleOptions = { ...payload };
    // if (
    //   payload.backStyleContrast &&
    //   payload.backStyleContrast != Nodule.getBackStyleContrast()
    // ) {
    //   // Update all Nodules because more than just the selected nodules depend on the backStyleContrast
    //   Nodule.setBackStyleContrast(payload.backStyleContrast);
    //   console.debug("Changing Global backstyle contrast");
    //   this.seNodules.forEach((n: SENodule) => {
    //     n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    //   });
    // }
    selected.forEach((n: Nodule) => {
      // console.log("node", n, opt);
      n.updateStyle(panel, opt);
    });
  }

  @Mutation
  changeBackContrast(newContrast: number): void {
    Nodule.setBackStyleContrast(newContrast);
    // update all objects display
    this.seNodules.forEach(seNodule => {
      // update the style of the objects
      // console.log("name", seNodule.name);
      seNodule.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
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
  recordStyleState(data: {
    panel: StyleEditPanels;
    selected: Array<Nodule>;
  }): void {
    console.debug("About to record style", data.selected.length, "objects");
    const current = data.selected.map((n: Nodule) =>
      n.currentStyleState(data.panel)
    );
    console.debug(
      "SEStore recording style of selected objects in",
      StyleEditPanels[data.panel],
      "with",
      current
    );
    this.initialStyleStatesMap.set(data.panel, current);
    this.defaultStyleStatesMap.set(
      data.panel,
      data.selected.map((n: Nodule) => n.defaultStyleState(data.panel))
    );
    // this.initialBackStyleContrast = data.backContrast;
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
      return this.seNodules.filter((obj: SENodule) => {
        return obj.isHitAt(unitIdealVector, this.zoomMagnificationFactor);
      });
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
      //  they won't have been added to the state.points array yet so add them first, but only if this is not an SEPolar line whose defining points are never added to the state

      if (!(newLine instanceof SEPolarLine)) {
        avoidVectors.push(newLine.startSEPoint.locationVector);
      }
      // Only perpendicular to line through point, the SEEndPoint is auto generated SEPoint (never added to the state)
      // and the user cannot interact with it. So it is *not* a vector to avoid for intersections.
      if (
        !(
          newLine instanceof SEPerpendicularLineThruPoint ||
          newLine instanceof SEPolarLine ||
          newLine instanceof SETangentLineThruPoint ||
          newLine instanceof SENSectLine
        )
      ) {
        avoidVectors.push(newLine.endSEPoint.locationVector);
      }
      this.sePoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });

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
      //Intersect this new line with all old parametrics
      this.seParametrics.forEach((oldParametric: SEParametric) => {
        const intersectionInfo = intersectLineWithParametric(
          newLine,
          oldParametric
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
              newLine,
              oldParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newLine,
              parent2: oldParametric
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
      this.sePoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });

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
      //Intersect this new segment with all old parametrics
      this.seParametrics.forEach((oldParametric: SEParametric) => {
        const intersectionInfo = intersectSegmentWithParametric(
          newSegment,
          oldParametric
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
              oldParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newSegment,
              parent2: oldParametric
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
      this.sePoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });
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

      //Intersect this new circle with all old parametrics
      this.seParametrics.forEach((oldParametric: SEParametric) => {
        const intersectionInfo = intersectCircleWithParametric(
          newCircle,
          oldParametric
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
              oldParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newCircle,
              parent2: oldParametric
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
      this.sePoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });
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
                oldEllipse,
                newEllipse,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: oldEllipse,
                parent2: newEllipse
              });
            }
          });
        });

      //Intersect this new ellipse with all old parametrics
      this.seParametrics.forEach((oldParametric: SEParametric) => {
        const intersectionInfo = intersectEllipseWithParametric(
          newEllipse,
          oldParametric
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
              oldParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: newEllipse,
              parent2: oldParametric
            });
          }
        });
      });

      return intersectionPointList;
    };
  }

  get createAllIntersectionsWithParametric(): (
    _: SEParametric
  ) => SEIntersectionReturnType[] {
    return (newParametric: SEParametric): SEIntersectionReturnType[] => {
      // Avoid creating an intersection where any SEPoint already exists
      const avoidVectors: Vector3[] = [];
      // First add the end points of the newParametric, if they are exist, then
      //  they won't have been added to the state.points array yet so add them first
      // Always screen for the zero vector
      newParametric.endPoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });
      this.sePoints.forEach(pt => {
        if (!pt.locationVector.isZero()) {
          avoidVectors.push(pt.locationVector);
        }
      });

      // The intersectionPointList to return
      const intersectionPointList: SEIntersectionReturnType[] = [];

      // Intersect this new parametric with all old lines
      this.seLines.forEach((oldLine: SELine) => {
        const intersectionInfo = intersectLineWithParametric(
          oldLine,
          newParametric
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
              oldLine,
              newParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldLine,
              parent2: newParametric
            });
          }
        });
      });

      // Intersect this new parametric with all old segments
      this.seSegments.forEach((oldSegment: SESegment) => {
        const intersectionInfo = intersectSegmentWithParametric(
          oldSegment,
          newParametric
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
              newParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldSegment,
              parent2: newParametric
            });
          }
        });
      });

      // Intersect this new parametric with all old circles
      this.seCircles.forEach((oldCircle: SECircle) => {
        const intersectionInfo = intersectCircleWithParametric(
          oldCircle,
          newParametric
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
              newParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldCircle,
              parent2: newParametric
            });
          }
        });
      });

      //Intersect this new parametric with all old ellipses
      this.seEllipses.forEach((oldEllipse: SEEllipse) => {
        const intersectionInfo = intersectEllipseWithParametric(
          oldEllipse,
          newParametric
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
              oldEllipse,
              newParametric,
              index,
              false
            );
            newSEIntersectionPt.locationVector = info.vector;
            newSEIntersectionPt.exists = info.exists;
            intersectionPointList.push({
              SEIntersectionPoint: newSEIntersectionPt,
              parent1: oldEllipse,
              parent2: newParametric
            });
          }
        });
      });

      //Intersect this new parametric with all old parametrics
      this.seParametrics
        .filter(
          (parametric: SEParametric) => parametric.id !== newParametric.id
        ) // ignore self
        .forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectParametricWithParametric(
            oldParametric,
            newParametric
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
                oldParametric,
                newParametric,
                index,
                false
              );
              newSEIntersectionPt.locationVector = info.vector;
              newSEIntersectionPt.exists = info.exists;
              intersectionPointList.push({
                SEIntersectionPoint: newSEIntersectionPt,
                parent1: oldParametric,
                parent2: newParametric
              });
            }
          });
        });

      return intersectionPointList;
    };
  }

  /**
   * If one parent name is given, this returns a list of all intersection points that have a parent with that name.
   * If two parent names are given, this returns a list of all intersection points that a parent with the first name and a parent with the second name
   */
  get findIntersectionPointsByParent(): (
    parent1Name: string,
    parent2Name?: string
  ) => SEIntersectionPoint[] {
    return (
      parent1Name: string,
      parent2Name?: string
    ): SEIntersectionPoint[] => {
      const intersectionPoints = this.sePoints
        .filter(
          p =>
            p instanceof SEIntersectionPoint &&
            p.parents.some(seNodule => seNodule.name === parent1Name)
        )
        .map(obj => obj as SEIntersectionPoint);

      if (parent2Name) {
        return intersectionPoints.filter(p =>
          p.parents.some(seNodule => seNodule.name === parent2Name)
        );
      } else {
        return intersectionPoints;
      }
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

import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import { ActionMode, SEIntersectionReturnType } from "@/types";
import { Matrix4, Vector3 } from "three";
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SELabel } from "@/models/SELabel";
import { SEExpression } from "@/models/SEExpression";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEEllipse } from "@/models/SEEllipse";
import { SECircle } from "@/models/SECircle";
import EventBus from "@/eventHandlers/EventBus";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
import { SEParametric } from "@/models/SEParametric";
import Parametric from "@/plottables/Parametric";
import { SESegment } from "@/models/SESegment";
import { SEPolygon } from "@/models/SEPolygon";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import {
  intersectCircles,
  intersectCircleWithEllipse,
  intersectCircleWithParametric,
  intersectEllipseWithEllipse,
  intersectEllipseWithParametric,
  intersectLineWithCircle,
  intersectLineWithEllipse,
  intersectLineWithLine,
  intersectLineWithParametric,
  intersectLineWithSegment,
  intersectParametricWithParametric,
  intersectSegmentWithCircle,
  intersectSegmentWithEllipse,
  intersectSegmentWithParametric,
  intersectSegmentWithSegment
} from "@/utils/intersections";
import NonFreePoint from "@/plottables/NonFreePoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SENSectLine } from "@/models/SENSectLine";
import { SEPencil } from "@/models/SEPencil";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { Group } from "two.js/src/group";
import { Vector } from "two.js/src/vector";
import { SETransformation } from "@/models/SETransformation";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { LabelMoverVisitor } from "@/visitors/LabelMoverVisitor";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";

const oldSelections: Array<SENodule> = [];
const sePencils: Array<SEPencil> = [];
const layers: Array<Group> = [];
const inverseTotalRotationMatrix = new Matrix4();
const tmpMatrix = new Matrix4();
const tmpVector = new Vector3();
const tmpVector1 = new Vector3();
const temporaryNodules: Array<Nodule> = [];
const initialStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();
const defaultStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();

type PiniaAppState = {
  actionMode: ActionMode;
  previousActionMode: ActionMode;
  activeToolName: string;
  previousActiveToolName: string;
  zoomMagnificationFactor: number;
  zoomTranslation: number[];
  hasUnsavedNodules: boolean;
  svgCanvas: HTMLDivElement | null;
  canvasWidth: number;
  inverseTotalRotationMatrix: Matrix4; // Initially the identity. This is the composition of all the inverses of the rotation matrices applied to the sphere.
  styleSavedFromPanel: StyleEditPanels;
  seNodules: SENodule[];
  sePoints: SEPoint[];
  seLines: SELine[];
  seSegments: SESegment[];
  seCircles: SECircle[];
  seEllipses: SEEllipse[];
  seLabels: SELabel[];
  seAngleMarkers: SEAngleMarker[];
  sePolygons: SEPolygon[];
  seParametrics: SEParametric[];
  expressions: SEExpression[];
  seTransformations: SETransformation[];
  selectedSENodules: SENodule[];
};

export const useSEStore = defineStore({
  id: "se",
  state: (): PiniaAppState => ({
    actionMode: "rotate",
    previousActionMode: "rotate",
    activeToolName: "rotate",
    previousActiveToolName: "",
    svgCanvas: null,
    hasUnsavedNodules: false,
    zoomMagnificationFactor: 1, // the initial zoom factor
    zoomTranslation: [0, 0],
    canvasWidth: 0,
    seNodules: [],
    sePoints: [],
    seLines: [],
    seSegments: [],
    seCircles: [],
    seEllipses: [],
    seLabels: [],
    seAngleMarkers: [],
    sePolygons: [],
    seParametrics: [],
    expressions: [],
    seTransformations: [],
    // oldSelections: SELine[],
    styleSavedFromPanel: StyleEditPanels.Label,
    inverseTotalRotationMatrix: new Matrix4(), //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
    selectedSENodules: []
  }),
  actions: {
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
      this.seLabels.splice(0);
      this.seTransformations.splice(0);
      this.expressions.splice(0);
      temporaryNodules.splice(0);
      sePencils.splice(0);
      this.selectedSENodules.splice(0);
      // intersections.splice(0);
      // initialStyleStates.splice(0);
      // defaultStyleStates.splice(0);
      this.hasUnsavedNodules = false;

      // Note by Hans (2022-01-05): this.init() has been moved from App.vue to SphereFrame.vue

      // Do not clear the temporaryNodules array
      // because the constructors of the tools (handlers) place the temporary Nodules
      // in this array *before* the this.init is called in App.vue mount.
    },
    setLayers(grp: Array<Group>): void {
      layers.splice(0);
      layers.push(...grp);
    },
    setCanvas(c: HTMLDivElement | null): void {
      this.svgCanvas = c;
    },
    setCanvasWidth(w: number): void {
      this.canvasWidth = w;
    },
    // setSphereRadius(r: number): void {
    //   // TODO
    // },
    setActionMode(mode: { id: ActionMode; name: string }): void {
      // zoomFit is a one-off tool, so the previousActionMode should never be "zoomFit" (avoid infinite loops too!)
      if (
        !(this.actionMode == "zoomFit" || this.actionMode === "iconFactory")
      ) {
        this.previousActionMode = this.actionMode;
        this.previousActiveToolName = this.activeToolName;
      }
      this.actionMode = mode.id;
      this.activeToolName = mode.name;
    },
    revertActionMode(): void {
      this.actionMode = this.previousActionMode;
      this.activeToolName = this.previousActiveToolName;
    },
    removeAllFromLayers(): void {
      this.seAngleMarkers.forEach(x => x.ref.removeFromLayers());
      this.seCircles.forEach(x => x.ref.removeFromLayers());
      this.seEllipses.forEach(x => x.ref.removeFromLayers());
      this.seLabels.forEach(x => x.ref.removeFromLayers(layers));
      this.seLines.forEach(x => x.ref.removeFromLayers());
      this.sePoints.forEach(x => x.ref.removeFromLayers());
      this.seSegments.forEach(x => x.ref.removeFromLayers());
      this.sePolygons.forEach(x => x.ref.removeFromLayers());
      this.seParametrics
        .map(p => p as SEParametric)
        .forEach((x: SEParametric) => {
          let ptr: Parametric | null = x.ref;
          while (ptr !== null) {
            ptr.removeFromLayers();
            ptr = ptr.next;
          }
        });
      sePencils.forEach((p: SEPencil) => {
        p.lines.forEach((l: SEPerpendicularLineThruPoint) => {
          l.ref.removeFromLayers();
        });
      });
    },
    // Update the display of all free SEPoints to update the entire display
    updateDisplay(): void {
      this.seNodules
        .filter(obj => obj.isFreeToMove())
        .forEach(obj => {
          // First mark the kids out of date so that the update method does a topological sort
          obj.markKidsOutOfDate();
          obj.update();
          // console.log("name", obj.name, "show", obj.showing, "exist", obj.exists);
        });
    },
    setZoomMagnificationFactor(mag: number): void {
      //console.debug(`setZoomMagFactor ${mag}`);
      EventBus.fire("magnification-updated", {
        factor: this.zoomMagnificationFactor / mag
      });
      // this.previousZoomMagnificationFactor = ;
      this.zoomMagnificationFactor = mag;
    },
    setZoomTranslation(vec: number[]): void {
      for (let i = 0; i < 2; i++) {
        this.zoomTranslation[i] = vec[i];
      }
    },
    //#region addPoint
    addPoint(point: SEPoint): void {
      this.sePoints.push(point);
      this.seNodules.push(point);
      point.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    //#endregion addPoint
    removePoint(pointId: number): void {
      const pos = this.sePoints
        .map(x => x as SEPoint)
        .findIndex((x: SEPoint) => x.id === pointId);
      const pos2 = this.seNodules.findIndex(x => x.id === pointId);
      if (pos >= 0) {
        const victimPoint = this.sePoints[pos];
        this.sePoints.splice(pos, 1);
        this.seNodules.splice(pos2, 1);
        // Remove the associated plottable (Nodule) object from being rendered
        victimPoint.ref.removeFromLayers();
        this.hasUnsavedNodules = true;
      }
    },
    movePoint(move: { pointId: number; location: Vector3 }): void {
      const pointMoverVisitor = new PointMoverVisitor();
      pointMoverVisitor.setNewLocation(move.location);
      const pos = this.sePoints.findIndex(x => x.id === move.pointId);
      if (pos > -1) {
        this.sePoints[pos].accept(pointMoverVisitor);
        //sePoints[pos].markKidsOutOfDate();
        //sePoints[pos].update();
      }
    },
    addLine(line: SELine): void {
      this.seLines.push(line);
      this.seNodules.push(line as SENodule);
      line.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    addCircle(circle: SECircle): void {
      this.seCircles.push(circle);
      this.seNodules.push(circle);
      circle.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeCircle(circleId: number): void {
      const circlePos = this.seCircles.findIndex(x => x.id === circleId);
      const pos2 = this.seNodules.findIndex(x => x.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimCircle = this.seCircles[circlePos];
        victimCircle.ref.removeFromLayers();
        // victimCircle.removeSelfSafely();
        this.seCircles.splice(circlePos, 1); // Remove the circle from the list
        this.seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
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
    },
    addSegment(segment: SESegment): void {
      this.seSegments.push(segment);
      this.seNodules.push(segment);
      segment.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
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
    },
    addEllipse(ellipse: SEEllipse): void {
      this.seEllipses.push(ellipse);
      this.seNodules.push(ellipse);
      ellipse.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeEllipse(ellipseId: number): void {
      const ellipsePos = this.seEllipses.findIndex(x => x.id === ellipseId);
      const pos2 = this.seNodules.findIndex(x => x.id === ellipseId);
      if (ellipsePos >= 0) {
        /* victim line is found */
        const victimEllipse = this.seEllipses[ellipsePos];
        victimEllipse.ref.removeFromLayers();
        // victimEllipse.removeSelfSafely();
        this.seEllipses.splice(ellipsePos, 1); // Remove the ellipse from the list
        this.seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addLabel(label: SELabel): void {
      this.seLabels.push(label);
      this.seNodules.push(label);
      label.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeLabel(labelId: number): void {
      const pos = this.seLabels.findIndex(x => x.id === labelId);
      const pos2 = this.seNodules.findIndex(x => x.id === labelId);
      if (pos >= 0) {
        const victimLabel = this.seLabels[pos];
        this.seLabels.splice(pos, 1);
        this.seNodules.splice(pos2, 1);
        // Remove the associated plottable (Nodule) object from being rendered
        victimLabel.ref.removeFromLayers(layers);
        this.hasUnsavedNodules = true;
      }
    },
    moveLabel(move: { labelId: number; location: Vector3 }): void {
      const labelMoverVisitor = new LabelMoverVisitor();
      labelMoverVisitor.setNewLocation(move.location);
      const pos = this.seLabels.findIndex(x => x.id === move.labelId);
      if (pos > -1) this.seLabels[pos].accept(labelMoverVisitor);
    },
    addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
      this.expressions.push(angleMarker);
      this.seAngleMarkers.push(angleMarker);
      this.seNodules.push(angleMarker);
      angleMarker.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeAngleMarkerAndExpression(angleMarkerId: number): void {
      const angleMarkerPos = this.seAngleMarkers.findIndex(
        x => x.id === angleMarkerId
      );
      const pos2 = this.seNodules.findIndex(x => x.id === angleMarkerId);
      const pos3 = this.expressions.findIndex(x => x.id === angleMarkerId);
      if (angleMarkerPos >= 0) {
        /* victim angleMarker is found */
        const victimAngleMarker = this.seAngleMarkers[angleMarkerPos];
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
    },
    addParametric(parametric: SEParametric): void {
      this.seParametrics.push(parametric);
      this.seNodules.push(parametric);
      let ptr: Parametric | null = parametric.ref;
      while (ptr) {
        ptr.addToLayers(layers);
        ptr = ptr.next;
      }
      this.hasUnsavedNodules = true;
    },
    removeParametric(parametricId: number): void {
      const parametricPos = this.seParametrics.findIndex(
        x => x.id === parametricId
      );
      const pos2 = this.seNodules.findIndex(x => x.id === parametricId);
      if (parametricPos >= 0) {
        /* victim line is found */
        const victimParametric = this.seParametrics[parametricPos];
        let ptr: Parametric | null = victimParametric.ref as Parametric;
        while (ptr !== null) {
          ptr.removeFromLayers();
          ptr = ptr.next as Parametric;
        }
        // victimParametric.removeSelfSafely();
        this.seParametrics.splice(parametricPos, 1); // Remove the parametric from the list
        this.seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addPolygonAndExpression(polygon: SEPolygon): void {
      this.expressions.push(polygon);
      this.sePolygons.push(polygon);
      this.seNodules.push(polygon);
      polygon.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removePolygonAndExpression(polygonId: number): void {
      const polygonPos = this.sePolygons.findIndex(x => x.id === polygonId);
      const pos2 = this.seNodules.findIndex(x => x.id === polygonId);
      const pos3 = this.expressions.findIndex(x => x.id === polygonId);
      if (polygonPos >= 0) {
        /* victim polygon is found */
        const victimPolygon = this.sePolygons[polygonPos];
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
    },
    addExpression(measurement: SEExpression): void {
      this.expressions.push(measurement);
      this.seNodules.push(measurement);
      this.hasUnsavedNodules = true;
    },
    removeExpression(measId: number): void {
      const pos = this.expressions.findIndex(x => x.id === measId);
      const pos2 = this.seNodules.findIndex(x => x.id === measId);
      if (pos >= 0) {
        // const victimSegment = this.measurements[pos];
        this.expressions.splice(pos, 1);
        this.seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addTransformation(transformation: SETransformation): void {
      this.seTransformations.push(transformation);
      this.seNodules.push(transformation);
      // transformation.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeTransformation(transformationId: number): void {
      const pos = this.seTransformations.findIndex(
        x => x.id === transformationId
      );
      const pos2 = this.seNodules.findIndex(x => x.id === transformationId);
      if (pos >= 0) {
        // const victimTransformation = seTransformations[pos];
        this.seTransformations.splice(pos, 1);
        this.seNodules.splice(pos2, 1);
        // Remove the associated plottable (Nodule) object from being rendered
        //victimTransformation.ref.removeFromLayers(layers);
        this.hasUnsavedNodules = true;
      }
    },
    //#region rotateSphere
    rotateSphere(rotationMat: Matrix4): void {
      // Update the inverseTotalRotationMatrix. We have a new rotationMat which is transforming by
      //   rotationMat*oldTotalRotationMatrix * VEC
      // so to undo that action we find the inverse which is
      //  inverseTotalRotationMatrix*(inverse of rotationMat)
      tmpMatrix.copy(rotationMat).invert();
      inverseTotalRotationMatrix.multiply(tmpMatrix);
      const rotationVisitor = new RotationVisitor();
      rotationVisitor.setTransform(rotationMat);
      const updateCandidates: Array<SENodule> = [];

      function addCandidatesFrom(parent: SENodule) {
        parent.kids.forEach((m: SENodule) => {
          if (m.exists) {
            // console.debug(parent.name, "invalidates", m.name);
            if (m.canUpdateNow()) {
              if (!updateCandidates.find((x: SENodule) => x.name === m.name))
                updateCandidates.push(m);
            } else {
              // console.debug("!!! Dependent ", m.name, " can't be updated now");
            }
          }
        });
      }

      // Begin updating those objects with no parents
      this.seNodules
        .map(n => n as SENodule)
        .filter((p: SENodule) => p.parents.length === 0)
        .forEach((target: SENodule) => {
          // console.debug("Seed update from ", target.name);
          target.accept(rotationVisitor);
          target.setOutOfDate(false);
          target.markKidsOutOfDate();
          addCandidatesFrom(target); // Expand the update tree
        });
      while (updateCandidates.length > 0) {
        const target = updateCandidates.shift();
        if (target) {
          if (!target.accept(rotationVisitor)) {
            // console.debug(
            //   target.name,
            //   "does not accept rotation visitor, try its shallowUpdate"
            // );
            target.shallowUpdate();
          }
          target.setOutOfDate(false);
          target.markKidsOutOfDate();

          addCandidatesFrom(target);
        }

        // console.debug(
        //   `Update candidate has ${updateCandidates.length} items`,
        //   updateCandidates.map((n: SENodule) => n.name).join(", ")
        // );
      }
      // console.debug("<<<<< End rotate sphere update");
    },
    //#endregion rotateSphere
    clearUnsavedFlag(): void {
      this.hasUnsavedNodules = false;
    },
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
      //   this.this.seNodules.forEach((n: SENodule) => {
      //     n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      //   });
      // }
      selected.forEach((n: Nodule) => {
        // console.log("node", n, opt);
        n.updateStyle(panel, opt);
      });
    },
    changeBackContrast(newContrast: number): void {
      Nodule.setBackStyleContrast(newContrast);
      // update all objects display
      this.seNodules.forEach(seNodule => {
        // update the style of the objects
        // console.log("name", seNodule.name);
        seNodule.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
      });
    },

    changeSegmentNormalVectorArcLength(change: {
      segmentId: number;
      normal: Vector3;
      arcLength: number;
    }): void {
      const segmentNormalArcLengthVisitor = new SegmentNormalArcLengthVisitor();
      segmentNormalArcLengthVisitor.setNewNormal(change.normal);
      segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
      const pos = this.seSegments.findIndex(x => x.id === change.segmentId);
      if (pos >= 0) {
        this.seSegments[pos].accept(segmentNormalArcLengthVisitor);
        // this.seSegments[pos].markKidsOutOfDate();
        // this.seSegments[pos].update();
      }
    },
    changeLineNormalVector(change: { lineId: number; normal: Vector3 }): void {
      const lineNormalVisitor = new LineNormalVisitor();
      lineNormalVisitor.setNewNormal(change.normal);
      const pos = this.seLines.findIndex(x => x.id === change.lineId);
      if (pos >= 0) {
        this.seLines[pos].accept(lineNormalVisitor);
        // seLines[pos].markKidsOutOfDate();
        // seLines[pos].update();
      }
    },
    // These are added to the store so that I can update the size of the temporary objects when there is a resize event.
    addTemporaryNodule(nodule: Nodule): void {
      nodule.stylize(DisplayStyle.ApplyTemporaryVariables);
      nodule.adjustSize(); //since the tools are created on demand, the size of the canvas and zoom factor will be different so update the size of the temporary plottable
      temporaryNodules.push(nodule);
    },
    setSelectedSENodules(payload: SENodule[]): void {
      function diffArray(prev: SENodule[], curr: SENodule[]): boolean {
        if (prev.length != curr.length) return true;
        const prevIds = prev
          .map((n: SENodule) => n.id)
          .sort((a: number, b: number) => a - b);
        const currIds = curr
          .map((n: SENodule) => n.id)
          .sort((a: number, b: number) => a - b);
        for (let k = 0; k < prevIds.length; k++) {
          if (prevIds[k] !== currIds[k]) return true;
        }
        return false;
      }
      if (
        diffArray(
          this.selectedSENodules.map(x => x as SENodule),
          payload
        )
      ) {
        console.debug("Selected nodules differ");
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
    },
    setOldSelection(payload: SENodule[]): void {
      oldSelections.splice(0);
      oldSelections.push(...payload);
    },
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
      initialStyleStatesMap.set(data.panel, current);
      defaultStyleStatesMap.set(
        data.panel,
        data.selected.map((n: Nodule) => n.defaultStyleState(data.panel))
      );
      // this.initialBackStyleContrast = data.backContrast;
    },

    // The temporary nodules are added to the store when a handler is constructed, when are they removed? Do I need a removeTemporaryNodule?
    unglowAllSENodules(): void {
      this.seNodules.forEach(p => {
        if (!p.selected && p.exists) {
          p.glowing = false;
        }
      });
    }
  },
  getters: {
    //getZoomMagnificationFactor: (): number => zoomMagnificationFactor,
    // zoomTranslation: (): number[] => zoomTranslation,
    // selectedSENodules: (): Array<SENodule> => selectedSENodules,
    temporaryNodules: (): Array<Nodule> => temporaryNodules,
    oldStyleSelections: (): Array<SENodule> => oldSelections,
    layers: (): Group[] => layers,
    initialStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      initialStyleStatesMap,
    defaultStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      defaultStyleStatesMap,
    // hasObjects(): boolean {
    //   return sePoints.length > 0;
    // },
    hasObjects: (state): (() => boolean) => {
      return (): boolean => {
        return state.sePoints.length > 0;
      };
    },
    hasNoAntipode: (state): ((_: SEPoint) => null | SEPoint) => {
      return (testPoint: SEPoint): null | SEPoint => {
        // create the antipode location vector
        tmpVector.copy(testPoint.locationVector).multiplyScalar(-1);
        // search for the antipode location vector among the existing points
        const ind = state.sePoints
          .map(x => x as SEPoint)
          .findIndex(p => {
            return tmpVector1.subVectors(tmpVector, p.locationVector).isZero();
          });
        if (ind < 0) {
          // If -1*testPoint.location doesn't appear on the sePoints array then there is *no* antipode to testPoint (so return null)
          return null;
        } else {
          return state.sePoints.map(x => x as SEPoint)[ind]; // return the point at the antipode
          //now realize that the intersection of two lines/segments creates two SEPoints (which are an antipodal pair A and B) and
          // puts them on the sePoints array, but some of them may or may not be user created.
          // if the user try to create the antipode of one of the intersections A, then -1*A appears on the list as B
          // (1) if B is user created, then we should *not* create the antipode at -1*A so return  (not no antipode = antipode exists)
          // (2) if B is not user created, then we we should still create the antipode at -1*A, so return true (these is no antipode)

          //  const ind2 = sePoints.findIndex((p, index) => {
          //   if (index <= ind) {
          //     // ignore the entries in sePoint upto index ind, because they have already been searched
          //     return false;
          //   } else {
          //     return tmpVector.equals(p.locationVector);
          //   }
          // });
          // // the -1*testPoint.location appears twice!
          // if (ind2 >= 0) {
          //   return false;
          // }

          // if (sePoints[ind] instanceof SEIntersectionPoint) {
          //   if (!(sePoints[ind] as SEIntersectionPoint).isUserCreated) {
          //     return true; // Case (2)
          //   } else {
          //     return false; // Case (1)
          //   }
          // } else {
          //   return false;
          // }
        }
      };
    },
    // getZoomMagnificationFactor(): number {
    //   return this.zoomMagnificationFactor;
    // },
    getSENoduleById(state): (_: number) => SENodule | undefined {
      return (id: number): SENodule | undefined =>
        state.seNodules.map(z => z as SENodule).find(z => z.id === id);
    },
    //#region findNearbyGetter
    findNearbySENodules(state): (_p: Vector3, _s: Vector) => SENodule[] {
      return (unitIdealVector: Vector3, screenPosition: Vector): SENodule[] => {
        return state.seNodules
          .map(obj => obj as SENodule)
          .filter(obj => {
            return obj.isHitAt(unitIdealVector, state.zoomMagnificationFactor);
          });
      };
    },
    //#endregion findNearbyGetter
    /**
     * If one parent name is given, this returns a list of all intersection points that have a parent with that name.
     * If two parent names are given, this returns a list of all intersection points that a parent with the first name and a parent with the second name
     */
    findIntersectionPointsByParent(
      state
    ): (parent1Name: string, parent2Name?: string) => SEIntersectionPoint[] {
      return (
        parent1Name: string,
        parent2Name?: string
      ): SEIntersectionPoint[] => {
        const intersectionPoints = state.sePoints
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
    },

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

    createAllIntersectionsWithLine(
      state
    ): (_l: SELine, _p: SEPoint[]) => SEIntersectionReturnType[] {
      return (
        newLine: SELine,
        existingNewSEPoints?: SEPoint[]
      ): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const existingSEPoints: SEPoint[] = [];
        if (existingNewSEPoints) {
          existingSEPoints.push(...existingNewSEPoints);
        }
        // // First add the two parent points of the newLine, if they are new, then
        // //  they won't have been added to the state.points array yet so add them first, but only if this is not an SEPolar line whose defining points are never added to the state
        // if (!(newLine instanceof SEPolarLine)) {
        //   existingSEPoints.push(newLine.startSEPoint);
        // }
        // // Only perpendicular to line through point, the SEEndPoint is auto generated SEPoint (never added to the state)
        // // and the user cannot interact with it. So it is *not* a vector to avoid for intersections.
        // if (
        //   !(
        //     newLine instanceof SEPerpendicularLineThruPoint ||
        //     newLine instanceof SEPolarLine ||
        //     newLine instanceof SETangentLineThruPoint ||
        //     newLine instanceof SENSectLine
        //   )
        // ) {
        //   existingSEPoints.push(newLine.endSEPoint);
        // }
        state.sePoints
          .map(x => x as SEPoint)
          .forEach(pt => {
            if (
              !pt.locationVector.isZero() &&
              !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
            ) {
              existingSEPoints.push(pt);
            }
          });
        // The number of existing sePoint before we start adding to it with newly created intersection points
        const numberOfExistingSEPointsBefore = existingSEPoints.length;
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // Intersect this new line with all old lines
        state.seLines
          .map(x => x as SELine)
          .filter((line: SELine) => line.id !== newLine.id) // ignore self
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithLine(
              oldLine,
              newLine,
              true // this is the first time these two objects have been intersected
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //Never happens if a line and line don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldLine,
                  parent2: newLine,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newLine, // this is the new parent of the intersection point
                      parent2: newLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldLine, // this is the new parent of the intersection point
                      parent2: oldLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Intersect this new line with all old segments
        state.seSegments
          .map(x => x as SESegment)
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectLineWithSegment(
              newLine,
              oldSegment,
              true // this is the first time these two objects have been intersected
            );
            console.debug(
              `Intersecting ${newLine.name}, and seg ${oldSegment.name}`
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a line and segment don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newLine,
                  parent2: oldSegment,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newLine, // this is the new parent of the intersection point
                      parent2: newLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldSegment, // this is the new parent of the intersection point
                      parent2: oldSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new line with all old circles
        state.seCircles
          .map(x => x as SECircle)
          .forEach((oldCircle: SECircle) => {
            const intersectionInfo = intersectLineWithCircle(
              newLine,
              oldCircle
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a line and circle don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newLine,
                  parent2: oldCircle,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newLine, // this is the new parent of the intersection point
                      parent2: newLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldCircle, // this is the new parent of the intersection point
                      parent2: oldCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new line with all old ellipses
        state.seEllipses
          .map(e => e as SEEllipse)
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectLineWithEllipse(
              newLine,
              oldEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a line and ellipse don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newLine,
                  parent2: oldEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newLine, // this is the new parent of the intersection point
                      parent2: newLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldEllipse, // this is the new parent of the intersection point
                      parent2: oldEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new line with all old parametrics
        state.seParametrics
          .map(x => x as SEParametric)
          .forEach((oldParametric: SEParametric) => {
            const intersectionInfo = intersectLineWithParametric(
              newLine,
              oldParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a line and parametric don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newLine,
                  parent2: oldParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newLine, // this is the new parent of the intersection point
                      parent2: newLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldParametric, // this is the new parent of the intersection point
                      parent2: oldParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Before returning remove duplicate existingSEIntersection points (duplicate means same intersection point AND same parent)
        // also remove any existing SEIntersection points that are immediate parents of the new object being created
        const filteredIntersectionPointList: SEIntersectionReturnType[] = [];
        intersectionPointList.forEach(listItem => {
          if (listItem.existingIntersectionPoint) {
            if (
              !filteredIntersectionPointList.some(
                filteredListItem =>
                  listItem.SEIntersectionPoint.id ===
                    filteredListItem.SEIntersectionPoint.id &&
                  listItem.parent1.id === filteredListItem.parent1.id
              ) &&
              listItem.SEIntersectionPoint.id !== newLine.startSEPoint.id &&
              listItem.SEIntersectionPoint.id !== newLine.endSEPoint.id
            ) {
              filteredIntersectionPointList.push(listItem);
            }
          } else {
            // automatically add the newly created intersection points
            filteredIntersectionPointList.push(listItem);
          }
        });

        return filteredIntersectionPointList;
      };
    },

    createAllIntersectionsWithSegment(
      state
    ): (_s: SESegment, _p: SEPoint[]) => SEIntersectionReturnType[] {
      return (
        newSegment: SESegment,
        existingNewSEPoints?: SEPoint[]
      ): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const existingSEPoints: SEPoint[] = [];
        if (existingNewSEPoints) {
          existingSEPoints.push(...existingNewSEPoints);
        }
        // // First add the two parent points of the newLine, if they are new, then
        // //  they won't have been added to the state.points array yet so add them first
        // existingSEPoints.push(newSegment.startSEPoint);
        // existingSEPoints.push(newSegment.endSEPoint);
        state.sePoints
          .map(pt => pt as SEPoint)
          .forEach(pt => {
            if (
              !pt.locationVector.isZero() &&
              !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
            ) {
              existingSEPoints.push(pt);
            }
          });

        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];

        // The number of existing sePoint before we start adding to it with newly created intersection points
        const numberOfExistingSEPointsBefore = existingSEPoints.length;
        // Intersect this new segment with all old lines
        state.seLines
          .map(x => x as SELine)
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithSegment(
              oldLine,
              newSegment,
              true // this is the first time these two objects have been intersected
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a segment and line don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldLine,
                  parent2: newSegment,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newSegment, // this is the new parent of the intersection point
                      parent2: newSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldLine, // this is the new parent of the intersection point
                      parent2: oldLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new segment with all old segments
        state.seSegments
          .map(x => x as SESegment)
          .filter((segment: SESegment) => segment.id !== newSegment.id) // ignore self
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectSegmentWithSegment(
              oldSegment,
              newSegment,
              true // this is the first time these two objects have been intersected
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a segment and segment don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
                const newPt = new NonFreePoint();
                newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
                newPt.adjustSize();
                const newSEIntersectionPt = new SEIntersectionPoint(
                  newPt,
                  newSegment,
                  oldSegment,
                  index,
                  false
                );
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newSegment,
                  parent2: oldSegment,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newSegment, // this is the new parent of the intersection point
                      parent2: newSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldSegment, // this is the new parent of the intersection point
                      parent2: oldSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new segment with all old circles
        state.seCircles
          .map(x => x as SECircle)
          .forEach((oldCircle: SECircle) => {
            const intersectionInfo = intersectSegmentWithCircle(
              newSegment,
              oldCircle
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a segment and circle don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newSegment,
                  parent2: oldCircle,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newSegment, // this is the new parent of the intersection point
                      parent2: newSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldCircle, // this is the new parent of the intersection point
                      parent2: oldCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new segment with all old ellipses
        state.seEllipses
          .map(x => x as SEEllipse)
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectSegmentWithEllipse(
              newSegment,
              oldEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a segment and ellipse don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newSegment,
                  parent2: oldEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newSegment, // this is the new parent of the intersection point
                      parent2: newSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldEllipse, // this is the new parent of the intersection point
                      parent2: oldEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new segment with all old parametrics
        state.seParametrics
          .map(x => x as SEParametric)
          .forEach((oldParametric: SEParametric) => {
            const intersectionInfo = intersectSegmentWithParametric(
              newSegment,
              oldParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() //if a segment and parametric don't initially intersect the intersection is the zero vector,
                    //but if some other intersection like line circle doesn't initially intersection, this still needs to be avoided
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newSegment,
                  parent2: oldParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newSegment, // this is the new parent of the intersection point
                      parent2: newSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldParametric, // this is the new parent of the intersection point
                      parent2: oldParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Before returning remove duplicate existingSEIntersection points (duplicate means same SEIntersection point AND same parent)
        // also remove any existing SEIntersection points that are immediate parents of the new object being created
        const filteredIntersectionPointList: SEIntersectionReturnType[] = [];
        intersectionPointList.forEach(listItem => {
          if (listItem.existingIntersectionPoint) {
            if (
              !filteredIntersectionPointList.some(
                filteredListItem =>
                  listItem.SEIntersectionPoint.id ===
                    filteredListItem.SEIntersectionPoint.id &&
                  listItem.parent1.id === filteredListItem.parent1.id
              ) &&
              listItem.SEIntersectionPoint.id !== newSegment.startSEPoint.id &&
              listItem.SEIntersectionPoint.id !== newSegment.endSEPoint.id
            ) {
              filteredIntersectionPointList.push(listItem);
            }
          } else {
            // automatically add the newly created intersection points
            filteredIntersectionPointList.push(listItem);
          }
        });

        return filteredIntersectionPointList;
      };
    },
    createAllIntersectionsWithCircle(
      state
    ): (_c: SECircle, _p: SEPoint[]) => SEIntersectionReturnType[] {
      return (
        newCircle: SECircle,
        existingNewSEPoints?: SEPoint[]
      ): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const existingSEPoints: SEPoint[] = [];
        if (existingNewSEPoints) {
          existingSEPoints.push(...existingNewSEPoints);
        }
        // // First add the two parent points of the newLine, if they are new, then
        // //  they won't have been added to the state.points array yet so add them first
        // existingSEPoints.push(newCircle.centerSEPoint);
        // existingSEPoints.push(newCircle.circleSEPoint);
        state.sePoints
          .map(x => x as SEPoint)
          .forEach(pt => {
            if (
              !pt.locationVector.isZero() &&
              !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
            ) {
              existingSEPoints.push(pt);
            }
          });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // The number of existing sePoint before we start adding to it with newly created intersection points
        const numberOfExistingSEPointsBefore = existingSEPoints.length;
        // Intersect this new circle with all old lines
        state.seLines
          .map(x => x as SELine)
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithCircle(
              oldLine,
              newCircle
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a line and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldLine,
                  parent2: newCircle,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newCircle, // this is the new parent of the intersection point
                      parent2: newCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldLine, // this is the new parent of the intersection point
                      parent2: oldLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new circle with all old segments
        state.seSegments
          .map(x => x as SESegment)
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectSegmentWithCircle(
              oldSegment,
              newCircle
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a segment and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldSegment,
                  parent2: newCircle,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newCircle, // this is the new parent of the intersection point
                      parent2: newCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldSegment, // this is the new parent of the intersection point
                      parent2: oldSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new circle with all old circles
        state.seCircles
          .map(x => x as SECircle)
          .filter((circle: SECircle) => circle.id !== newCircle.id) // ignore self
          .forEach((oldCircle: SECircle) => {
            const intersectionInfo = intersectCircles(
              oldCircle.centerSEPoint.locationVector,
              oldCircle.circleRadius,
              newCircle.centerSEPoint.locationVector,
              newCircle.circleRadius,
              true // this is the first time these two objects have been intersected
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a circle and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldCircle,
                  parent2: newCircle,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newCircle, // this is the new parent of the intersection point
                      parent2: newCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldCircle, // this is the new parent of the intersection point
                      parent2: oldCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new circle with all old ellipses
        state.seEllipses
          .map(x => x as SEEllipse)
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectCircleWithEllipse(
              newCircle,
              oldEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newCircle,
                  parent2: oldEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newCircle, // this is the new parent of the intersection point
                      parent2: newCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldEllipse, // this is the new parent of the intersection point
                      parent2: oldEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new circle with all old parametrics
        state.seParametrics
          .map(x => x as SEParametric)
          .forEach((oldParametric: SEParametric) => {
            const intersectionInfo = intersectCircleWithParametric(
              newCircle,
              oldParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newCircle,
                  parent2: oldParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newCircle, // this is the new parent of the intersection point
                      parent2: newCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldParametric, // this is the new parent of the intersection point
                      parent2: oldParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        // Before returning remove duplicate existingSEIntersection points (duplicate means same SEIntersection point AND same parent)
        // also remove any existing SEIntersection points that are immediate parents of the new object being created
        const filteredIntersectionPointList: SEIntersectionReturnType[] = [];
        intersectionPointList.forEach(listItem => {
          if (listItem.existingIntersectionPoint) {
            if (
              !filteredIntersectionPointList.some(
                filteredListItem =>
                  listItem.SEIntersectionPoint.id ===
                    filteredListItem.SEIntersectionPoint.id &&
                  listItem.parent1.id === filteredListItem.parent1.id
              ) &&
              listItem.SEIntersectionPoint.id !== newCircle.circleSEPoint.id &&
              listItem.SEIntersectionPoint.id !== newCircle.centerSEPoint.id
            ) {
              filteredIntersectionPointList.push(listItem);
            }
          } else {
            // automatically add the newly created intersection points
            filteredIntersectionPointList.push(listItem);
          }
        });

        return filteredIntersectionPointList;
      };
    },
    createAllIntersectionsWithEllipse(
      state
    ): (_e: SEEllipse, _p: SEPoint[]) => SEIntersectionReturnType[] {
      return (
        newEllipse: SEEllipse,
        existingNewSEPoints?: SEPoint[]
      ): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const existingSEPoints: SEPoint[] = [];
        if (existingNewSEPoints) {
          existingSEPoints.push(...existingNewSEPoints);
        }
        // // First add the three parent points of the newEllipse, if they are new, then
        // //  they won't have been added to the state.points array yet so add them first
        // existingSEPoints.push(newEllipse.focus1SEPoint);
        // existingSEPoints.push(newEllipse.focus2SEPoint);
        // existingSEPoints.push(newEllipse.ellipseSEPoint);
        state.sePoints
          .map(x => x as SEPoint)
          .forEach(pt => {
            if (
              !pt.locationVector.isZero() &&
              !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
            ) {
              existingSEPoints.push(pt);
            }
          });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // The number of existing sePoint before we start adding to it with newly created intersection points
        const numberOfExistingSEPointsBefore = existingSEPoints.length;

        // Intersect this new ellipse with all old lines
        state.seLines
          .map(x => x as SELine)
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithEllipse(
              oldLine,
              newEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and line don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldLine,
                  parent2: newEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newEllipse, // this is the new parent of the intersection point
                      parent2: newEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldLine, // this is the new parent of the intersection point
                      parent2: oldLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new ellipse with all old segments
        state.seSegments
          .map(x => x as SESegment)
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectSegmentWithEllipse(
              oldSegment,
              newEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and segment don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldSegment,
                  parent2: newEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newEllipse, // this is the new parent of the intersection point
                      parent2: newEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldSegment, // this is the new parent of the intersection point
                      parent2: oldSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new ellipse with all old circles
        state.seCircles
          .map(x => x as SECircle)
          .forEach((oldCircle: SECircle) => {
            const intersectionInfo = intersectCircleWithEllipse(
              oldCircle,
              newEllipse
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldCircle,
                  parent2: newEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newEllipse, // this is the new parent of the intersection point
                      parent2: newEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldCircle, // this is the new parent of the intersection point
                      parent2: oldCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new ellipse with all old ellipses
        state.seEllipses
          .map(x => x as SEEllipse)
          .filter((ellipe: SEEllipse) => ellipe.id !== newEllipse.id) // ignore self
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectEllipseWithEllipse(
              oldEllipse,
              newEllipse,
              true // this is the first time these two objects have been intersected
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and ellipse don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldEllipse,
                  parent2: newEllipse,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newEllipse, // this is the new parent of the intersection point
                      parent2: newEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldEllipse, // this is the new parent of the intersection point
                      parent2: oldEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });

        //Intersect this new ellipse with all old parametrics
        state.seParametrics
          .map(x => x as SEParametric)
          .forEach((oldParametric: SEParametric) => {
            const intersectionInfo = intersectEllipseWithParametric(
              newEllipse,
              oldParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a ellipse and parametric don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newEllipse,
                  parent2: oldParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newEllipse, // this is the new parent of the intersection point
                      parent2: newEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldParametric, // this is the new parent of the intersection point
                      parent2: oldParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Before returning remove duplicate existingSEIntersection points (duplicate means same SEIntersection point AND same parent)
        // also remove any existing SEIntersection points that are immediate parents of the new object being created
        const filteredIntersectionPointList: SEIntersectionReturnType[] = [];
        intersectionPointList.forEach(listItem => {
          if (listItem.existingIntersectionPoint) {
            if (
              !filteredIntersectionPointList.some(
                filteredListItem =>
                  listItem.SEIntersectionPoint.id ===
                    filteredListItem.SEIntersectionPoint.id &&
                  listItem.parent1.id === filteredListItem.parent1.id
              ) &&
              listItem.SEIntersectionPoint.id !== newEllipse.focus1SEPoint.id &&
              listItem.SEIntersectionPoint.id !== newEllipse.focus2SEPoint.id &&
              listItem.SEIntersectionPoint.id !== newEllipse.ellipseSEPoint.id
            ) {
              filteredIntersectionPointList.push(listItem);
            }
          } else {
            // automatically add the newly created intersection points
            filteredIntersectionPointList.push(listItem);
          }
        });

        return filteredIntersectionPointList;
      };
    },

    createAllIntersectionsWithParametric(
      state
    ): (_p: SEParametric, _s: SEPoint[]) => SEIntersectionReturnType[] {
      return (
        newParametric: SEParametric,
        existingNewSEPoints?: SEPoint[]
      ): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const existingSEPoints: SEPoint[] = [];
        if (existingNewSEPoints) {
          existingSEPoints.push(...existingNewSEPoints);
        }
        // // First add the end points of the newParametric, if they are exist, then
        // //  they won't have been added to the state.points array yet so add them first
        // // Always screen for the zero vector
        // newParametric.endPoints.forEach(pt => {
        //   if (!pt.locationVector.isZero()) {
        //     existingSEPoints.push(pt);
        //   }
        // });
        state.sePoints
          .map(x => x as SEPoint)
          .forEach(pt => {
            if (
              !pt.locationVector.isZero() &&
              !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
            ) {
              existingSEPoints.push(pt);
            }
          });

        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // The number of existing sePoint before we start adding to it with newly created intersection points
        const numberOfExistingSEPointsBefore = existingSEPoints.length;
        // Intersect this new parametric with all old lines
        state.seLines
          .map(x => x as SELine)
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithParametric(
              oldLine,
              newParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and line don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldLine,
                  parent2: newParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newParametric, // this is the new parent of the intersection point
                      parent2: newParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldLine, // this is the new parent of the intersection point
                      parent2: oldLine,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Intersect this new parametric with all old segments
        state.seSegments
          .map(x => x as SESegment)
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectSegmentWithParametric(
              oldSegment,
              newParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and segment don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldSegment,
                  parent2: newParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newParametric, // this is the new parent of the intersection point
                      parent2: newParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldSegment, // this is the new parent of the intersection point
                      parent2: oldSegment,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Intersect this new parametric with all old circles
        state.seCircles
          .map(x => x as SECircle)
          .forEach((oldCircle: SECircle) => {
            const intersectionInfo = intersectCircleWithParametric(
              oldCircle,
              newParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and circle don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldCircle,
                  parent2: newParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newParametric, // this is the new parent of the intersection point
                      parent2: newParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldCircle, // this is the new parent of the intersection point
                      parent2: oldCircle,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new parametric with all old ellipses
        state.seEllipses
          .map(x => x as SEEllipse)
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectEllipseWithParametric(
              oldEllipse,
              newParametric,
              inverseTotalRotationMatrix
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and ellipse don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
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
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: oldEllipse,
                  parent2: newParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newParametric, // this is the new parent of the intersection point
                      parent2: newParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldEllipse, // this is the new parent of the intersection point
                      parent2: oldEllipse,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        //Intersect this new parametric with all old parametrics
        state.seParametrics
          .map(x => x as SEParametric)
          .filter(
            (parametric: SEParametric) => parametric.id !== newParametric.id
          ) // ignore self
          .forEach((oldParametric: SEParametric) => {
            const intersectionInfo = intersectParametricWithParametric(
              oldParametric,
              newParametric
            );
            let existingSEIntersectionPoint: SEIntersectionPoint | null = null;
            let indexOfExistingSEIntersectionPoint = -1;
            intersectionInfo.forEach((info, index) => {
              // Options
              //  0) The intersection point is on the list of sePoints, but the sePoint is not an intersection point (so do nothing with this intersection)
              //  1) The intersection point is new so create a new intersection point
              //  2) The intersection point is old and the intersection point was created before this command (on the existingSEPoints array with index less than numberOfExistingSEPointsBefore)
              //  3) The intersection point is old and intersection point was created earlier in this command (on the existingSEPoints array with index greater than or equal to numberOfExistingSEPointsBefore)

              if (
                !existingSEPoints.some((pt, ind) => {
                  if (
                    tmpVector
                      .subVectors(info.vector, pt.locationVector)
                      .isZero() &&
                    !pt.locationVector.isZero() // if a parametric and parametric don't initially intersect the intersection is the zero vector
                  ) {
                    if (pt instanceof SEIntersectionPoint) {
                      existingSEIntersectionPoint = pt;
                      indexOfExistingSEIntersectionPoint = ind;
                    }
                    return true;
                  } else {
                    return false;
                  }
                })
              ) {
                // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
                const newPt = new NonFreePoint();
                newPt.stylize(DisplayStyle.ApplyTemporaryVariables);
                newPt.adjustSize();
                const newSEIntersectionPt = new SEIntersectionPoint(
                  newPt,
                  newParametric,
                  oldParametric,
                  index,
                  false
                );
                //put the new intersection point on the existing list
                existingSEPoints.push(newSEIntersectionPt);
                //copy the location and existence information into the new intersection point and put it on the list to be returned
                newSEIntersectionPt.locationVector = info.vector;
                newSEIntersectionPt.exists = info.exists;
                intersectionPointList.push({
                  SEIntersectionPoint: newSEIntersectionPt,
                  parent1: newParametric,
                  parent2: oldParametric,
                  existingIntersectionPoint: false
                });
              } else {
                // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an intersection point)
                if (existingSEIntersectionPoint) {
                  if (
                    indexOfExistingSEIntersectionPoint <
                    numberOfExistingSEPointsBefore
                  ) {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that was not created with this command (Option #2 above)
                    // this mean that the newly created one dimensional object should be the parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: newParametric, // this is the new parent of the intersection point
                      parent2: newParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  } else {
                    // the intersection vector (info.vector) is at an existing SEIntersection point that *was* created with this command (Option #3 above)
                    // this mean that the old one dimensional object should be a new parent of this intersection point
                    intersectionPointList.push({
                      SEIntersectionPoint: existingSEIntersectionPoint,
                      parent1: oldParametric, // this is the new parent of the intersection point
                      parent2: oldParametric,
                      existingIntersectionPoint: true
                    });
                    // update the existence with the new parent if it exists (otherwise leave it alone)
                    if (info.exists === true) {
                      existingSEIntersectionPoint.exists = info.exists;
                    }
                  }
                }
              }
              //clear the existingSEIntersectionPoint
              existingSEIntersectionPoint = null;
            });
          });
        // Before returning remove duplicate existingSEIntersection points (duplicate means same SEIntersection point AND same parent)
        // also remove any existing SEIntersection points that are immediate parents of the new object being created
        const filteredIntersectionPointList: SEIntersectionReturnType[] = [];
        intersectionPointList.forEach(listItem => {
          if (listItem.existingIntersectionPoint) {
            if (
              !filteredIntersectionPointList.some(
                filteredListItem =>
                  listItem.SEIntersectionPoint.id ===
                    filteredListItem.SEIntersectionPoint.id &&
                  listItem.parent1.id === filteredListItem.parent1.id
              )
            ) {
              filteredIntersectionPointList.push(listItem);
            }
          } else {
            // automatically add the newly created intersection points
            filteredIntersectionPointList.push(listItem);
          }
        });

        return filteredIntersectionPointList;
      };
    }
  }
});

export type SEStoreType = StoreActions<ReturnType<typeof useSEStore>> &
  StoreGetters<ReturnType<typeof useSEStore>> &
  StoreState<ReturnType<typeof useSEStore>>;

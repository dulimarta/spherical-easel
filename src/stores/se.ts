import EventBus from "@/eventHandlers/EventBus";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEExpression } from "@/models/SEExpression";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SENodule } from "@/models/SENodule";
import { SENSectLine } from "@/models/SENSectLine";
import { SEParametric } from "@/models/SEParametric";
import { SEPencil } from "@/models/SEPencil";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEPoint } from "@/models/SEPoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEPolygon } from "@/models/SEPolygon";
import { SESegment } from "@/models/SESegment";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import NonFreePoint from "@/plottables/NonFreePoint";
import { ActionMode, SEIntersectionReturnType } from "@/types";
import { StyleEditPanels, StyleOptions } from "@/types/Styles";
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
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import { Matrix4, Vector3 } from "three";
import Two from "two.js";

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
  // Initially the identity. This is the composition of all the inverses of the rotation matrices applied to the sphere.
  // inverseTotalRotationMatrix: Matrix4;
  styleSavedFromPanel: StyleEditPanels;
  sePointIds: Array<number>;
  seLineIds: Array<number>;
  seSegmentIds: Array<number>;
  seCircleIds: Array<number>;
  seEllipseIds: Array<number>;
  seLabelIds: Array<number>;
  seExpressionIds: Array<number>;
  seAngleMarkerIds: Array<number>;
  seParametricIds: Array<number>;
  sePolygonIds: Array<number>;
};

const seNodules: Array<SENodule> = [];
const oldSelections: Array<SENodule> = [];
const sePoints: Map<number, SEPoint> = new Map();
const seLines: Map<number, SELine> = new Map();
const seSegments: Map<number, SESegment> = new Map();
const seCircles: Map<number, SECircle> = new Map();
const seLabels: Map<number, SELabel> = new Map();
const seExpressions: Map<number, SEExpression> = new Map();
const seAngleMarkers: Map<number, SEAngleMarker> = new Map();
const seEllipses: Map<number, SEEllipse> = new Map();
const seParametrics: Map<number, SEParametric> = new Map();
const sePolygons: Map<number, SEPolygon> = new Map();
const sePencils: Array<SEPencil> = [];
const layers: Array<Two.Group> = [];
const inverseTotalRotationMatrix = new Matrix4();
const tmpMatrix = new Matrix4();
const tmpVector = new Vector3();
const temporaryNodules: Array<Nodule> = [];
const selectedSENodules: Array<SENodule> = [];
const initialStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();
const defaultStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();

export const useSEStore = defineStore({
  id: "se",
  state: (): PiniaAppState => ({
    actionMode: "rotate",
    previousActionMode: "rotate",
    activeToolName: "rotate",
    previousActiveToolName: "",
    svgCanvas: null,
    hasUnsavedNodules: false,
    zoomMagnificationFactor: 1,
    zoomTranslation: [0, 0],
    canvasWidth: 0,
    sePointIds: [],
    seLineIds: [],
    seSegmentIds: [],
    seCircleIds: [],
    seEllipseIds: [],
    seLabelIds: [],
    seExpressionIds: [],
    seAngleMarkerIds: [],
    seParametricIds: [],
    sePolygonIds: [],
    // oldSelections: SELine[],
    styleSavedFromPanel: StyleEditPanels.Label
    // inverseTotalRotationMatrix: new Matrix4() //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
  }),
  actions: {
    init(): void {
      this.actionMode = "rotate";
      this.activeToolName = "";
      // Do not clear the layers array!
      // Replace clear() with splice(0). Since clear() is an extension function
      // Update to these arrays are not automatically picked up by VueJS
      seNodules.splice(0);
      this.sePointIds.splice(0);
      sePoints.clear();
      this.seLineIds.splice(0);
      seLines.clear();
      this.seSegmentIds.splice(0);
      seSegments.clear();
      this.seCircleIds.splice(0);
      seCircles.clear();
      this.seAngleMarkerIds.splice(0);
      seAngleMarkers.clear();
      this.sePolygonIds.splice(0);
      sePolygons.clear();
      this.seEllipseIds.splice(0);
      seEllipses.clear();
      this.seParametricIds.splice(0);
      seParametrics.clear();
      sePencils.splice(0);
      this.seLabelIds.splice(0);
      selectedSENodules.splice(0);
      // intersections.splice(0);
      this.seExpressionIds.splice(0);
      // initialStyleStates.splice(0);
      // defaultStyleStates.splice(0);
      this.hasUnsavedNodules = false;
      temporaryNodules.splice(0);
      inverseTotalRotationMatrix.identity();

      // Note by Hans (2022-01-05): this.init() has been moved from App.vue to SphereFrame.vue

      // Do not clear the temporaryNodules array
      // because the constructors of the tools (handlers) place the temporary Nodules
      // in this array *before* the this.init is called in App.vue mount.
    },
    setLayers(grp: Array<Two.Group>): void {
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
      seAngleMarkers.forEach((x: SEAngleMarker) => x.ref.removeFromLayers());
      seCircles.forEach((x: SECircle) => x.ref.removeFromLayers());
      seEllipses.forEach((x: SEEllipse) => x.ref.removeFromLayers());
      seLabels.forEach((x: SELabel) => x.ref.removeFromLayers(layers));
      seLines.forEach((x: SELine) => x.ref.removeFromLayers());
      this.sePointIds.forEach((id: number) => {
        const pt = sePoints.get(id);
        if (pt) pt.ref.removeFromLayers();
      });
      seSegments.forEach((x: SESegment) => x.ref.removeFromLayers());
      sePolygons.forEach((x: SEPolygon) => x.ref.removeFromLayers());
      seParametrics.forEach((x: SEParametric) => {
        x.ref?.removeFromLayers();
        // let ptr: Parametric | null = x.ref;
        // while (ptr !== null) {
        //   ptr.removeFromLayers();
        //   ptr = ptr.next;
        // }
      });
      sePencils.forEach((p: SEPencil) => {
        p.lines.forEach((l: SEPerpendicularLineThruPoint) => {
          l.ref.removeFromLayers();
        });
      });
    },
    // Update the display of all free SEPoints to update the entire display
    updateDisplay(): void {
      seNodules
        .filter(obj => obj.isFreeToMove())
        .forEach(obj => {
          // First mark the kids out of date so that the update method does a topological sort
          obj.markKidsOutOfDate();
          obj.update();
          // console.log("name", obj.name, "show", obj.showing, "exist", obj.exists);
        });
    },
    setZoomMagnificationFactor(mag: number): void {
      // console.log("setZoomMagFactor");
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
      this.sePointIds.push(point.id);
      sePoints.set(point.id, point);
      seNodules.push(point);
      point.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    //#endregion addPoint
    removePoint(pointId: number): void {
      const victimPoint = sePoints.get(pointId);
      if (victimPoint) {
        victimPoint.ref.removeFromLayers();
        const pos = this.sePointIds.findIndex((x: number) => x === pointId);
        const pos2 = this.seNodules.findIndex(
          (x: SENodule) => x.id === pointId
        );
        this.sePointIds.splice(pos, 1);
        seNodules.splice(pos2, 1);
        sePoints.delete(pointId);
        this.hasUnsavedNodules = true;
      }
    },
    movePoint(move: { pointId: number; location: Vector3 }): void {
      // pointMoverVisitor.setNewLocation(move.location);
      // const pos = sePoints.findIndex(x => x.id === move.pointId);
      // sePoints[pos].accept(pointMoverVisitor);
    },

    addLine(line: SELine): void {
      this.seLineIds.push(line.id);
      seLines.set(line.id, line);
      seNodules.push(line as SENodule);
      line.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    addCircle(circle: SECircle): void {
      this.seCircleIds.push(circle.id);
      seCircles.set(circle.id, circle);
      seNodules.push(circle);
      circle.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeCircle(circleId: number): void {
      const victimCircle = seCircles.get(circleId);
      if (victimCircle) {
        /* victim line is found */
        victimCircle.ref.removeFromLayers();
        const circlePos = this.seCircleIds.findIndex(
          (id: number) => id === circleId
        );
        const pos = seNodules.findIndex(x => x.id === circleId);
        this.seCircleIds.splice(circlePos, 1); // Remove the circle from the list
        seNodules.splice(pos, 1);
        seCircles.delete(circleId);
        this.hasUnsavedNodules = true;
      }
    },

    removeLine(lineId: number): void {
      const victimLine = seLines.get(lineId)!;
      if (victimLine) {
        /* victim line is found */
        victimLine.ref.removeFromLayers();
        const pos = this.seLineIds.findIndex((id: number) => id === lineId);
        const pos2 = seNodules.findIndex(x => x.id === lineId);
        seLines.delete(lineId);
        this.seLineIds.splice(pos, 1); // Remove the line from the list
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addSegment(segment: SESegment): void {
      this.seSegmentIds.push(segment.id);
      seSegments.set(segment.id, segment);
      seNodules.push(segment);
      segment.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeSegment(segId: number): void {
      const victimSegment = seSegments.get(segId);
      if (victimSegment) {
        const pos = this.seSegmentIds.findIndex((id: number) => id === segId);
        const pos2 = seNodules.findIndex(x => x.id === segId);
        victimSegment.ref.removeFromLayers();
        this.seSegmentIds.splice(pos, 1);
        seSegments.delete(segId);
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },

    addEllipse(ellipse: SEEllipse): void {
      this.seEllipseIds.push(ellipse.id);
      seEllipses.set(ellipse.id, ellipse);
      seNodules.push(ellipse);
      ellipse.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeEllipse(ellipseId: number): void {
      const victimEllipse = seEllipses.get(ellipseId)!;
      if (victimEllipse) {
        /* victim line is found */
        victimEllipse.ref.removeFromLayers();
        const ellipsePos = this.seEllipseIds.findIndex(
          (id: number) => id === ellipseId
        );
        const pos2 = seNodules.findIndex(x => x.id === ellipseId);
        this.seEllipseIds.splice(ellipsePos, 1); // Remove the ellipse from the list
        seEllipses.delete(ellipseId);
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addLabel(label: SELabel): void {
      this.seLabelIds.push(label.id);
      seLabels.set(label.id, label);
      seNodules.push(label);
      label.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeLabel(labelId: number): void {
      const victimLabel = seLabels.get(labelId);
      if (victimLabel) {
        // Remove the associated plottable (Nodule) object from being rendered
        victimLabel.ref.removeFromLayers(layers);
        const pos = this.seLabelIds.findIndex((id: number) => id === labelId);
        const pos2 = seNodules.findIndex((x: SENodule) => x.id === labelId);
        this.seLabelIds.splice(pos, 1);
        seLabels.delete(labelId);
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    moveLabel(move: { labelId: number; location: Vector3 }): void {
      // labelMoverVisitor.setNewLocation(move.location);
      // const pos = seLabels.findIndex(x => x.id === move.labelId);
      // seLabels[pos].accept(labelMoverVisitor);
    },

    addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
      this.seExpressionIds.push(angleMarker.id);
      this.seAngleMarkerIds.push(angleMarker.id);
      seAngleMarkers.set(angleMarker.id, angleMarker);
      seExpressions.set(angleMarker.id, angleMarker);
      seNodules.push(angleMarker);
      angleMarker.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeAngleMarkerAndExpression(angleMarkerId: number): void {
      const victimAngleMarker = seAngleMarkers.get(angleMarkerId);
      if (victimAngleMarker) {
        /* victim angleMarker is found */
        victimAngleMarker.ref.removeFromLayers();
        seAngleMarkers.delete(angleMarkerId);
        seExpressions.delete(angleMarkerId);
        const angleMarkerPos = this.seAngleMarkerIds.findIndex(
          (id: number) => id === angleMarkerId
        );
        const pos2 = seNodules.findIndex(x => x.id === angleMarkerId);
        const pos3 = this.seExpressionIds.findIndex(
          (id: number) => id === angleMarkerId
        );
        // when removing expressions that have effects on the labels, we must set those label display arrays to empty
        if (victimAngleMarker.label) {
          victimAngleMarker.label.ref.value = [];
        }
        // victimCircle.removeSelfSafely();
        this.seAngleMarkerIds.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
        seNodules.splice(pos2, 1);
        this.seExpressionIds.splice(pos3, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addParametric(parametric: SEParametric): void {
      this.seParametricIds.push(parametric.id);
      seParametrics.set(parametric.id, parametric);
      seNodules.push(parametric);
      parametric.ref?.addToLayers(layers);
      // let ptr: Parametric | null = parametric.ref;
      // while (ptr) {
      //   ptr.addToLayers(layers);
      //   ptr = ptr.next;
      // }
      this.hasUnsavedNodules = true;
    },

    removeParametric(parametricId: number): void {
      const victimParametric = seParametrics.get(parametricId);
      if (victimParametric) {
        /* victim line is found */
        const parametricPos = this.seParametricIds.findIndex(
          (id: number) => id === parametricId
        );
        const pos2 = seNodules.findIndex(x => x.id === parametricId);
        victimParametric.ref?.removeFromLayers();
        // let ptr: Parametric | null = victimParametric.ref;
        // while (ptr !== null) {
        //   ptr.removeFromLayers();
        //   ptr = ptr.next;
        // }
        // victimParametric.removeSelfSafely();
        this.seParametricIds.splice(parametricPos, 1); // Remove the parametric from the list
        seParametrics.delete(parametricId);
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addPolygonAndExpression(polygon: SEPolygon): void {
      this.seExpressionIds.push(polygon.id);
      seExpressions.set(polygon.id, polygon);
      this.sePolygonIds.push(polygon.id);
      sePolygons.set(polygon.id, polygon);
      seNodules.push(polygon);
      polygon.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removePolygonAndExpression(polygonId: number): void {
      const victimPolygon = sePolygons.get(polygonId);
      if (victimPolygon) {
        const polygonPos = this.sePolygonIds.findIndex(
          (id: number) => id === polygonId
        );
        const pos2 = seNodules.findIndex(x => x.id === polygonId);
        const pos3 = this.seExpressionIds.findIndex(
          (id: number) => id === polygonId
        );
        /* victim polygon is found */
        // when removing expressions that have effects on the labels, we must set those label display arrays to empty
        if (victimPolygon.label) {
          victimPolygon.label.ref.value = [];
        }
        victimPolygon.ref.removeFromLayers();
        this.sePolygonIds.splice(polygonPos, 1); // Remove the polygon from the list
        sePolygons.delete(polygonId);
        seNodules.splice(pos2, 1);
        this.seExpressionIds.splice(pos3, 1);
        seExpressions.delete(polygonId);
        this.hasUnsavedNodules = true;
      }
    },
    addExpression(measurement: SEExpression): void {
      this.seExpressionIds.push(measurement.id);
      seExpressions.set(measurement.id, measurement);
      seNodules.push(measurement);
      this.hasUnsavedNodules = true;
    },
    removeExpression(measId: number): void {
      const victimExpr = seExpressions.get(measId);
      if (victimExpr) {
        seExpressions.delete(measId);
        const pos = this.seExpressionIds.findIndex(
          (id: number) => id === measId
        );
        const pos2 = seNodules.findIndex(x => x.id === measId);
        this.seExpressionIds.splice(pos, 1);
        seNodules.splice(pos2, 1);
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
          console.debug(parent.name, "invalidates", m.name);
          if (m.exists) {
            if (m.canUpdateNow()) {
              if (!updateCandidates.find((x: SENodule) => x.name === m.name))
                updateCandidates.push(m);
            } else {
              console.debug("!!! Dependent ", m.name, " can't be updated now");
            }
          }
        });
      }

      // Begin updating those objects with no parents
      updateCandidates.push(
        ...seNodules.filter((p: SENodule) => p.parents.length === 0)
      );
      console.debug(
        "Update candidates",
        updateCandidates.map(z => z.name).join(", ")
      );
      while (updateCandidates.length > 0) {
        const target = updateCandidates.shift()!;
        const accepted = target.accept(rotationVisitor);
        // console.debug(`What's going on with ${target.name}?`, accepted);
        if (!accepted) {
          console.debug(
            target.name,
            "does not accept rotation visitor, try its shallowUpdate"
          );
          target.shallowUpdate();
        }
        target.setOutOfDate(false);
        target.markKidsOutOfDate();

        addCandidatesFrom(target);

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
      //   this.seNodules.forEach((n: SENodule) => {
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
      seNodules.forEach(seNodule => {
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
      // segmentNormalArcLengthVisitor.setNewNormal(change.normal);
      // segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
      // const pos = seSegments.findIndex(x => x.id === change.segmentId);
      // if (pos >= 0) this.seSegments[pos].accept(segmentNormalArcLengthVisitor);
    },
    changeLineNormalVector(change: { lineId: number; normal: Vector3 }): void {
      // lineNormalVisitor.setNewNormal(change.normal);
      // const pos = seLines.findIndex(x => x.id === change.lineId);
      // if (pos >= 0) seLines[pos].accept(lineNormalVisitor);
    }, // These are added to the store so that I can update the size of the temporary objects when there is a resize event.
    addTemporaryNodule(nodule: Nodule): void {
      temporaryNodules.push(nodule);
    },
    setSelectedSENodules(payload: SENodule[]): void {
      //reset the glowing color to usual
      selectedSENodules.forEach(n => {
        n.ref?.setSelectedColoring(false);
      });
      selectedSENodules.splice(0);
      selectedSENodules.push(...payload);
      //set the glowing color to selected
      selectedSENodules.forEach(n => {
        n.ref?.setSelectedColoring(true);
      });
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
      seNodules.forEach(p => {
        if (!p.selected && p.exists) {
          p.glowing = false;
        }
      });
    }
  },
  getters: {
    // zoomMagnificationFactor: (): number => zoomMagnificationFactor,
    // zoomTranslation: (): number[] => zoomTranslation,
    seNodules: (): Array<SENodule> => seNodules,
    sePoints: (state): Array<SEPoint> =>
      state.sePointIds.map(id => sePoints.get(id)!),
    seLines: (state): Array<SELine> =>
      state.seLineIds.map(id => seLines.get(id)!),
    seCircles: (state): Array<SECircle> =>
      state.seCircleIds.map(id => seCircles.get(id)!),
    seSegments: (state): Array<SESegment> =>
      state.seSegmentIds.map(id => seSegments.get(id)!),
    seEllipses: (state): Array<SEEllipse> =>
      state.seEllipseIds.map(id => seEllipses.get(id)!),
    seLabels: (state): Array<SELabel> =>
      state.seLabelIds.map(id => seLabels.get(id)!),
    seAngleMarkers: (state): Array<SEAngleMarker> =>
      state.seAngleMarkerIds.map(id => seAngleMarkers.get(id)!),
    seParametrics: (state): Array<SEParametric> =>
      state.seParametricIds.map(id => seParametrics.get(id)!),
    sePolygons: (state): Array<SEPolygon> =>
      state.sePolygonIds.map(id => sePolygons.get(id)!),
    expressions: (state): Array<SEExpression> =>
      state.seExpressionIds.map(id => seExpressions.get(id)!),
    selectedSENodules: (): Array<SENodule> => selectedSENodules,
    temporaryNodules: (): Array<Nodule> => temporaryNodules,
    oldStyleSelections: (): Array<SENodule> => oldSelections,
    initialStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      initialStyleStatesMap,
    defaultStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      defaultStyleStatesMap,
    layers: (): Array<Two.Group> => layers,
    hasObjects(state): boolean {
      return state.sePointIds.length > 0;
    },
    inverseTotalRotationMatrix: (): Matrix4 => inverseTotalRotationMatrix,
    hasNoAntipode: (state): ((_: SEPoint) => boolean) => {
      return (testPoint: SEPoint): boolean => {
        // create the antipode location vector
        tmpVector.copy(testPoint.locationVector).multiplyScalar(-1);
        // search for the antipode location vector
        const possibleAntipodes = state.sePointIds
          .map(id => sePoints.get(id)!)
          .filter((p: SEPoint) => {
            return tmpVector.equals(p.locationVector);
          });
        if (possibleAntipodes.length == 0) {
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

          // Check how many of these candidates are user created
          const userCreated = possibleAntipodes.filter(
            p => p instanceof SEIntersectionPoint && p.isUserCreated
          );
          return userCreated.length === 0;
        }
      };
    },
    getSENoduleById(): (_: number) => SENodule | undefined {
      return (id: number): SENodule | undefined => {
        return seNodules
          .map(z => z as SENodule)
          .find((z: SENodule) => z.id === id);
      };
    },
    //#region findNearbyGetter
    findNearbySENodules(): (_p: Vector3, _s: Two.Vector) => SENodule[] {
      return (
        unitIdealVector: Vector3,
        screenPosition: Two.Vector
      ): SENodule[] => {
        return seNodules.filter((obj: SENodule) => {
          return obj.isHitAt(unitIdealVector, this.zoomMagnificationFactor);
        });
      };
    },
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
        const intersectionPoints = state.sePointIds
          .map(id => sePoints.get(id)!)
          .filter(
            (p: SEPoint) =>
              p instanceof SEIntersectionPoint &&
              p.parents.some(seNodule => seNodule.name === parent1Name)
          )
          .map((obj: SEPoint) => obj as SEIntersectionPoint);

        if (parent2Name) {
          return intersectionPoints.filter((p: SEPoint) =>
            p.parents.some(seNodule => seNodule.name === parent2Name)
          );
        } else {
          return intersectionPoints;
        }
      };
    },
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
    createAllIntersectionsWithLine(
      state
    ): (_: SELine) => SEIntersectionReturnType[] {
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
        state.sePointIds
          .map(id => sePoints.get(id)!)
          .forEach((pt: SEPoint) => {
            if (!pt.locationVector.isZero()) {
              avoidVectors.push(pt.locationVector);
            }
          });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // Intersect this new line with all old lines
        state.seLineIds
          .filter((id: number) => id !== newLine.id) // ignore self
          .map((id: number) => seLines.get(id)!)
          .forEach((oldLine: SELine) => {
            const intersectionInfo = intersectLineWithLine(oldLine, newLine);
            intersectionInfo.forEach((info, index) => {
              if (
                !avoidVectors.some(v =>
                  tmpVector.subVectors(info.vector, v).isZero()
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
        //Intersect this new line with all old circles
        seCircles.forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectLineWithCircle(newLine, oldCircle);
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectLineWithEllipse(
            newLine,
            oldEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectLineWithParametric(
            newLine,
            oldParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
    },
    createAllIntersectionsWithSegment(state) {
      return (newSegment: SESegment): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the two parent points of the newLine, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newSegment.startSEPoint.locationVector);
        avoidVectors.push(newSegment.endSEPoint.locationVector);
        state.sePointIds
          .map(id => sePoints.get(id)!)
          .forEach((pt: SEPoint) => {
            if (!pt.locationVector.isZero()) {
              avoidVectors.push(pt.locationVector);
            }
          });

        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // Intersect this new segment with all old lines
        seLines.forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithSegment(
            oldLine,
            newSegment
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        state.seSegmentIds
          .map(id => seSegments.get(id)!)
          .filter((segment: SESegment) => segment.id !== newSegment.id) // ignore self
          .forEach((oldSegment: SESegment) => {
            const intersectionInfo = intersectSegmentWithSegment(
              oldSegment,
              newSegment
            );
            intersectionInfo.forEach((info, index) => {
              if (
                !avoidVectors.some(v =>
                  tmpVector.subVectors(info.vector, v).isZero()
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
        seCircles.forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectSegmentWithCircle(
            newSegment,
            oldCircle
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectSegmentWithEllipse(
            newSegment,
            oldEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectSegmentWithParametric(
            newSegment,
            oldParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
    },
    createAllIntersectionsWithCircle(
      state
    ): (_: SECircle) => SEIntersectionReturnType[] {
      return (newCircle: SECircle): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the two parent points of the newLine, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newCircle.centerSEPoint.locationVector);
        avoidVectors.push(newCircle.circleSEPoint.locationVector);
        state.sePointIds
          .map(id => sePoints.get(id)!)
          .forEach((pt: SEPoint) => {
            if (!pt.locationVector.isZero()) {
              avoidVectors.push(pt.locationVector);
            }
          });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // Intersect this new circle with all old lines
        seLines.forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithCircle(oldLine, newCircle);
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seSegments.forEach((oldSegment: SESegment) => {
          const intersectionInfo = intersectSegmentWithCircle(
            oldSegment,
            newCircle
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        state.seCircleIds
          .map(id => seCircles.get(id)!)
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
                  tmpVector.subVectors(info.vector, v).isZero()
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectCircleWithEllipse(
            newCircle,
            oldEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectCircleWithParametric(
            newCircle,
            oldParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
    },
    createAllIntersectionsWithEllipse(
      state
    ): (_: SEEllipse) => SEIntersectionReturnType[] {
      return (newEllipse: SEEllipse): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the three parent points of the newEllipse, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newEllipse.focus1SEPoint.locationVector);
        avoidVectors.push(newEllipse.focus2SEPoint.locationVector);
        avoidVectors.push(newEllipse.ellipseSEPoint.locationVector);
        state.sePointIds
          .map(id => sePoints.get(id)!)
          .forEach((pt: SEPoint) => {
            if (!pt.locationVector.isZero()) {
              avoidVectors.push(pt.locationVector);
            }
          });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];

        // Intersect this new ellipse with all old lines
        seLines.forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithEllipse(
            oldLine,
            newEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seSegments.forEach((oldSegment: SESegment) => {
          const intersectionInfo = intersectSegmentWithEllipse(
            oldSegment,
            newEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seCircles.forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectCircleWithEllipse(
            oldCircle,
            newEllipse
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        state.seEllipseIds
          .map(id => seEllipses.get(id)!)
          .filter((ellipe: SEEllipse) => ellipe.id !== newEllipse.id) // ignore self
          .forEach((oldEllipse: SEEllipse) => {
            const intersectionInfo = intersectEllipseWithEllipse(
              oldEllipse,
              newEllipse
            );
            intersectionInfo.forEach((info, index) => {
              if (
                !avoidVectors.some(v =>
                  tmpVector.subVectors(info.vector, v).isZero()
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectEllipseWithParametric(
            newEllipse,
            oldParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        return [];
      };
    },
    createAllIntersectionsWithParametric(
      state
    ): (_: SEParametric) => SEIntersectionReturnType[] {
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
        state.sePointIds
          .map(id => sePoints.get(id)!)
          .forEach((pt: SEPoint) => {
            if (!pt.locationVector.isZero()) {
              avoidVectors.push(pt.locationVector);
            }
          });

        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];

        // Intersect this new parametric with all old lines
        seLines.forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithParametric(
            oldLine,
            newParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seSegments.forEach((oldSegment: SESegment) => {
          const intersectionInfo = intersectSegmentWithParametric(
            oldSegment,
            newParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seCircles.forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectCircleWithParametric(
            oldCircle,
            newParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectEllipseWithParametric(
            oldEllipse,
            newParametric,
            inverseTotalRotationMatrix
          );
          intersectionInfo.forEach((info, index) => {
            if (
              !avoidVectors.some(v =>
                tmpVector.subVectors(info.vector, v).isZero()
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
        state.seParametricIds
          .map(id => seParametrics.get(id)!)
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
                  tmpVector.subVectors(info.vector, v).isZero()
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
  }
});

export type SEStoreType = StoreActions<ReturnType<typeof useSEStore>> &
  StoreGetters<ReturnType<typeof useSEStore>> &
  StoreState<ReturnType<typeof useSEStore>>;

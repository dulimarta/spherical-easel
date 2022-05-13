import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import { ActionMode, PiniaAppState, SEIntersectionReturnType } from "@/types";
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
import Two from "two.js";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SENSectLine } from "@/models/SENSectLine";
import { SEPencil } from "@/models/SEPencil";

const sePoints: Array<SEPoint> = [];
const seNodules: Array<SENodule> = [];
const oldSelections: Array<SENodule> = [];
const seLines: Array<SELine> = [];
const seSegments: Array<SESegment> = [];
const seCircles: Array<SECircle> = [];
const seLabels: Array<SELabel> = [];
const expressions: Array<SEExpression> = [];
const seAngleMarkers: Array<SEAngleMarker> = [];
const seEllipses: Array<SEEllipse> = [];
const seParametrics: Array<SEParametric> = [];
const sePencils: Array<SEPencil> = [];
const sePolygons: Array<SEPolygon> = [];
const layers: Array<Two.Group> = [];
const inverseTotalRotationMatrix = new Matrix4();
const tmpMatrix = new Matrix4();
const tmpVector = new Vector3();
const temporaryNodules: Array<Nodule> = [];
const selectedSENodules: Array<SENodule> = [];
const initialStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();
const defaultStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();

export const useSEStore = defineStore("se", {
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
    // oldSelections: SELine[],
    styleSavedFromPanel: StyleEditPanels.Label,
    inverseTotalRotationMatrix: new Matrix4() //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
  }),
  actions: {
    init(): void {
      this.actionMode = "rotate";
      this.activeToolName = "";
      // Do not clear the layers array!
      // Replace clear() with splice(0). Since clear() is an extension function
      // Update to these arrays are not automatically picked up by VueJS
      seNodules.splice(0);
      sePoints.splice(0);
      seLines.splice(0);
      seSegments.splice(0);
      seCircles.splice(0);
      seAngleMarkers.splice(0);
      sePolygons.splice(0);
      seEllipses.splice(0);
      seParametrics.splice(0);
      sePencils.splice(0);
      seLabels.splice(0);
      selectedSENodules.splice(0);
      // intersections.splice(0);
      expressions.splice(0);
      // initialStyleStates.splice(0);
      // defaultStyleStates.splice(0);
      this.hasUnsavedNodules = false;
      temporaryNodules.splice(0);

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
    setSphereRadius(r: number): void {
      // TODO
    },
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
      sePoints.forEach((x: SEPoint) => x.ref.removeFromLayers());
      seSegments.forEach((x: SESegment) => x.ref.removeFromLayers());
      sePolygons.forEach((x: SEPolygon) => x.ref.removeFromLayers());
      seParametrics.forEach((x: SEParametric) => {
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
      sePoints.push(point);
      seNodules.push(point);
      point.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    //#endregion addPoint
    removePoint(pointId: number): void {
      const pos = sePoints.findIndex((x: SEPoint) => x.id === pointId);
      const pos2 = seNodules.findIndex((x: SENodule) => x.id === pointId);
      if (pos >= 0) {
        const victimPoint = sePoints[pos];
        sePoints.splice(pos, 1);
        seNodules.splice(pos2, 1);
        // Remove the associated plottable (Nodule) object from being rendered
        victimPoint.ref.removeFromLayers();
        this.hasUnsavedNodules = true;
      }
    },
    movePoint(move: { pointId: number; location: Vector3 }): void {
      // pointMoverVisitor.setNewLocation(move.location);
      // const pos = sePoints.findIndex(x => x.id === move.pointId);
      // sePoints[pos].accept(pointMoverVisitor);
    },

    addLine(line: SELine): void {
      seLines.push(line);
      seNodules.push(line as SENodule);
      line.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    addCircle(circle: SECircle): void {
      seCircles.push(circle);
      seNodules.push(circle);
      circle.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeCircle(circleId: number): void {
      const circlePos = seCircles.findIndex(x => x.id === circleId);
      const pos2 = seNodules.findIndex(x => x.id === circleId);
      if (circlePos >= 0) {
        /* victim line is found */
        const victimCircle: SECircle = seCircles[circlePos];
        victimCircle.ref.removeFromLayers();
        // victimCircle.removeSelfSafely();
        seCircles.splice(circlePos, 1); // Remove the circle from the list
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },

    removeLine(lineId: number): void {
      const pos = seLines.findIndex((x: any) => x.id === lineId);
      const pos2 = seNodules.findIndex(x => x.id === lineId);
      if (pos >= 0) {
        /* victim line is found */
        const victimLine = seLines[pos];
        victimLine.ref.removeFromLayers();
        seLines.splice(pos, 1); // Remove the line from the list
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addSegment(segment: SESegment): void {
      seSegments.push(segment);
      seNodules.push(segment);
      segment.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeSegment(segId: number): void {
      const pos = seSegments.findIndex(x => x.id === segId);
      const pos2 = seNodules.findIndex(x => x.id === segId);
      if (pos >= 0) {
        const victimSegment = seSegments[pos];
        victimSegment.ref.removeFromLayers();
        seSegments.splice(pos, 1);
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },

    addEllipse(ellipse: SEEllipse): void {
      seEllipses.push(ellipse);
      seNodules.push(ellipse);
      ellipse.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeEllipse(ellipseId: number): void {
      const ellipsePos = seEllipses.findIndex(x => x.id === ellipseId);
      const pos2 = seNodules.findIndex(x => x.id === ellipseId);
      if (ellipsePos >= 0) {
        /* victim line is found */
        const victimEllipse: SEEllipse = seEllipses[ellipsePos];
        victimEllipse.ref.removeFromLayers();
        // victimEllipse.removeSelfSafely();
        seEllipses.splice(ellipsePos, 1); // Remove the ellipse from the list
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addLabel(label: SELabel): void {
      seLabels.push(label);
      seNodules.push(label);
      label.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },
    removeLabel(labelId: number): void {
      const pos = seLabels.findIndex((x: SELabel) => x.id === labelId);
      const pos2 = seNodules.findIndex((x: SENodule) => x.id === labelId);
      if (pos >= 0) {
        const victimLabel = seLabels[pos];
        seLabels.splice(pos, 1);
        seNodules.splice(pos2, 1);
        // Remove the associated plottable (Nodule) object from being rendered
        victimLabel.ref.removeFromLayers(layers);
        this.hasUnsavedNodules = true;
      }
    },
    moveLabel(move: { labelId: number; location: Vector3 }): void {
      // labelMoverVisitor.setNewLocation(move.location);
      // const pos = seLabels.findIndex(x => x.id === move.labelId);
      // seLabels[pos].accept(labelMoverVisitor);
    },

    addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
      expressions.push(angleMarker);
      seAngleMarkers.push(angleMarker);
      seNodules.push(angleMarker);
      angleMarker.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removeAngleMarkerAndExpression(angleMarkerId: number): void {
      const angleMarkerPos = seAngleMarkers.findIndex(
        x => x.id === angleMarkerId
      );
      const pos2 = seNodules.findIndex(x => x.id === angleMarkerId);
      const pos3 = expressions.findIndex(x => x.id === angleMarkerId);
      if (angleMarkerPos >= 0) {
        /* victim angleMarker is found */
        const victimAngleMarker: SEAngleMarker = seAngleMarkers[angleMarkerPos];
        // when removing expressions that have effects on the labels, we must set those label display arrays to empty
        if (victimAngleMarker.label) {
          victimAngleMarker.label.ref.value = [];
        }
        victimAngleMarker.ref.removeFromLayers();
        // victimCircle.removeSelfSafely();
        seAngleMarkers.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
        seNodules.splice(pos2, 1);
        expressions.splice(pos3, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addParametric(parametric: SEParametric): void {
      seParametrics.push(parametric);
      seNodules.push(parametric);
      let ptr: Parametric | null = parametric.ref;
      while (ptr) {
        ptr.addToLayers(layers);
        ptr = ptr.next;
      }
      this.hasUnsavedNodules = true;
    },

    removeParametric(parametricId: number): void {
      const parametricPos = seParametrics.findIndex(x => x.id === parametricId);
      const pos2 = seNodules.findIndex(x => x.id === parametricId);
      if (parametricPos >= 0) {
        /* victim line is found */
        const victimParametric: SEParametric = seParametrics[parametricPos];
        let ptr: Parametric | null = victimParametric.ref;
        while (ptr !== null) {
          ptr.removeFromLayers();
          ptr = ptr.next;
        }
        // victimParametric.removeSelfSafely();
        seParametrics.splice(parametricPos, 1); // Remove the parametric from the list
        seNodules.splice(pos2, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addPolygonAndExpression(polygon: SEPolygon): void {
      expressions.push(polygon);
      sePolygons.push(polygon);
      seNodules.push(polygon);
      polygon.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
    },

    removePolygonAndExpression(polygonId: number): void {
      const polygonPos = sePolygons.findIndex(x => x.id === polygonId);
      const pos2 = seNodules.findIndex(x => x.id === polygonId);
      const pos3 = expressions.findIndex(x => x.id === polygonId);
      if (polygonPos >= 0) {
        /* victim polygon is found */
        const victimPolygon: SEPolygon = sePolygons[polygonPos];
        // when removing expressions that have effects on the labels, we must set those label display arrays to empty
        if (victimPolygon.label) {
          victimPolygon.label.ref.value = [];
        }
        victimPolygon.ref.removeFromLayers();
        sePolygons.splice(polygonPos, 1); // Remove the polygon from the list
        seNodules.splice(pos2, 1);
        expressions.splice(pos3, 1);
        this.hasUnsavedNodules = true;
      }
    },
    addExpression(measurement: SEExpression): void {
      expressions.push(measurement);
      seNodules.push(measurement);
      this.hasUnsavedNodules = true;
    },
    removeExpression(measId: number): void {
      const pos = expressions.findIndex(x => x.id === measId);
      const pos2 = seNodules.findIndex(x => x.id === measId);
      if (pos >= 0) {
        // const victimSegment = this.measurements[pos];
        expressions.splice(pos, 1);
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
      tmpMatrix.copy(rotationMat);
      inverseTotalRotationMatrix.multiply(tmpMatrix.getInverse(tmpMatrix));
      // rotationVisitor.setTransform(rotationMat);
      // // apply the rotation to the line, segments, labels, then points. (Circles and ellipses are determined by their parent points so no need to update them)
      // seLines.forEach((m: SELine) => {
      //   m.accept(rotationVisitor); // Does no updating of the display
      // });
      // seSegments.forEach((s: SESegment) => {
      //   s.accept(rotationVisitor); // Does no updating of the display
      // });
      // seLabels.forEach((l: SELabel) => {
      //   l.accept(rotationVisitor); // Does no updating of the display
      // });
      // sePoints.forEach((p: SEPoint) => {
      //   p.accept(rotationVisitor); // Does no updating of the display
      // });
      // seParametrics.forEach((para: SEParametric) => {
      //   para.accept(rotationVisitor); //update the display because the parametric do not depend on any other geometric objects
      // });
      // now do the update of the free points so that display is correct
      sePoints.forEach((p: SEPoint) => {
        if (p.isFreeToMove()) {
          p.markKidsOutOfDate(); // so this does a topological sort and update is only executed once on each point
          p.update();
        }
      });
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
      seNodules.forEach((p: SENodule) => {
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
    sePoints: (): Array<SEPoint> => sePoints,
    seLines: (): Array<SELine> => seLines,
    seCircles: (): Array<SECircle> => seCircles,
    seSegments: (): Array<SESegment> => seSegments,
    seEllipses: (): Array<SEEllipse> => seEllipses,
    seLabels: (): Array<SELabel> => seLabels,
    seAngleMarkers: (): Array<SEAngleMarker> => seAngleMarkers,
    seParametrics: (): Array<SEParametric> => seParametrics,
    sePolygons: (): Array<SEPolygon> => sePolygons,
    expressions: (): Array<SEExpression> => expressions,
    selectedSENodules: (): Array<SENodule> => selectedSENodules,
    temporaryNodules: (): Array<Nodule> => temporaryNodules,
    oldStyleSelections: (): Array<SENodule> => oldSelections,
    initialStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      initialStyleStatesMap,
    defaultStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      defaultStyleStatesMap,
    hasObjects(): boolean {
      return sePoints.length > 0;
    },
    hasNoAntipode(state: PiniaAppState): (_: SEPoint) => boolean {
      return (testPoint: SEPoint): boolean => {
        // create the antipode location vector
        tmpVector.copy(testPoint.locationVector).multiplyScalar(-1);
        // search for the antipode location vector
        const ind = sePoints.findIndex(p => {
          return tmpVector.equals(p.locationVector);
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
          const ind2 = sePoints.findIndex((p, index) => {
            if (index <= ind) {
              // ignore the entries in sePoint upto index ind, because they have already been searched
              return false;
            } else {
              return tmpVector.equals(p.locationVector);
            }
          });
          // the -1*testPoint.location appears twice!
          if (ind2 >= 0) {
            return false;
          }

          if (sePoints[ind] instanceof SEIntersectionPoint) {
            if (!(sePoints[ind] as SEIntersectionPoint).isUserCreated) {
              return true; // Case (2)
            } else {
              return false; // Case (1)
            }
          } else {
            return false;
          }
        }
      };
    },
    getSENoduleById(state: PiniaAppState): (_: number) => SENodule | undefined {
      return (id: number): SENodule | undefined => {
        return seNodules.find((z: SENodule) => z.id === id);
      };
    },
    //#region findNearbyGetter
    findNearbySENodules(
      state: PiniaAppState
    ): (_p: Vector3, _s: Two.Vector) => SENodule[] {
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
      state: PiniaAppState
    ): (parent1Name: string, parent2Name?: string) => SEIntersectionPoint[] {
      return (
        parent1Name: string,
        parent2Name?: string
      ): SEIntersectionPoint[] => {
        const intersectionPoints = sePoints
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
      state: PiniaAppState
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
        sePoints.forEach(pt => {
          if (!pt.locationVector.isZero()) {
            avoidVectors.push(pt.locationVector);
          }
        });
        // The intersectionPointList to return
        const intersectionPointList: SEIntersectionReturnType[] = [];
        // Intersect this new line with all old lines
        seLines
          .filter((line: SELine) => line.id !== newLine.id) // ignore self
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
    createAllIntersectionsWithSegment(_: PiniaAppState) {
      return (newSegment: SESegment): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the two parent points of the newLine, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newSegment.startSEPoint.locationVector);
        avoidVectors.push(newSegment.endSEPoint.locationVector);
        sePoints.forEach(pt => {
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
        seSegments
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
      _: PiniaAppState
    ): (_: SECircle) => SEIntersectionReturnType[] {
      return (newCircle: SECircle): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the two parent points of the newLine, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newCircle.centerSEPoint.locationVector);
        avoidVectors.push(newCircle.circleSEPoint.locationVector);
        sePoints.forEach(pt => {
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
        seCircles
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
      _: PiniaAppState
    ): (_: SEEllipse) => SEIntersectionReturnType[] {
      return (newEllipse: SEEllipse): SEIntersectionReturnType[] => {
        // Avoid creating an intersection where any SEPoint already exists
        const avoidVectors: Vector3[] = [];
        // First add the three parent points of the newEllipse, if they are new, then
        //  they won't have been added to the state.points array yet so add them first
        avoidVectors.push(newEllipse.focus1SEPoint.locationVector);
        avoidVectors.push(newEllipse.focus2SEPoint.locationVector);
        avoidVectors.push(newEllipse.ellipseSEPoint.locationVector);
        sePoints.forEach(pt => {
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
        seEllipses
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
      _: PiniaAppState
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
        sePoints.forEach(pt => {
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
        seParametrics
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

import EventBus from "@/eventHandlers/EventBus";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SECircle } from "@/models/SECircle";
import { SEEllipse } from "@/models/SEEllipse";
import { SEExpression } from "@/models/SEExpression";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SENodule } from "@/models/SENodule";
import { SEParametric } from "@/models/SEParametric";
import { SEPencil } from "@/models/SEPencil";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEPoint } from "@/models/SEPoint";
import { SEPolygon } from "@/models/SEPolygon";
import { SESegment } from "@/models/SESegment";
import { SETransformation } from "@/models/SETransformation";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import { ActionMode, plottableType, SEIntersectionReturnType } from "@/types";
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
import { LabelMoverVisitor } from "@/visitors/LabelMoverVisitor";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { TextMoverVisitor } from "@/visitors/TextMoverVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";
import { Ref, ref } from "vue";
import { defineStore } from "pinia";
import { Matrix4, Vector3 } from "three";
//import Two from "two.js";
import { Group } from "two.js/src/group";
import { computed } from "vue";
import { Vector } from "two.js/src/vector";
import SETTINGS from "@/global-settings";
import Two from "two.js";
import { SEText } from "@/models/SEText";

const sePencils: Array<SEPencil> = [];
const oldSelectedSENodules: Map<number, SENodule> = new Map();
const tmpMatrix = new Matrix4();
const tmpVector = new Vector3();
// const tmpVector1 = new Vector3();

function removeElements(
  removeItems: Array<ActionMode>,
  array: Array<ActionMode>
): void {
  removeItems.forEach(item => {
    const index = array.findIndex(arrayItem => arrayItem === item);
    if (index > -1) {
      array.splice(index, 1);
    }
  });
}

function addElements(
  addItems: Array<ActionMode>,
  array: Array<ActionMode>
): void {
  addItems.forEach(item => {
    const index = array.findIndex(arrayItem => arrayItem === item);
    if (index === -1) {
      array.push(item);
    }
  });
}

// depth first search for cycles among all the line segments
function findCycles(segs: Array<SESegment>): number[] {
  const graph: Array<[number, number]> = [];
  let fakeVertexNum = -1;
  segs.forEach(seg => {
    if (
      graph.some(
        existingSeg =>
          (existingSeg[0] === seg.startSEPoint.id &&
            existingSeg[1] === seg.endSEPoint.id) ||
          (existingSeg[0] === seg.endSEPoint.id &&
            existingSeg[1] === seg.startSEPoint.id)
      )
    ) {
      // there is a second edge between two vertices
      // add a fake vertex and decrement the fake vertex number
      graph.push([seg.startSEPoint.id, fakeVertexNum]);
      graph.push([fakeVertexNum, seg.endSEPoint.id]);
      fakeVertexNum -= 1;
    } else {
      graph.push([seg.startSEPoint.id, seg.endSEPoint.id]);
    }
  });
  //console.debug(`graph length ${graph.length} graph ${graph}`);
  const cycles: Array<number[]> = [];
  const cycleLengths: number[] = [];

  function findNewCycles(path: number[]): void {
    const start_node = path[0];
    let next_node: null | number = null;
    let sub = [];
    //visit each edge and each node of each edge
    for (const edge of graph) {
      const node1 = edge[0];
      const node2 = edge[1];
      if (start_node === node1 || start_node == node2) {
        if (node1 == start_node) {
          next_node = node2;
        } else {
          next_node = node1;
        }
        if (!visited(next_node, path)) {
          // # neighbor node not on path yet
          sub = [next_node];
          sub.push(...path); // sub.extend(path)
          // # explore extended path
          findNewCycles(sub);
        } else if (path.length > 2 && next_node === path[path.length - 1]) {
          // # cycle found
          const p = rotate_to_smallest(path);
          const inv = invert(p);
          if (isNew(p) && isNew(inv)) {
            //console.debug(`new cycle added ${p}`);
            cycles.push(p);
          }
        }
      }
    }
  }

  function invert(path: number[]): number[] {
    const returnPath: number[] = [];
    path.forEach(num => returnPath.unshift(num));
    return rotate_to_smallest(returnPath);
  }

  // rotate cycle path such that it begins with the smallest node
  function rotate_to_smallest(path: number[]): number[] {
    const min = Math.min(...path);
    const minIndex = path.findIndex(ind => ind === min);
    return path.rotate(minIndex);
  }

  function isNew(path: number[]): boolean {
    if (path.length === 0) {
      return false; // empty paths are not new
    }
    return cycles.every(cycle => {
      if (cycle.length !== path.length) {
        // the length of the cycle and path are different so the cycle and path are different
        return true;
      } else {
        const startIndex = cycle.findIndex(num => num === path[0]);
        if (startIndex === -1) {
          // the start of the path is not in the cycle so the cycle and path are different
          return true;
        } else {
          let theSame = true;
          path.forEach((num, ind) => {
            let checkIndex = ind + startIndex;
            if (checkIndex >= path.length) {
              checkIndex = checkIndex - path.length;
            }
            theSame = theSame && num === cycle[checkIndex];
          });
          return !theSame;
        }
      }
    });
    //     return not path in cycles
  }
  function visited(nodeId: number, path: number[]) {
    return path.includes(nodeId);
  }

  for (const edge of graph) {
    //console.debug(`examine edge ${edge}`);
    for (const node of edge) {
      //console.debug(`start with node ${node}`);
      findNewCycles([node]);
    }
  }
  for (const c of cycles) {
    //console.debug(`cycle ${c}`);
    // the filter removes any fake vertices (which have negative value) in the cycle
    cycleLengths.push(c.filter(num => num > -1).length);
  }
  //console.debug(`cycle lengths:`, cycleLengths);
  return cycleLengths;
  // from https://stackoverflow.com/questions/12367801/finding-all-cycles-in-undirected-graphs#:~:text=The%20standard%20baseline%20algorithm%20for,be%20part%20of%20the%20tree.
  // graph = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 6], [4, 6], [8, 7], [8, 9], [9, 7]]
  // cycles = []

  // def main():
  //     global graph
  //     global cycles
  //     for edge in graph:
  //         for node in edge:
  //             findNewCycles([node])
  //     for cy in cycles:
  //         path = [str(node) for node in cy]
  //         s = ",".join(path)
  //         print(s)

  // def findNewCycles(path):
  //     start_node = path[0]
  //     next_node= None
  //     sub = []

  //     #visit each edge and each node of each edge
  //     for edge in graph:
  //         node1, node2 = edge
  //         if start_node in edge:
  //                 if node1 == start_node:
  //                     next_node = node2
  //                 else:
  //                     next_node = node1
  //                 if not visited(next_node, path):
  //                         # neighbor node not on path yet
  //                         sub = [next_node]
  //                         sub.extend(path)
  //                         # explore extended path
  //                         findNewCycles(sub);
  //                 elif len(path) > 2  and next_node == path[-1]:
  //                         # cycle found
  //                         p = rotate_to_smallest(path);
  //                         inv = invert(p)
  //                         if isNew(p) and isNew(inv):
  //                             cycles.append(p)

  // def invert(path):
  //     return rotate_to_smallest(path[::-1])

  // #  rotate cycle path such that it begins with the smallest node
  // def rotate_to_smallest(path):
  //     n = path.index(min(path))
  //     return path[n:]+path[:n]

  // def isNew(path):
  //     return not path in cycles

  // def visited(node, path):
  //     return node in path
}

// Search the segments for the longest closed chain and return its length
// this is only called if there are two or more segments in seSegments
function findClosedSegmentChainLength(segmentArr: Array<SESegment>): number[] {
  const maxChainLengths: number[] = [];
  segmentArr.forEach(startSegment => {
    // Check for chains starting with startSegment
    // We must do this for all segments because of P like arrangements of line segments
    // For example
    //    p1p2 to p2p3 to p3p4 to p4p2
    // contains a chain of length three
    const unCheckedSegments: Array<SESegment> = [];
    segmentArr.forEach(seg => {
      // add all segments expect the start to the unchecked list
      if (seg.name !== startSegment.name) {
        unCheckedSegments.push(seg);
      }
    });

    let initialSegment: SESegment | undefined = startSegment;

    // search for chains that contain the initial segment
    while (initialSegment !== undefined) {
      let lengthOfChain = 1;
      const chainStartPointName = initialSegment.startSEPoint.name;
      let freeEndPointName = initialSegment.endSEPoint.name;
      let anotherSegmentInChainFound = true;
      while (anotherSegmentInChainFound) {
        anotherSegmentInChainFound = false;
        // search for the next element in the chain among the unchecked segments
        for (const potentialNextSegment of unCheckedSegments) {
          if (potentialNextSegment.startSEPoint.name === freeEndPointName) {
            lengthOfChain += 1;
            anotherSegmentInChainFound = true;
            if (potentialNextSegment.endSEPoint.name === chainStartPointName) {
              // the chain is closed so add to the max length array
              maxChainLengths.push(lengthOfChain);
              anotherSegmentInChainFound = false; //stop searching for more segments in this chain because it is closed
              break;
            } else {
              // the chain is open, remove the potential segment from the unchecked and update freeEndPoint and break the search of unchecked segments
              freeEndPointName = potentialNextSegment.endSEPoint.name;
              const index = unCheckedSegments.findIndex(
                seg => seg.name === potentialNextSegment.name
              );
              if (index > -1) {
                unCheckedSegments.splice(index, 1);
              }
              break;
            }
          } else if (
            potentialNextSegment.endSEPoint.name === freeEndPointName
          ) {
            lengthOfChain += 1;
            anotherSegmentInChainFound = true;
            if (
              potentialNextSegment.startSEPoint.name === chainStartPointName
            ) {
              // the chain is closed so add to the max length array
              maxChainLengths.push(lengthOfChain);
              anotherSegmentInChainFound = false; //stop searching for more segments in this chain because it is closed
              break;
            } else {
              // the chain is open, remove the potential segment from the unchecked and update freeEndPoint and break the search of unchecked segments
              freeEndPointName = potentialNextSegment.startSEPoint.name;
              const index = unCheckedSegments.findIndex(
                seg => seg.name === potentialNextSegment.name
              );
              if (index > -1) {
                unCheckedSegments.splice(index, 1);
              }
              break;
            }
          }
          // the potential segment doesn't connect to the existing chain continue searching uncheck segments
        }
      }
      // restart the search for chains with the next unchecked segment if any
      initialSegment = unCheckedSegments.pop(); // check for chains starting with initialSegment
    }
  });
  return maxChainLengths;
}

// WARNING: Making the following variables reactive caused runtime error in SphereFrame.vue
/* BEGIN Non-Reactive variables */
let layers: Array<Group> = [];
const seAngleMarkerMap: Map<number, SEAngleMarker> = new Map();
const seCircleMap: Map<number, SECircle> = new Map();
const seEllipseMap: Map<number, SEEllipse> = new Map();
const seLabelMap: Map<number, SELabel> = new Map();
const seLineMap: Map<number, SELine> = new Map();
const seParametricMap: Map<number, SEParametric> = new Map();
const sePointMap: Map<number, SEPoint> = new Map();
const sePolygonMap: Map<number, SEPolygon> = new Map();
const seSegmentMap: Map<number, SESegment> = new Map();
const seExpressionMap: Map<number, SEExpression> = new Map();
const seTransformationMap: Map<number, SETransformation> = new Map();
const seTextMap: Map<number, SEText> = new Map();

/* END Non-Reactive variables */

export const useSEStore = defineStore("se", () => {
  const twoInstance: Ref<Two|null> = ref(null)
  const isEarthMode = ref(false);
  const actionMode: Ref<ActionMode> = ref<ActionMode>("rotate");
  const previousActionMode: Ref<ActionMode> = ref("rotate");
  // activeToolName: "RotateDisplayedName", // the corresponding I18N key of actionMode
  // buttonSelection: {},
  // previousActiveToolName: "",
  const svgCanvas: Ref<HTMLDivElement | null> = ref(null);
  const hasUnsavedNodules = ref(false);
  const zoomMagnificationFactor = ref(1); // the initial zoom factor
  const zoomTranslation: Ref<Array<number>> = ref([0, 0]); // [x , y]
  const canvasWidth = ref(0);
  const canvasHeight = ref(0);
  const seNodules: Ref<Array<SENodule>> = ref([]);
  const temporaryNodules: Ref<Array<Nodule>> = ref([]);

  const sePointIds: Ref<Array<number>> = ref([]);
  const sePoints = computed((): SEPoint[] =>
    sePointIds.value.map(id => sePointMap.get(id)!)
  );
  const seLineIds: Ref<Array<number>> = ref([]);
  const seLines = computed((): SELine[] =>
    seLineIds.value.map(id => seLineMap.get(id)!)
  );
  const seSegmentIds: Ref<Array<number>> = ref([]);
  const seSegments = computed((): SESegment[] =>
    seSegmentIds.value.map(id => seSegmentMap.get(id)!)
  );
  const seCircleIds: Ref<Array<number>> = ref([]);
  const seCircles = computed((): SECircle[] =>
    seCircleIds.value.map(id => seCircleMap.get(id)!)
  );
  const seEllipseIds: Ref<Array<number>> = ref([]);
  const seEllipses = computed((): SEEllipse[] =>
    seEllipseIds.value.map(id => seEllipseMap.get(id)!)
  );
  const seParametricIds: Ref<Array<number>> = ref([]);
  const seParametrics = computed((): SEParametric[] =>
    seParametricIds.value.map(id => seParametricMap.get(id)!)
  );

  const sePolygonIds: Ref<Array<number>> = ref([]);
  const sePolygons = computed((): SEPolygon[] =>
    sePolygonIds.value.map(id => sePolygonMap.get(id)!)
  );

  const seLabelIds: Ref<Array<number>> = ref([]);
  const seLabels = computed((): SELabel[] =>
    seLabelIds.value.map(id => seLabelMap.get(id)!)
  );

  const seExpressionIds: Ref<Array<number>> = ref([]);
  const seExpressions = computed((): SEExpression[] =>
    seExpressionIds.value.map(id => seExpressionMap.get(id)!)
  );

  const seAngleMarkerIds: Ref<Array<number>> = ref([]);
  const seAngleMarkers = computed((): SEAngleMarker[] =>
    seAngleMarkerIds.value.map(id => seAngleMarkerMap.get(id)!)
  );
  const seTransformationIds: Ref<Array<number>> = ref([]);
  const seTransformations = computed((): SETransformation[] =>
    seTransformationIds.value.map(id => seTransformationMap.get(id)!)
  );

  const seTextIds: Ref<Array<number>> = ref([]);
  const seText = computed((): SEText[] =>
        seTextIds.value.map(id => seTextMap.get(id)!)
  );

  const selectedSENodules: Ref<Array<SENodule>> = ref([]);
  const oldSelectedSENoduleIds: Ref<Array<number>> = ref([]);
  // const styleSavedFromPanel: Ref<StyleCategory> = ref(StyleCategory.Label)
  const disabledTools: Ref<Array<ActionMode>> = ref([]);
  const inverseTotalRotationMatrix: Ref<Matrix4> = ref(new Matrix4()); //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere

  const hasObjects = computed(
    () =>
      sePointIds.value.length > 0 ||
      seCircles.value.length > 0 ||
      seSegmentIds.value.length > 0
  ); // SELatitude and SE Longitude are not constructed with SEPoints that are put into the object tree

  const twojsLayers = computed(() => layers);

  function init(): void {
    actionMode.value = "rotate";
    // this.activeToolName = "RotateDisplayedName";
    // Do not clear the layers array!
    // Replace clear() with splice(0). Since clear() is an extension function
    // Update to these arrays are not automatically picked up by VueJS
    seAngleMarkerIds.value.splice(0);
    seAngleMarkerMap.clear();
    seCircleIds.value.splice(0);
    seCircleMap.clear();
    seEllipseIds.value.splice(0);
    seEllipseMap.clear();
    seExpressionIds.value.splice(0);
    seExpressionMap.clear();
    seLabelIds.value.splice(0);
    seLabelMap.clear();
    selectedSENodules.value.splice(0);
    seLineIds.value.splice(0);
    seLineMap.clear();
    seNodules.value.splice(0);
    seParametricIds.value.splice(0);
    seParametricMap.clear();
    sePencils.splice(0);
    sePointIds.value.splice(0);
    sePointMap.clear();
    sePolygonIds.value.splice(0);
    sePolygonMap.clear();
    seSegmentIds.value.splice(0);
    seSegmentMap.clear();
    seTransformationIds.value.splice(0);
    seTransformationMap.clear();
    seTextIds.value.splice(0);
    seTextMap.clear();
    oldSelectedSENodules.clear();
    oldSelectedSENoduleIds.value.splice(0);
    // intersections.splice(0);
    // initialStyleStates.splice(0);
    // defaultStyleStates.splice(0);
    hasUnsavedNodules.value = false;
    temporaryNodules.value.splice(0);
    inverseTotalRotationMatrix.value.identity();
    isEarthMode.value = false;

    // Note by Hans (2022-01-05): this.init() has been moved from App.vue to SphereFrame.vue

    // Do not clear the temporaryNodules array
    // because the constructors of the tools (handlers) place the temporary Nodules
    // in this array *before* the this.init is called in App.vue mount.
  }
  function setLayers(two: Two, grp: Array<Group>): void {
    twoInstance.value = two
    // layers.splice(0);
    // layers.push(...grp);
    layers = grp;
  }
  function updateTwoJS() {
    twoInstance.value!.update()
  }

  function setCanvas(c: HTMLDivElement | null): void {
    console.debug("Set canvas in SE store");
    svgCanvas.value = c;
  }
  function setCanvasDimension(w: number, h: number): void {
    canvasWidth.value = w;
    canvasHeight.value = h;
  }
  function setRotationMatrix(mat: Matrix4): void {
    inverseTotalRotationMatrix.value.copy(mat);
  }
  // setSphereRadius(r: number): void {
  //   // TODO
  // },

  // setButton(buttonSelection: ToolButtonType): void {
  //   this.buttonSelection = buttonSelection;
  // },

  function setActionMode(mode: ActionMode): void {
    // console.debug("Changing action mode in SE store to", mode);
    // zoomFit is a one-off tool, so the previousActionMode should never be "zoomFit" (avoid infinite loops too!)
    if (
      !(actionMode.value === "zoomFit" || actionMode.value === "iconFactory")
    ) {
      previousActionMode.value = actionMode.value;
      // this.previousActiveToolName = this.activeToolName;
    }
    actionMode.value = mode;
    // this.activeToolName = mode.name;
  }
  function revertActionMode(): void {
    actionMode.value = previousActionMode.value;
    // this.activeToolName = this.previousActiveToolName;
  }
  function removeAllFromLayers(): void {
    seAngleMarkers.value.forEach((x: SEAngleMarker) =>
      x.ref.removeFromLayers()
    );
    seCircles.value.forEach((x: SECircle) => x.ref.removeFromLayers());
    seEllipses.value.forEach((x: SEEllipse) => x.ref.removeFromLayers());
    seLines.value.forEach((x: SELine) => x.ref.removeFromLayers());
    sePoints.value.forEach((x:SEPoint) => x.ref.removeFromLayers())
    seSegments.value.forEach((x: SESegment) => x.ref.removeFromLayers());
    sePolygons.value.forEach((x: SEPolygon) => x.ref.removeFromLayers());
    seParametrics.value.forEach((x: SEParametric) => {
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
    seLabels.value.forEach((x:SELabel) => x.ref.removeFromLayers(layers));
  }
  // Update the display of all free SEPoints to update the entire display
  function updateDisplay(): void {
    seNodules.value
      .filter(obj => obj.isFreeToMove())
      .forEach(obj => {
        // First mark the kids out of date so that the update method does a topological sort
        obj.markKidsOutOfDate();
        obj.update();
        // console.log("name", obj.name, "show", obj.showing, "exist", obj.exists);
      });
  }
  //#region magnificationUpdate
  function fitZoomMagnificationFactor() {
    const smallestDimension = Math.min(
      canvasHeight.value - 32,
      canvasHeight.value
    );
    const desiredFactor =
      smallestDimension / (2 * SETTINGS.boundaryCircle.radius);
    setZoomMagnificationFactor(desiredFactor);
  }

  function scaleZoomMagnificationFactorBy(factor: number) {
    EventBus.fire("magnification-updated", {
      factor
    });
    zoomMagnificationFactor.value /= factor;
  }

  function setZoomMagnificationFactor(mag: number): void {
    EventBus.fire("magnification-updated", {
      factor: zoomMagnificationFactor.value / mag
    });
    zoomMagnificationFactor.value = mag;
  }
  //#endregion magnificationUpdate
  function setZoomTranslation(vec: number[]): void {
    for (let i = 0; i < 2; i++) {
      zoomTranslation.value[i] = vec[i];
    }
  }
  //#region addPoint
  function addPoint(point: SEPoint): void {
    // console.log("Point Added ", point.name)
    sePointIds.value.push(point.id);
    sePointMap.set(point.id, point);
    seNodules.value.push(point);
    point.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("point");
  }
  //#endregion addPoint
  function removePoint(pointId: number): void {
    const victimPoint = sePointMap.get(pointId);
    if (victimPoint) {
      victimPoint.ref.removeFromLayers();
      sePointMap.delete(pointId);
      const pos = sePointIds.value.findIndex(z => z === pointId);
      sePointIds.value.splice(pos, 1);
      const pos2 = seNodules.value.findIndex((x: SENodule) => x.id === pointId);
      seNodules.value.splice(pos2, 1);
      hasUnsavedNodules.value = true;
      updateDisabledTools("point");
    }
  }
  function movePoint(move: { pointId: number; location: Vector3 }): void {
    const pointMoverVisitor = new PointMoverVisitor();
    pointMoverVisitor.setNewLocation(move.location);
    const aPoint = sePointMap.get(move.pointId);
    if (aPoint) {
      aPoint.accept(pointMoverVisitor);
    }
  }
  function addLine(line: SELine): void {
    seLineIds.value.push(line.id);
    seLineMap.set(line.id, line);
    seNodules.value.push(line as SENodule);
    line.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("line");
  }
  function removeLine(lineId: number): void {
    const victimLine = seLineMap.get(lineId);
    if (victimLine) {
      victimLine.ref.removeFromLayers();
      const pos = seLineIds.value.findIndex(z => z === lineId);
      const pos2 = seNodules.value.findIndex(x => x.id === lineId);
      seLineIds.value.splice(pos, 1); // Remove the line from the list
      seNodules.value.splice(pos2, 1);
      seLineMap.delete(lineId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("line");
    }
  }
  function addCircle(circle: SECircle): void {
    seCircleIds.value.push(circle.id);
    seCircleMap.set(circle.id, circle);
    seNodules.value.push(circle);
    circle.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("circle");
  }
  function removeCircle(circleId: number): void {
    const victimCircle = seCircleMap.get(circleId);
    if (victimCircle) {
      /* victim line is found */
      victimCircle.ref.removeFromLayers();
      const pos = seCircleIds.value.findIndex(c => c === circleId);
      const pos2 = seNodules.value.findIndex(x => x.id === circleId);
      seCircleIds.value.splice(pos, 1); // Remove the circle from the list
      seNodules.value.splice(pos2, 1);
      seCircleMap.delete(circleId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("circle");
    }
  }
  function addTransformation(transformation: SETransformation): void {
    seTransformationIds.value.push(transformation.id);
    seTransformationMap.set(transformation.id, transformation);
    seNodules.value.push(transformation);
    hasUnsavedNodules.value = true;
    updateDisabledTools("transformation");
  }
  function removeTransformation(transformationId: number): void {
    const transformationPos = seTransformationIds.value.findIndex(
      t => t === transformationId
    );
    if (transformationPos >= 0) {
      /* victim line is found */
      const pos = seNodules.value.findIndex(x => x.id === transformationId);
      seTransformationIds.value.splice(transformationPos, 1); // Remove the transformation from the list
      seTransformationMap.delete(transformationId);
      seNodules.value.splice(pos, 1);
      hasUnsavedNodules.value = true;
      updateDisabledTools("transformation");
    }
  }
  function addSegment(segment: SESegment): void {
    // console.log("seg id", segment.id)
    seSegmentIds.value.push(segment.id);
    seSegmentMap.set(segment.id, segment);
    seNodules.value.push(segment);
    segment.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("segment");
  }

  function removeSegment(segId: number): void {
    const victimSegment = seSegmentMap.get(segId);
    if (victimSegment) {
      const pos = seSegmentIds.value.findIndex(s => s === segId);
      const pos2 = seNodules.value.findIndex(x => x.id === segId);
      victimSegment.ref.removeFromLayers();
      seSegmentIds.value.splice(pos, 1);
      seNodules.value.splice(pos2, 1);
      hasUnsavedNodules.value = true;
      updateDisabledTools("segment");
    }
  }
  function addEllipse(ellipse: SEEllipse): void {
    seEllipseIds.value.push(ellipse.id);
    seEllipseMap.set(ellipse.id, ellipse);
    seNodules.value.push(ellipse);
    ellipse.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("ellipse");
  }
  function removeEllipse(ellipseId: number): void {
    const victim = seEllipseMap.get(ellipseId);
    if (victim) {
      /* victim line is found */
      victim.ref.removeFromLayers();
      const ellipsePos = seEllipseIds.value.findIndex(z => z === ellipseId);
      const pos2 = seNodules.value.findIndex(x => x.id === ellipseId);
      seEllipseIds.value.splice(ellipsePos, 1); // Remove the ellipse from the list
      seNodules.value.splice(pos2, 1);
      seEllipseMap.delete(ellipseId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("ellipse");
    }
  }
  function addLabel(label: SELabel): void {
    seLabelIds.value.push(label.id);
    seLabelMap.set(label.id, label);
    seNodules.value.push(label);
    label.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    // this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
  }
  function removeLabel(labelId: number): void {
    const victimLabel = seLabelMap.get(labelId);

    if (victimLabel) {
      // Remove the associated plottable (Nodule) object from being rendered
      victimLabel.ref.removeFromLayers(twojsLayers.value);
      const pos = seLabelIds.value.findIndex(x => x === labelId);
      const pos2 = seNodules.value.findIndex((x: SENodule) => x.id === labelId);
      seLabelMap.delete(labelId);
      seLabelIds.value.splice(pos, 1);
      seNodules.value.splice(pos2, 1);
      hasUnsavedNodules.value = true;
      //this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
    }
  }
  function moveLabel(move: { labelId: number; location: Vector3 }): void {
    const labelMoverVisitor = new LabelMoverVisitor();
    labelMoverVisitor.setNewLocation(move.location);
    const aLabel = seLabelMap.get(move.labelId);
    if (aLabel) aLabel.accept(labelMoverVisitor);
  }
  function addText(text: SEText): void {
    seTextIds.value.push(text.id);
    seTextMap.set(text.id, text);
    seNodules.value.push(text);
    text.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    // this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
  }
  function moveText(move: { textId: number; location: Vector3 }): void {
    console.log(`se.moveText(): textId: ${move.textId}, location: ${move.location.toFixed(3)}`);
    const textMoverVisitor = new TextMoverVisitor();
    textMoverVisitor.setNewLocation(move.location);
    const aText = seTextMap.get(move.textId);
    console.log(`se.moveText() aText = ${aText?.id}, ${aText?.locationVector.toFixed(3)}`);
    if (aText) aText.accept(textMoverVisitor);
  }
  function changeText(change: { textId: number; newText: string }): void {
    console.log(`se.changeText(): textId: ${change.textId}, newText: "${change.newText}"`);

    // Retrieve the SEText object from the map using textId
    const aText = seTextMap.get(change.textId);

    console.log(`se.changeText() aText = ${aText?.id}, currentText: "${aText?.getText()}"`);

    if (aText) {
      // Change the text content of the SEText object
      aText.setText(change.newText);

      // Log the change operation
      console.log(`se.changeText(): Text content updated for textId: ${change.textId}`);
    } 
  }
//   function changeText(text: SEText): void {
//     if (seTextMap.has(text.id)) {
//         // Update the text in the map
//         seTextMap.set(text.id, text);


//         // Find and update the corresponding text in seNodules array
//         const index = seNodules.value.findIndex((nodule) => nodule.id === text.id);
//         if (index !== -1) {
//             seNodules.value[index] = text;
//         }
//         // Mark as unsaved
//         hasUnsavedNodules.value = true;
//     } else {
//         console.error(`Text with ID ${text.id} does not exist.`);
//     }
// }
  function removeText(textId: number): void {
    const victimText = seTextMap.get(textId);

    if (victimText) {
      // Remove the associated plottable (Nodule) object from being rendered
      victimText.ref.removeFromLayers(twojsLayers.value);
      const pos = seTextIds.value.findIndex(x => x === textId);
      const pos2 = seNodules.value.findIndex((x: SENodule) => x.id === textId);
      seTextMap.delete(textId);
      seTextIds.value.splice(pos, 1);
      seNodules.value.splice(pos2, 1);
      hasUnsavedNodules.value = true;
      //this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
    }
  }
  function addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
    seExpressionIds.value.push(angleMarker.id);
    seExpressionMap.set(angleMarker.id, angleMarker);
    seAngleMarkerIds.value.push(angleMarker.id);
    seAngleMarkerMap.set(angleMarker.id, angleMarker);
    seNodules.value.push(angleMarker);
    angleMarker.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("angleMarker");
  }
  function removeAngleMarkerAndExpression(angleMarkerId: number): void {
    const victim = seAngleMarkerMap.get(angleMarkerId);
    if (victim) {
      /* victim angleMarker is found */
      victim.ref.removeFromLayers();
      const angleMarkerPos = seAngleMarkerIds.value.findIndex(
        z => z === angleMarkerId
      );
      const pos2 = seNodules.value.findIndex(x => x.id === angleMarkerId);
      const pos3 = seExpressionIds.value.findIndex(z => z === angleMarkerId);
      // when removing expressions that have effects on the labels, we must set those label display arrays to empty
      if (victim.label) {
        victim.label.ref.value = [];
      }
      // victimCircle.removeSelfSafely();
      seAngleMarkerIds.value.splice(angleMarkerPos, 1); // Remove the angleMarker from the list
      seNodules.value.splice(pos2, 1);
      seExpressionIds.value.splice(pos3, 1);
      seExpressionMap.delete(angleMarkerId);
      seAngleMarkerMap.delete(angleMarkerId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("angleMarker");
    }
  }
  function addParametric(parametric: SEParametric): void {
    seParametricIds.value.push(parametric.id);
    seParametricMap.set(parametric.id, parametric);
    seNodules.value.push(parametric);
    parametric.ref?.addToLayers(layers);
    // let ptr: Parametric | null = parametric.ref;
    // while (ptr) {
    //   ptr.addToLayers(layers);
    //   ptr = ptr.next;
    // }
    hasUnsavedNodules.value = true;
    updateDisabledTools("parametric");
  }

  function removeParametric(parametricId: number): void {
    const victim = seParametricMap.get(parametricId);
    if (victim) {
      /* victim line is found */
      const pos2 = seNodules.value.findIndex(x => x.id === parametricId);
      const parametricPos = seParametricIds.value.findIndex(
        z => z === parametricId
      );
      victim.ref?.removeFromLayers();
      // let ptr: Parametric | null = victimParametric.ref;
      // while (ptr !== null) {
      //   ptr.removeFromLayers();
      //   ptr = ptr.next;
      // }
      // victimParametric.removeSelfSafely();
      seParametricIds.value.splice(parametricPos, 1); // Remove the parametric from the list
      seNodules.value.splice(pos2, 1);
      seParametricMap.delete(parametricId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("parametric");
    }
  }
  function addPolygonAndExpression(polygon: SEPolygon): void {
    // console.debug(`add polygon with id ${polygon.id}`);
    seExpressionIds.value.push(polygon.id);
    seExpressionMap.set(polygon.id, polygon);
    sePolygonIds.value.push(polygon.id);
    sePolygonMap.set(polygon.id, polygon);
    seNodules.value.push(polygon);
    polygon.ref.addToLayers(layers);
    hasUnsavedNodules.value = true;
    updateDisabledTools("polygon");
  }
  function removePolygonAndExpression(polygonId: number): void {
    // console.debug(`Remove polygon with id ${polygonId}`);
    const victimPolygon = sePolygonMap.get(polygonId);
    if (victimPolygon) {
      const polygonPos = sePolygonIds.value.findIndex(z => z === polygonId);
      // console.debug(`Polygon found`);
      const pos2 = seNodules.value.findIndex(x => x.id === polygonId);
      const pos3 = seExpressionIds.value.findIndex(exp => exp === polygonId);
      /* victim polygon is found */
      // when removing expressions that have effects on the labels, we must set those label display arrays to empty
      if (victimPolygon.label) {
        victimPolygon.label.ref.value = [];
      }
      victimPolygon.ref.removeFromLayers();
      sePolygonIds.value.splice(polygonPos, 1); // Remove the polygon from the list
      seNodules.value.splice(pos2, 1);
      seExpressionIds.value.splice(pos3, 1);
      seExpressionMap.delete(polygonId);
      sePolygonMap.delete(polygonId);
      hasUnsavedNodules.value = true;
      updateDisabledTools("polygon");
    }
  }
  function addExpression(measurement: SEExpression): void {
    seExpressionIds.value.push(measurement.id);
    seExpressionMap.set(measurement.id, measurement);
    seNodules.value.push(measurement);
    hasUnsavedNodules.value = true;
    updateDisabledTools("expression");
  }
  function removeExpression(measId: number): void {
    const pos = seExpressionIds.value.findIndex(exp => exp === measId);
    if (pos >= 0) {
      const pos2 = seNodules.value.findIndex(x => x.id === measId);
      seExpressionIds.value.splice(pos, 1);
      seExpressionMap.delete(measId);
      seNodules.value.splice(pos2, 1);
      hasUnsavedNodules.value = true;
      updateDisabledTools("expression");
    }
  }
  //#region rotateSphere
  function rotateSphere(rotationMat: Matrix4): void {
    // Update the inverseTotalRotationMatrix. We have a new rotationMat which is transforming by
    //   rotationMat*oldTotalRotationMatrix * VEC
    // so to undo that action we find the inverse which is
    //  inverseTotalRotationMatrix*(inverse of rotationMat)
    tmpMatrix.copy(rotationMat).invert();
    inverseTotalRotationMatrix.value.multiply(tmpMatrix);
    const rotationVisitor = new RotationVisitor();
    rotationVisitor.setTransform(rotationMat);
    const updateCandidates: Array<SENodule> = [];
    // If there are any SE(Latitude/Longitudes) then we need to update the north and south poles so that the
    // those objects update correctly. The north|south pole SEPoint sin SENodule will have been created in the
    //  constructor of SE(Latitude|Longitude) so if there are these objects, the appropriate SEPoint poles will be defined
    if (SENodule.unregisteredSEPointNorthPole !== undefined) {
      const tmpVector = new Vector3();
      tmpVector.copy(SENodule.unregisteredSEPointNorthPole.locationVector); // Copy the old vector location of the static north pole
      tmpVector.applyMatrix4(rotationMat); // Apply the matrix
      SENodule.unregisteredSEPointNorthPole.locationVector = tmpVector; // update the location of the north pole
    }
    if (SENodule.unregisteredSEPointSouthPole !== undefined) {
      const tmpVector = new Vector3();
      tmpVector.copy(SENodule.unregisteredSEPointSouthPole.locationVector); // Copy the old vector location of the static south pole
      tmpVector.applyMatrix4(rotationMat); // Apply the matrix
      SENodule.unregisteredSEPointSouthPole.locationVector = tmpVector; // update the location of the north pole
    }

    function addCandidatesFrom(parent: SENodule) {
      parent.kids.forEach((m: SENodule) => {
        // console.debug(parent.name, "invalidates", m.name);
        if (m.exists) {
          if (m.canUpdateNow()) {
            if (!updateCandidates.find((x: SENodule) => x.name === m.name))
              updateCandidates.push(m);
          } else {
            //console.debug("!!! Dependent ", m.name, " can't be updated now");
          }
        }
      });
    }

    // Begin updating those objects with no parents
    updateCandidates.push(
      ...seNodules.value.filter((p: SENodule) => p.parents.length === 0)
    );
    // console.log(
    //   "Update candidates",
    //   updateCandidates.map(z => z.name).join(", ")
    // );
    while (updateCandidates.length > 0) {
      const target = updateCandidates.shift()!;
      console.log(`target is ${target.name}`);
      const accepted = target.accept(rotationVisitor);
      // console.log(`What's going on with ${target.name}?`, accepted);
      if (!accepted) {
        // console.log(
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
    //}
    // console.debug("<<<<< End rotate sphere update");
  }
  //#endregion rotateSphere
  function clearUnsavedFlag(): void {
    hasUnsavedNodules.value = false;
  }

  function changeBackContrast(newContrast: number) {
    Nodule.setBackStyleContrast(newContrast);
    seNodules.value.forEach(n => {
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function changeGradientFill(useGradientFill: boolean) {
    Nodule.setGradientFill(useGradientFill);
    seNodules.value.forEach(n => {
      n.ref?.stylize(DisplayStyle.ApplyCurrentVariables);
    });
  }

  function changeSegmentNormalVectorArcLength(change: {
    segmentId: number;
    normal: Vector3;
    arcLength: number;
  }): void {
    const segmentNormalArcLengthVisitor = new SegmentNormalArcLengthVisitor();
    segmentNormalArcLengthVisitor.setNewNormal(change.normal);
    segmentNormalArcLengthVisitor.setNewArcLength(change.arcLength);
    const seg = seSegments.value.find(s => s.id === change.segmentId);
    if (seg) {
      seg.accept(segmentNormalArcLengthVisitor);
      // this.seSegments[pos].markKidsOutOfDate();
      // this.seSegments[pos].update();
    }
  }
  function changeLineNormalVector(change: {
    lineId: number;
    normal: Vector3;
  }): void {
    const lineNormalVisitor = new LineNormalVisitor();
    lineNormalVisitor.setNewNormal(change.normal);
    const line = seLines.value.find(z => z.id === change.lineId);
    if (line) {
      line.accept(lineNormalVisitor);
      // seLines[pos].markKidsOutOfDate();
      // seLines[pos].update();
    }
  }
  // These are added to the store so that I can update the size of the temporary objects when there is a resize event.
  function addTemporaryNodule(nodule: Nodule): void {
    nodule.stylize(DisplayStyle.ApplyTemporaryVariables);
    nodule.adjustSize(); //since the tools are created on demand, the size of the canvas and zoom factor will be different so update the size of the temporary plottable
    temporaryNodules.value.push(nodule);
  }
  function updateSelectedSENodules(payload: SENodule[]): void {
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

    console.debug("Current payload", payload);
    if (diffArray(selectedSENodules.value, payload)) {
      // // console.debug("Selected nodules differ");
      // //reset previous selection glowing color to usual
      // selectedSENodules.value.forEach(n => {
      //   n.ref?.setSelectedColoring(false);
      // });
      // // clear the selectedSENodules map and id array
      selectedSENodules.value.splice(0);
      selectedSENodules.value.push(...payload);
      // //set the glowing color to selected
      // selectedSENodules.value.forEach(n => {
      //   n.ref?.setSelectedColoring(true);
      // });
    }
  }
  // function setOldSelection(payload: SENodule[]): void {
  //   // clear the last old selection
  //   oldSelectedSENodules.clear();
  //   oldSelectedSENoduleIds.value.splice(0);
  //   // set the new selection
  //   payload.forEach(seNodule => {
  //     oldSelectedSENoduleIds.value.push(seNodule.id);
  //     oldSelectedSENodules.set(seNodule.id, seNodule);
  //   });
  // }

  // The temporary nodules are added to the store when a handler is constructed, when are they removed? Do I need a removeTemporaryNodule?
  function unglowAllSENodules(): void {
    seNodules.value.forEach(p => {
      if (!p.selected && p.exists) {
        p.glowing = false;
      }
    });
  }
  function updateDisabledTools(
    change: plottableType | "transformation" | "expression"
  ): void {
    switch (change) {
      case "point": {
        // "coordinate",// need one point
        // "pointDistance", // need two points
        const numPoints = sePoints.value.filter(
          pt =>
            !(
              pt instanceof SEAntipodalPoint ||
              pt instanceof SEIntersectionPoint
            ) || pt.isUserCreated
        ).length;
        if (numPoints === 1) {
          removeElements(
            ["coordinate", "pointReflection"],
            disabledTools.value
          );
          addElements(["pointDistance"], disabledTools.value);
        } else if (numPoints > 1) {
          removeElements(
            ["pointDistance", "coordinate", "pointReflection"],
            disabledTools.value
          );
        } else {
          addElements(
            ["pointDistance", "coordinate", "pointReflection"],
            disabledTools.value
          );
        }
        break;
      }
      case "angleMarker": {
        // "angleBisector", // need an angle
        // "nSectLine", // need an angle
        if (seAngleMarkers.value.length > 0) {
          removeElements(["angleBisector", "nSectLine"], disabledTools.value);
        } else {
          addElements(["angleBisector", "nSectLine"], disabledTools.value);
        }
        break;
      }
      case "transformation": {
        // "applyTransformation", // need a transformation
        if (seTransformationMap.size > 0) {
          removeElements(["applyTransformation"], disabledTools.value);
        } else {
          addElements(["applyTransformation"], disabledTools.value);
        }
        break;
      }
      case "circle":
      case "segment":
      case "line":
      case "ellipse":
      case "parametric":
      case "expression": {
        const numCircles = seCircleMap.size;
        const numSegments = seSegmentMap.size;
        const numLines = seLineMap.size;
        const numEllipses = seEllipseMap.size;
        const numParametrics = seParametricMap.size;
        const numExpressions = seExpressionMap.size;

        // "inversion", // need a circle
        if (numCircles > 0) {
          removeElements(["inversion"], disabledTools.value);
        } else {
          addElements(["inversion"], disabledTools.value);
        }

        // "measuredCircle", // need an expression
        if (numExpressions > 0) {
          removeElements(["measuredCircle"], disabledTools.value);
        } else {
          addElements(["measuredCircle"], disabledTools.value);
        }

        // "midpoint", // need a line segment
        // "nSectPoint", // need a line segment
        // "segmentLength", // need a line segment
        if (numSegments > 0) {
          removeElements(
            ["midpoint", "nSectPoint", "segmentLength"],
            disabledTools.value
          );
        } else {
          addElements(
            ["midpoint", "nSectPoint", "segmentLength"],
            disabledTools.value
          );
        }

        // "perpendicular", // need a one dimensional object
        // "pointOnObject", // need a one dimensional object
        // "intersect", // need two one dimensional objects
        if (
          numCircles > 0 ||
          numSegments > 0 ||
          numLines > 0 ||
          numEllipses > 0 ||
          numParametrics > 0
        ) {
          // there is at least one one dimensional
          removeElements(
            ["perpendicular", "pointOnObject"],
            disabledTools.value
          );
          if (
            numCircles + numSegments + numLines + numEllipses + numParametrics >
            1
          ) {
            removeElements(["intersect"], disabledTools.value);
          } else {
            addElements(["intersect"], disabledTools.value);
          }
        } else {
          addElements(
            ["perpendicular", "pointOnObject", "intersect"],
            disabledTools.value
          );
        }

        // "tangent", // need a non-straight one dimensional
        if (numCircles > 0 || numEllipses > 0 || numParametrics > 0) {
          removeElements(["tangent"], disabledTools.value);
        } else {
          addElements(["tangent"], disabledTools.value);
        }

        // "rotation", //need a line segment, circle or expression
        if (numSegments + numCircles + numExpressions > 0) {
          removeElements(["rotation"], disabledTools.value);
        } else {
          addElements(["rotation"], disabledTools.value);
        }

        // "reflection", // need a line or segment
        if (numSegments + numLines > 0) {
          removeElements(["reflection"], disabledTools.value);
        } else {
          addElements(["reflection"], disabledTools.value);
        }

        // "translation" //need a line segment or (expression and (line or segment))
        if (
          numSegments > 0 ||
          (numExpressions > 0 && (numLines > 0 || numSegments > 0))
        ) {
          removeElements(["translation"], disabledTools.value);
        } else {
          addElements(["translation"], disabledTools.value);
        }

        // "measurePolygon", // need a closed chain of four or more line segments or closed chain of two segments both of length pi
        // "measureTriangle", // need a closed chain of three or more line segments
        if (numSegments > 1) {
          //console.log("find cycles", findCycles());
          const lengths = findCycles(seSegments.value); //findClosedSegmentChainLength();
          //console.debug(`number of cycles ${lengths.length}`);
          if (lengths.length === 0) {
            addElements(
              ["measurePolygon", "measureTriangle"],
              disabledTools.value
            );
          }
          if (lengths.includes(2) || Math.max(...lengths) > 3) {
            removeElements(["measurePolygon"], disabledTools.value);
          } else {
            addElements(["measurePolygon"], disabledTools.value);
          }
          if (lengths.includes(3)) {
            removeElements(["measureTriangle"], disabledTools.value);
          } else {
            addElements(["measureTriangle"], disabledTools.value);
          }
        } else {
          addElements(
            ["measurePolygon", "measureTriangle"],
            disabledTools.value
          );
        }

        break;
      }
      default: {
        console.debug(
          `updateDisabledTools fell through to default. Change was ${change}`
        );
      }
    }
  }

  function hasNoAntipode(testPoint: SEPoint): boolean {
    // create the antipode location vector
    tmpVector.copy(testPoint.locationVector).multiplyScalar(-1);
    // search for the antipode location vector
    const possibleAntipodes = sePoints.value.filter((p: SEPoint) => {
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

      //       // In the case that (2) happens it is possible that there are two points in the array sePoint with *exactly* the
      //       // same location vector at -1*A, if that happens then the antipode is already created and we should return false (not no antipode = antipode exists)

      //       // Check how many of these candidates are user created
      const userCreated = possibleAntipodes.filter(
        p => p instanceof SEIntersectionPoint && p.isUserCreated
      );
      return userCreated.length === 0;
    }
    //   };
  }
  // },
  // eslint-disable-next-line no-unused-vars
  function findSENoduleById(id: number): SENodule | undefined {
    return seNodules.value
      .map(z => z as SENodule)
      .find((z: SENodule) => z.id === id);
  }

  //#region findNearbyGetter
  // eslint-disable-next-line no-unused-vars
  function findNearbySENodules(
    unitIdealVector: Vector3,
    // eslint-disable-next-line no-unused-vars
    screenPosition: Vector
  ): SENodule[] {
    return seNodules.value.filter((obj: SENodule) => {
      return obj.isHitAt(unitIdealVector, zoomMagnificationFactor.value, screenPosition);
    });
    // return []
  }

  //#endregion findNearbyGetter
  /**
   * If one parent name is given, this returns a list of all intersection points that have a parent with that name.
   * If two parent names are given, this returns a list of all intersection points that a parent with the first name and a parent with the second name
   */
  function findIntersectionPointsByParent(
    parent1Name: string,
    parent2Name?: string
  ): SEIntersectionPoint[] {
    const intersectionPoints = sePoints.value
      // .map(id => sePoints.get(id)!)
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
  }

  /**
   * Create the intersection of two one-dimensional objects
   * Make sure the SENodules are in the correct order: SELines, SESegments, SECircles then SEEllipses.
   * That the (one,two) pair is one of:
   *  (SELine,SELine), (SELine,SESegment), (SELine,SECircle), (SELine,SEEllipse), (SESegment, SESegment),
   *      (SESegment, SECircle), (SESegment, SEEllipse),(SECircle, SECircle), (SECircle, SEEllipse)
   *      (SEEllipse, SEEllipse)
   * If they have the same type put them in alphabetical order. (old then new)
   * The creation of the intersection objects automatically follows this convention in assigning parents.
   */
  function createAllIntersectionsWithLine(
    newLine: SELine,
    existingNewSEPoints?: SEPoint[]
  ): SEIntersectionReturnType[] {
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
    for (let pt of sePoints.value) {
      if (
        !pt.locationVector.isZero() &&
        !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
      ) {
        existingSEPoints.push(pt);
      }
    }
    // The number of existing sePoint before we start adding to it with newly created intersection points
    const numberOfExistingSEPointsBefore = existingSEPoints.length;
    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // Intersect this new line with all old lines
    seLines.value
      //   .map(x => x as SELine)
      //          .filter((line: SELine) => line.id !== newLine.id) // ignore self
      .forEach((oldLine: SELine) => {
        if (oldLine.id === newLine.id) {
          return;
        } // ignore self
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
                tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
            const newSEIntersectionPt = new SEIntersectionPoint(
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
              existingIntersectionPoint: false,
              createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                  existingIntersectionPoint: true,
                  createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                  existingIntersectionPoint: true,
                  createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seSegments.value.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectLineWithSegment(
        newLine,
        oldSegment,
        true // this is the first time these two objects have been intersected
      );
      // console.debug(
      //   `Intersecting ${newLine.name}, and seg ${oldSegment.name}`
      // );
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seCircles.value.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectLineWithCircle(newLine, oldCircle);
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seEllipses.value.forEach((oldEllipse: SEEllipse) => {
      const intersectionInfo = intersectLineWithEllipse(newLine, oldEllipse);
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seParametrics.value.forEach((oldParametric: SEParametric) => {
      const intersectionInfo = intersectLineWithParametric(
        newLine,
        oldParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
  }

  function createAllIntersectionsWithSegment(
    newSegment: SESegment,
    existingNewSEPoints?: SEPoint[]
  ): SEIntersectionReturnType[] {
    // Avoid creating an intersection where any SEPoint already exists
    const existingSEPoints: SEPoint[] = [];
    if (existingNewSEPoints) {
      existingSEPoints.push(...existingNewSEPoints);
    }
    // // First add the two parent points of the newLine, if they are new, then
    // //  they won't have been added to the state.points array yet so add them first
    // existingSEPoints.push(newSegment.startSEPoint);
    // existingSEPoints.push(newSegment.endSEPoint);
    for (let pt of sePoints.value) {
      // sePoints.value.forEach(pt => {
      if (
        !pt.locationVector.isZero() &&
        !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
      ) {
        existingSEPoints.push(pt);
      }
    }

    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];

    // The number of existing sePoint before we start adding to it with newly created intersection points
    const numberOfExistingSEPointsBefore = existingSEPoints.length;
    // Intersect this new segment with all old lines
    seLines.value.forEach((oldLine: SELine) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seSegments.value.forEach((oldSegment: SESegment) => {
      if (oldSegment.id === newSegment.id) {
        return;
      } // ignore self
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
            oldSegment,
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
            parent1: newSegment,
            parent2: oldSegment,
            existingIntersectionPoint: false,
            createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seCircles.value.forEach((oldCircle: SECircle) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seEllipses.value.forEach((oldEllipse: SEEllipse) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seParametrics.value.forEach((oldParametric: SEParametric) => {
      const intersectionInfo = intersectSegmentWithParametric(
        newSegment,
        oldParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
  }

  function createAllIntersectionsWithCircle(
    newCircle: SECircle,
    existingNewSEPoints?: SEPoint[]
  ): SEIntersectionReturnType[] {
    // Avoid creating an intersection where any SEPoint already exists
    const existingSEPoints: SEPoint[] = [];
    if (existingNewSEPoints) {
      existingSEPoints.push(...existingNewSEPoints);
    }
    // // First add the two parent points of the newLine, if they are new, then
    // //  they won't have been added to the state.points array yet so add them first
    // existingSEPoints.push(newCircle.centerSEPoint);
    // existingSEPoints.push(newCircle.circleSEPoint);
    for (let pt of sePoints.value) {
      if (
        !pt.locationVector.isZero() &&
        !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
      ) {
        existingSEPoints.push(pt);
      }
    }
    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // The number of existing sePoint before we start adding to it with newly created intersection points
    const numberOfExistingSEPointsBefore = existingSEPoints.length;
    // Intersect this new circle with all old lines
    seLines.value.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithCircle(oldLine, newCircle);
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seSegments.value.forEach((oldSegment: SESegment) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seCircles.value.forEach((oldCircle: SECircle) => {
      if (oldCircle.id === newCircle.id) {
        return;
      } // ignore self
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seEllipses.value.forEach((oldEllipse: SEEllipse) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seParametrics.value.forEach((oldParametric: SEParametric) => {
      const intersectionInfo = intersectCircleWithParametric(
        newCircle,
        oldParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
  }

  function createAllIntersectionsWithEllipse(
    newEllipse: SEEllipse,
    existingNewSEPoints?: SEPoint[]
  ): SEIntersectionReturnType[] {
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
    for (let pt of sePoints.value) {
      if (
        !pt.locationVector.isZero() &&
        !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
      ) {
        existingSEPoints.push(pt);
      }
    }
    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // The number of existing sePoint before we start adding to it with newly created intersection points
    const numberOfExistingSEPointsBefore = existingSEPoints.length;

    // Intersect this new ellipse with all old lines
    seLines.value.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithEllipse(oldLine, newEllipse);
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seSegments.value.forEach((oldSegment: SESegment) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seCircles.value.forEach((oldCircle: SECircle) => {
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seEllipses.value.forEach((oldEllipse: SEEllipse) => {
      if (oldEllipse.id === newEllipse.id) {
        return;
      } // ignore self
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seParametrics.value.forEach((oldParametric: SEParametric) => {
      const intersectionInfo = intersectEllipseWithParametric(
        newEllipse,
        oldParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
  }

  function createAllIntersectionsWithParametric(
    newParametric: SEParametric,
    existingNewSEPoints?: SEPoint[]
  ): SEIntersectionReturnType[] {
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
    for (let pt of sePoints.value) {
      if (
        !pt.locationVector.isZero() &&
        !existingSEPoints.some(aPt => aPt.name === pt.name) // add only new SEPoints to the existingSEPoints array
      ) {
        existingSEPoints.push(pt);
      }
    }

    // The intersectionPointList to return
    const intersectionPointList: SEIntersectionReturnType[] = [];
    // The number of existing sePoint before we start adding to it with newly created intersection points
    const numberOfExistingSEPointsBefore = existingSEPoints.length;
    // Intersect this new parametric with all old lines
    seLines.value.forEach((oldLine: SELine) => {
      const intersectionInfo = intersectLineWithParametric(
        oldLine,
        newParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seSegments.value.forEach((oldSegment: SESegment) => {
      const intersectionInfo = intersectSegmentWithParametric(
        oldSegment,
        newParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: false // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seCircles.value.forEach((oldCircle: SECircle) => {
      const intersectionInfo = intersectCircleWithParametric(
        oldCircle,
        newParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seEllipses.value.forEach((oldEllipse: SEEllipse) => {
      const intersectionInfo = intersectEllipseWithParametric(
        oldEllipse,
        newParametric,
        inverseTotalRotationMatrix.value
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
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
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
    seParametrics.value.forEach((oldParametric: SEParametric) => {
      if (oldParametric.id === newParametric.id) {
        return;
      } // ignore self
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
              tmpVector.subVectors(info.vector, pt.locationVector).isZero() &&
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
          const newSEIntersectionPt = new SEIntersectionPoint(
            oldParametric,
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
            parent1: newParametric,
            parent2: oldParametric,
            existingIntersectionPoint: false,
            createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
                existingIntersectionPoint: true,
                createAntipodalPoint: true // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
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
  }

  return {
    /* states */
    actionMode,
    canvasHeight,
    canvasWidth,
    hasUnsavedNodules,
    inverseTotalRotationMatrix,
    isEarthMode,
    // layers,
    seExpressions,
    selectedSENodules,
    seNodules,
    svgCanvas,
    temporaryNodules,
    zoomMagnificationFactor,
    zoomTranslation,

    /* computed */
    seAngleMarkers,
    seCircles,
    seEllipses,
    seLabels,
    seLines,
    seParametrics,
    sePoints,
    sePolygons,
    seSegments,
    seTransformations,
    twojsLayers,
    seText,

    /* functions */
    addAngleMarkerAndExpression,
    addCircle,
    addEllipse,
    addExpression,
    addLine,
    addLabel,
    addParametric,
    addPoint,
    addPolygonAndExpression,
    addSegment,
    addTemporaryNodule,
    addTransformation,
    addText,
    changeBackContrast,
    changeGradientFill,
    changeLineNormalVector,
    changeSegmentNormalVectorArcLength,
    changeText,
    clearUnsavedFlag,
    createAllIntersectionsWithCircle,
    createAllIntersectionsWithEllipse,
    createAllIntersectionsWithLine,
    createAllIntersectionsWithParametric,
    createAllIntersectionsWithSegment,
    findIntersectionPointsByParent,
    findNearbySENodules,
    findSENoduleById,
    fitZoomMagnificationFactor,
    moveLabel,
    movePoint,
    moveText,
    hasObjects,
    init,
    removeAllFromLayers,
    removeAngleMarkerAndExpression,
    removeCircle,
    removeEllipse,
    removeExpression,
    removeLabel,
    removeLine,
    removeParametric,
    removePoint,
    removePolygonAndExpression,
    removeSegment,
    removeTransformation,
    removeText,
    revertActionMode,
    rotateSphere,
    setActionMode,
    setCanvas,
    setCanvasDimension,
    setLayers,
    setRotationMatrix,
    updateSelectedSENodules,
    scaleZoomMagnificationFactorBy,
    setZoomMagnificationFactor,
    setZoomTranslation,
    unglowAllSENodules,
    updateDisplay,
    updateTwoJS
  };
});

// export type SEStoreType = StoreActions<ReturnType<typeof useSEStore>> &
//   StoreGetters<ReturnType<typeof useSEStore>> &
//   StoreState<ReturnType<typeof useSEStore>>;

export type SEStoreType = ReturnType<typeof useSEStore>;

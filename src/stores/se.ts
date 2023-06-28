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
import { SENSectLine } from "@/models/SENSectLine";
import { SEParametric } from "@/models/SEParametric";
import { SEPencil } from "@/models/SEPencil";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEPoint } from "@/models/SEPoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEPolygon } from "@/models/SEPolygon";
import { SESegment } from "@/models/SESegment";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SETransformation } from "@/models/SETransformation";
import Nodule, { DisplayStyle } from "@/plottables/Nodule";
import NonFreePoint from "@/plottables/NonFreePoint";
import { ActionMode, plottableType, SEIntersectionReturnType, ToolButtonType } from "@/types";
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
import { LabelMoverVisitor } from "@/visitors/LabelMoverVisitor";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";
import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import { Matrix4, Vector3 } from "three";
import Two from "two.js";

type PiniaAppState = {
  isEarthMode: boolean;
  actionMode: ActionMode;
  previousActionMode: ActionMode;
  buttonSelection: any;
  // previousActiveToolName: string;
  zoomMagnificationFactor: number;
  zoomTranslation: number[];
  hasUnsavedNodules: boolean;
  svgCanvas: HTMLDivElement | null;
  canvasWidth: number;
  canvasHeight: number;
  // Initially the identity. This is the composition of all the inverses of the rotation matrices applied to the sphere.
  inverseTotalRotationMatrix: Matrix4;
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
  seTransformationIds: Array<number>;
  selectedSENoduleIds: Array<number>;
  oldSelectedSENoduleIDs: Array<number>;
  disabledTools: Array<ActionMode>;
};

const seNodules: Array<SENodule> = [];
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
const seTransformations: Map<number, SETransformation> = new Map();
const sePencils: Array<SEPencil> = [];
const layers: Array<Two.Group> = [];
const selectedSENodules: Map<number, SENodule> = new Map();
const oldSelectedSENodules: Map<number, SENodule> = new Map();
const tmpMatrix = new Matrix4();
const tmpVector = new Vector3();
const tmpVector1 = new Vector3();
const temporaryNodules: Array<Nodule> = [];
const initialStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();
const defaultStyleStatesMap = new Map<StyleEditPanels, StyleOptions[]>();

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
function findCycles(): number[] {
  const graph: Array<[number, number]> = [];
  let fakeVertexNum = -1;
  seSegments.forEach(seg => {
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
// function findClosedSegmentChainLength(): number[] {
//   const maxChainLengths: number[] = [];
//   seSegments.forEach(startSegment => {
//     // Check for chains starting with startSegment
//     // We must do this for all segments because of P like arrangements of line segments
//     // For example
//     //    p1p2 to p2p3 to p3p4 to p4p2
//     // contains a chain of length three
//     const unCheckedSegments: Array<SESegment> = [];
//     seSegments.forEach(seg => {
//       // add all segments expect the start to the unchecked list
//       if (seg.name !== startSegment.name) {
//         unCheckedSegments.push(seg);
//       }
//     });

//     let initialSegment: SESegment | undefined = startSegment;

//     // search for chains that contain the initial segment
//     while (initialSegment !== undefined) {
//       let lengthOfChain = 1;
//       const chainStartPointName = initialSegment.startSEPoint.name;
//       let freeEndPointName = initialSegment.endSEPoint.name;
//       let anotherSegmentInChainFound = true;
//       while (anotherSegmentInChainFound) {
//         anotherSegmentInChainFound = false;
//         // search for the next element in the chain among the unchecked segments
//         for (const potentialNextSegment of unCheckedSegments) {
//           if (potentialNextSegment.startSEPoint.name === freeEndPointName) {
//             lengthOfChain += 1;
//             anotherSegmentInChainFound = true;
//             if (potentialNextSegment.endSEPoint.name === chainStartPointName) {
//               // the chain is closed so add to the max length array
//               maxChainLengths.push(lengthOfChain);
//               anotherSegmentInChainFound = false; //stop searching for more segments in this chain because it is closed
//               break;
//             } else {
//               // the chain is open, remove the potential segment from the unchecked and update freeEndPoint and break the search of unchecked segments
//               freeEndPointName = potentialNextSegment.endSEPoint.name;
//               const index = unCheckedSegments.findIndex(
//                 seg => seg.name === potentialNextSegment.name
//               );
//               if (index > -1) {
//                 unCheckedSegments.splice(index, 1);
//               }
//               break;
//             }
//           } else if (
//             potentialNextSegment.endSEPoint.name === freeEndPointName
//           ) {
//             lengthOfChain += 1;
//             anotherSegmentInChainFound = true;
//             if (
//               potentialNextSegment.startSEPoint.name === chainStartPointName
//             ) {
//               // the chain is closed so add to the max length array
//               maxChainLengths.push(lengthOfChain);
//               anotherSegmentInChainFound = false; //stop searching for more segments in this chain because it is closed
//               break;
//             } else {
//               // the chain is open, remove the potential segment from the unchecked and update freeEndPoint and break the search of unchecked segments
//               freeEndPointName = potentialNextSegment.startSEPoint.name;
//               const index = unCheckedSegments.findIndex(
//                 seg => seg.name === potentialNextSegment.name
//               );
//               if (index > -1) {
//                 unCheckedSegments.splice(index, 1);
//               }
//               break;
//             }
//           }
//           // the potential segment doesn't connect to the existing chain continue searching uncheck segments
//         }
//       }
//       // restart the search for chains with the next unchecked segment if any
//       initialSegment = unCheckedSegments.pop(); // check for chains starting with initialSegment
//     }
//   });
//   return maxChainLengths;
// }

export const useSEStore = defineStore({
  id: "se",
  state: (): PiniaAppState => ({
    isEarthMode: false,
    actionMode: "rotate",
    previousActionMode: "rotate",
    // activeToolName: "RotateDisplayedName", // the corresponding I18N key of actionMode
    buttonSelection: {},
    // previousActiveToolName: "",
    svgCanvas: null,
    hasUnsavedNodules: false,
    zoomMagnificationFactor: 1, // the initial zoom factor
    zoomTranslation: [0, 0], // [x , y]
    canvasWidth: 0,
    canvasHeight: 0,
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
    seTransformationIds: [],
    oldSelectedSENoduleIDs: [],
    styleSavedFromPanel: StyleEditPanels.Label,
    selectedSENoduleIds: [],
    disabledTools: [],
    inverseTotalRotationMatrix: new Matrix4() //initially the identity. The composition of all the inverses of the rotation matrices applied to the sphere
  }),
  actions: {
    init(): void {
      this.actionMode = "rotate";
      // this.activeToolName = "RotateDisplayedName";
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
      this.seTransformationIds.splice(0);
      seTransformations.clear();
      sePencils.splice(0);
      this.seLabelIds.splice(0);
      selectedSENodules.clear();
      this.selectedSENoduleIds.splice(0);
      oldSelectedSENodules.clear();
      this.oldSelectedSENoduleIDs.splice(0);
      // intersections.splice(0);
      this.seExpressionIds.splice(0);
      // initialStyleStates.splice(0);
      // defaultStyleStates.splice(0);
      this.hasUnsavedNodules = false;
      temporaryNodules.splice(0);
      this.inverseTotalRotationMatrix.identity();

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
    setCanvasDimension(w: number, h: number): void {
      this.canvasWidth = w;
      this.canvasHeight = h;
    },
    setRotationMatrix(mat: Matrix4): void {
      this.inverseTotalRotationMatrix.copy(mat);
    },
    // setSphereRadius(r: number): void {
    //   // TODO
    // },

    setButton(buttonSelection: ToolButtonType): void {
      this.buttonSelection = buttonSelection;
    },

    setActionMode(mode: ActionMode): void {
      // zoomFit is a one-off tool, so the previousActionMode should never be "zoomFit" (avoid infinite loops too!)
      if (
        !(this.actionMode === "zoomFit" || this.actionMode === "iconFactory")
      ) {
        this.previousActionMode = this.actionMode;
        // this.previousActiveToolName = this.activeToolName;
      }
      this.actionMode = mode;
      // this.activeToolName = mode.name;
    },
    revertActionMode(): void {
      this.actionMode = this.previousActionMode;
      // this.activeToolName = this.previousActiveToolName;
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
      this.seNodules
        .filter(obj => obj.isFreeToMove())
        .forEach(obj => {
          // First mark the kids out of date so that the update method does a topological sort
          obj.markKidsOutOfDate();
          obj.update();
          // console.log("name", obj.name, "show", obj.showing, "exist", obj.exists);
        });
    },
    //#region magnificationUpdate
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
      this.sePointIds.push(point.id);
      sePoints.set(point.id, point);
      seNodules.push(point);
      point.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("point");
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
        this.updateDisabledTools("point");
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
      this.seLineIds.push(line.id);
      seLines.set(line.id, line);
      seNodules.push(line as SENodule);
      line.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("line");
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
        this.updateDisabledTools("line");
      }
    },
    addCircle(circle: SECircle): void {
      this.seCircleIds.push(circle.id);
      seCircles.set(circle.id, circle);
      seNodules.push(circle);
      circle.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("circle");
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
        this.updateDisabledTools("circle");
      }
    },
    addTransformation(transformation: SETransformation): void {
      this.seTransformationIds.push(transformation.id);
      seTransformations.set(transformation.id, transformation);
      seNodules.push(transformation);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("transformation");
    },
    removeTransformation(transformationId: number): void {
      const victimTransformation = seTransformations.get(transformationId);
      if (victimTransformation) {
        /* victim line is found */
        const transformationPos = this.seTransformationIds.findIndex(
          (id: number) => id === transformationId
        );
        const pos = seNodules.findIndex(x => x.id === transformationId);
        this.seTransformationIds.splice(transformationPos, 1); // Remove the transformation from the list
        seNodules.splice(pos, 1);
        seTransformations.delete(transformationId);
        this.hasUnsavedNodules = true;
        this.updateDisabledTools("transformation");
      }
    },
    addSegment(segment: SESegment): void {
      this.seSegmentIds.push(segment.id);
      seSegments.set(segment.id, segment);
      seNodules.push(segment);
      segment.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("segment");
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
        this.updateDisabledTools("segment");
      }
    },
    addEllipse(ellipse: SEEllipse): void {
      this.seEllipseIds.push(ellipse.id);
      seEllipses.set(ellipse.id, ellipse);
      seNodules.push(ellipse);
      ellipse.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("ellipse");
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
        this.updateDisabledTools("ellipse");
      }
    },
    addLabel(label: SELabel): void {
      this.seLabelIds.push(label.id);
      seLabels.set(label.id, label);
      seNodules.push(label);
      label.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      // this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
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
        //this.updateDisabledTools("label"); not needed because labels are attached to all geometric objects
      }
    },
    moveLabel(move: { labelId: number; location: Vector3 }): void {
      const labelMoverVisitor = new LabelMoverVisitor();
      labelMoverVisitor.setNewLocation(move.location);
      const pos = this.seLabels.findIndex(x => x.id === move.labelId);
      if (pos > -1) this.seLabels[pos].accept(labelMoverVisitor);
    },
    addAngleMarkerAndExpression(angleMarker: SEAngleMarker): void {
      this.seExpressionIds.push(angleMarker.id);
      this.seAngleMarkerIds.push(angleMarker.id);
      seAngleMarkers.set(angleMarker.id, angleMarker);
      seExpressions.set(angleMarker.id, angleMarker);
      seNodules.push(angleMarker);
      angleMarker.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("angleMarker");
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
        this.updateDisabledTools("angleMarker");
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
      this.updateDisabledTools("parametric");
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
        this.updateDisabledTools("parametric");
      }
    },
    addPolygonAndExpression(polygon: SEPolygon): void {
      // console.debug(`add polygon with id ${polygon.id}`);
      this.seExpressionIds.push(polygon.id);
      seExpressions.set(polygon.id, polygon);
      this.sePolygonIds.push(polygon.id);
      sePolygons.set(polygon.id, polygon);
      seNodules.push(polygon);
      polygon.ref.addToLayers(layers);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("polygon");
    },
    removePolygonAndExpression(polygonId: number): void {
      // console.debug(`Remove polygon with id ${polygonId}`);
      const victimPolygon = sePolygons.get(polygonId);
      if (victimPolygon) {
        // console.debug(`Polygon found`);
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
        this.updateDisabledTools("polygon");
      }
    },
    addExpression(measurement: SEExpression): void {
      this.seExpressionIds.push(measurement.id);
      seExpressions.set(measurement.id, measurement);
      seNodules.push(measurement);
      this.hasUnsavedNodules = true;
      this.updateDisabledTools("expression");
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
        this.updateDisabledTools("expression");
      }
    },
    //#region rotateSphere
    rotateSphere(rotationMat: Matrix4): void {
      // Update the inverseTotalRotationMatrix. We have a new rotationMat which is transforming by
      //   rotationMat*oldTotalRotationMatrix * VEC
      // so to undo that action we find the inverse which is
      //  inverseTotalRotationMatrix*(inverse of rotationMat)
      tmpMatrix.copy(rotationMat).invert();
      this.inverseTotalRotationMatrix.multiply(tmpMatrix);
      const rotationVisitor = new RotationVisitor();
      rotationVisitor.setTransform(rotationMat);
      const updateCandidates: Array<SENodule> = [];

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
        ...seNodules.filter((p: SENodule) => p.parents.length === 0)
      );
      // console.debug(
      //   "Update candidates",
      //   updateCandidates.map(z => z.name).join(", ")
      // );
      while (updateCandidates.length > 0) {
        const target = updateCandidates.shift()!;
        const accepted = target.accept(rotationVisitor);
        // console.debug(`What's going on with ${target.name}?`, accepted);
        if (!accepted) {
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
      //}
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
        // console.debug("Selected nodules differ");
        //reset previous selection glowing color to usual
        this.selectedSENodules.forEach(n => {
          n.ref?.setSelectedColoring(false);
        });
        // clear the selectedSENodules map and id array
        selectedSENodules.clear();
        this.selectedSENoduleIds.splice(0);
        payload.forEach(seNodule => {
          this.selectedSENoduleIds.push(seNodule.id);
          selectedSENodules.set(seNodule.id, seNodule);
        });
        // this.selectedSENodules.splice(0);
        // this.selectedSENodules.push(...payload);
        //set the glowing color to selected
        this.selectedSENodules.forEach(n => {
          n.ref?.setSelectedColoring(true);
        });
      }
    },
    setOldSelection(payload: SENodule[]): void {
      // clear the last old selection
      oldSelectedSENodules.clear();
      this.oldSelectedSENoduleIDs.splice(0);
      // set the new selection
      payload.forEach(seNodule => {
        this.oldSelectedSENoduleIDs.push(seNodule.id);
        oldSelectedSENodules.set(seNodule.id, seNodule);
      });
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
    },
    updateDisabledTools(
      change: plottableType | "transformation" | "expression"
    ): void {
      switch (change) {
        case "point": {
          // "coordinate",// need one point
          // "pointDistance", // need two points
          const numPoints = this.sePoints.filter(
            pt =>
              !(
                pt instanceof SEAntipodalPoint ||
                pt instanceof SEIntersectionPoint
              ) || pt.isUserCreated
          ).length;
          if (numPoints === 1) {
            removeElements(
              ["coordinate", "pointReflection"],
              this.disabledTools
            );
            addElements(["pointDistance"], this.disabledTools);
          } else if (numPoints > 1) {
            removeElements(
              ["pointDistance", "coordinate", "pointReflection"],
              this.disabledTools
            );
          } else {
            addElements(
              ["pointDistance", "coordinate", "pointReflection"],
              this.disabledTools
            );
          }
          break;
        }
        case "angleMarker": {
          // "angleBisector", // need an angle
          // "nSectLine", // need an angle
          if (this.seAngleMarkers.length > 0) {
            removeElements(["angleBisector", "nSectLine"], this.disabledTools);
          } else {
            addElements(["angleBisector", "nSectLine"], this.disabledTools);
          }
          break;
        }
        case "transformation": {
          // "applyTransformation", // need a transformation
          if (this.seTransformations.length > 0) {
            removeElements(["applyTransformation"], this.disabledTools);
          } else {
            addElements(["applyTransformation"], this.disabledTools);
          }
          break;
        }
        case "circle":
        case "segment":
        case "line":
        case "ellipse":
        case "parametric":
        case "expression": {
          const numCircles = this.seCircles.length;
          const numSegments = this.seSegments.length;
          const numLines = this.seLines.length;
          const numEllipses = this.seEllipses.length;
          const numParametrics = this.seParametrics.length;
          const numExpressions = this.expressions.length;

          // "inversion", // need a circle
          if (numCircles > 0) {
            removeElements(["inversion"], this.disabledTools);
          } else {
            addElements(["inversion"], this.disabledTools);
          }

          // "measuredCircle", // need an expression
          if (numExpressions > 0) {
            removeElements(["measuredCircle"], this.disabledTools);
          } else {
            addElements(["measuredCircle"], this.disabledTools);
          }

          // "midpoint", // need a line segment
          // "nSectPoint", // need a line segment
          // "segmentLength", // need a line segment
          if (numSegments > 0) {
            removeElements(
              ["midpoint", "nSectPoint", "segmentLength"],
              this.disabledTools
            );
          } else {
            addElements(
              ["midpoint", "nSectPoint", "segmentLength"],
              this.disabledTools
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
              this.disabledTools
            );
            if (
              numCircles +
                numSegments +
                numLines +
                numEllipses +
                numParametrics >
              1
            ) {
              removeElements(["intersect"], this.disabledTools);
            } else {
              addElements(["intersect"], this.disabledTools);
            }
          } else {
            addElements(
              ["perpendicular", "pointOnObject", "intersect"],
              this.disabledTools
            );
          }

          // "tangent", // need a non-straight one dimensional
          if (numCircles > 0 || numEllipses > 0 || numParametrics > 0) {
            removeElements(["tangent"], this.disabledTools);
          } else {
            addElements(["tangent"], this.disabledTools);
          }

          // "rotation", //need a line segment, circle or expression
          if (numSegments + numCircles + numExpressions > 0) {
            removeElements(["rotation"], this.disabledTools);
          } else {
            addElements(["rotation"], this.disabledTools);
          }

          // "reflection", // need a line or segment
          if (numSegments + numLines > 0) {
            removeElements(["reflection"], this.disabledTools);
          } else {
            addElements(["reflection"], this.disabledTools);
          }

          // "translation" //need a line segment or (expression and (line or segment))
          if (
            numSegments > 0 ||
            (numExpressions > 0 && (numLines > 0 || numSegments > 0))
          ) {
            removeElements(["translation"], this.disabledTools);
          } else {
            addElements(["translation"], this.disabledTools);
          }

          // "measurePolygon", // need a closed chain of four or more line segments or closed chain of two segments both of length pi
          // "measureTriangle", // need a closed chain of three or more line segments
          if (numSegments > 1) {
            //console.log("find cycles", findCycles());
            const lengths = findCycles(); //findClosedSegmentChainLength();
            //console.debug(`number of cycles ${lengths.length}`);
            if (lengths.length === 0) {
              addElements(
                ["measurePolygon", "measureTriangle"],
                this.disabledTools
              );
            }
            if (lengths.includes(2) || Math.max(...lengths) > 3) {
              removeElements(["measurePolygon"], this.disabledTools);
            } else {
              addElements(["measurePolygon"], this.disabledTools);
            }
            if (lengths.includes(3)) {
              removeElements(["measureTriangle"], this.disabledTools);
            } else {
              addElements(["measureTriangle"], this.disabledTools);
            }
          } else {
            addElements(
              ["measurePolygon", "measureTriangle"],
              this.disabledTools
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
  },
  getters: {
    //getZoomMagnificationFactor: (): number => zoomMagnificationFactor,
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
    seTransformations: (state): Array<SETransformation> =>
      state.seTransformationIds.map(id => seTransformations.get(id)!),
    selectedSENodules: (state): Array<SENodule> =>
      state.selectedSENoduleIds.map(id => selectedSENodules.get(id)!),
    oldStyleSelections: (state): Array<SENodule> =>
      state.selectedSENoduleIds.map(id => oldSelectedSENodules.get(id)!),
    temporaryNodules: (): Array<Nodule> => temporaryNodules,
    layers: (): Two.Group[] => layers,
    initialStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      initialStyleStatesMap,
    defaultStyleStatesMap: (): Map<StyleEditPanels, StyleOptions[]> =>
      defaultStyleStatesMap,
    hasObjects(state): boolean {
      return state.sePointIds.length > 0;
    },
    // inverseTotalRotationMatrix: (): Matrix4 => inverseTotalRotationMatrix,
    // hasNoAntipode: (state): ((_: SEPoint) => boolean) => {
    //   return (testPoint: SEPoint): boolean => {
    //     // create the antipode location vector
    //     tmpVector.copy(testPoint.locationVector).multiplyScalar(-1);
    //     // search for the antipode location vector
    //     const possibleAntipodes = state.sePointIds
    //       .map(id => sePoints.get(id)!)
    //       .filter((p: SEPoint) => {
    //         return tmpVector.equals(p.locationVector);
    //       });
    //     if (possibleAntipodes.length == 0) {
    //       // If -1*testPoint.location doesn't appear on the sePoints array then there is *no* antipode to testPoint (so return true)
    //       return true;
    //     } else {
    //now realize that the intersection of two lines/segments creates two SEPoints (which are an antipodal pair A and B) and
    // puts them on the sePoints array, but some of them may or may not be user created.
    // if the user try to create the antipode of one of the intersections A, then -1*A appears on the list as B
    // (1) if B is user created, then we should *not* create the antipode at -1*A so return false (not no antipode = antipode exists)
    // (2) if B is not user created, then we we should still create the antipode at -1*A, so return true (these is no antipode)

    //       // In the case that (2) happens it is possible that there are two points in the array sePoint with *exactly* the
    //       // same location vector at -1*A, if that happens then the antipode is already created and we should return false (not no antipode = antipode exists)

    //       // Check how many of these candidates are user created
    //       const userCreated = possibleAntipodes.filter(
    //         p => p instanceof SEIntersectionPoint && p.isUserCreated
    //       );
    //       return userCreated.length === 0;
    //     }
    //   };
    // },
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
        sePoints.forEach(pt => {
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
        seLines
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
        seSegments.forEach((oldSegment: SESegment) => {
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
        seCircles.forEach((oldCircle: SECircle) => {
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectLineWithParametric(
            newLine,
            oldParametric,
            this.inverseTotalRotationMatrix
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
        sePoints.forEach(pt => {
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
        seLines.forEach((oldLine: SELine) => {
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
        seSegments.forEach((oldSegment: SESegment) => {
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
        seCircles.forEach((oldCircle: SECircle) => {
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectSegmentWithParametric(
            newSegment,
            oldParametric,
            this.inverseTotalRotationMatrix
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
        sePoints.forEach(pt => {
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
        seLines.forEach((oldLine: SELine) => {
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
        seSegments.forEach((oldSegment: SESegment) => {
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
        seCircles.forEach((oldCircle: SECircle) => {
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectCircleWithParametric(
            newCircle,
            oldParametric,
            this.inverseTotalRotationMatrix
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
        sePoints.forEach(pt => {
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
        seLines.forEach((oldLine: SELine) => {
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
        seSegments.forEach((oldSegment: SESegment) => {
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
        seCircles.forEach((oldCircle: SECircle) => {
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
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
        seParametrics.forEach((oldParametric: SEParametric) => {
          const intersectionInfo = intersectEllipseWithParametric(
            newEllipse,
            oldParametric,
            this.inverseTotalRotationMatrix
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
        sePoints.forEach(pt => {
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
        seLines.forEach((oldLine: SELine) => {
          const intersectionInfo = intersectLineWithParametric(
            oldLine,
            newParametric,
            this.inverseTotalRotationMatrix
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
        seSegments.forEach((oldSegment: SESegment) => {
          const intersectionInfo = intersectSegmentWithParametric(
            oldSegment,
            newParametric,
            this.inverseTotalRotationMatrix
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
        seCircles.forEach((oldCircle: SECircle) => {
          const intersectionInfo = intersectCircleWithParametric(
            oldCircle,
            newParametric,
            this.inverseTotalRotationMatrix
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
        seEllipses.forEach((oldEllipse: SEEllipse) => {
          const intersectionInfo = intersectEllipseWithParametric(
            oldEllipse,
            newParametric,
            this.inverseTotalRotationMatrix
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
        seParametrics.forEach((oldParametric: SEParametric) => {
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
      };
    }
  }
});

export type SEStoreType = StoreActions<ReturnType<typeof useSEStore>> &
  StoreGetters<ReturnType<typeof useSEStore>> &
  StoreState<ReturnType<typeof useSEStore>>;

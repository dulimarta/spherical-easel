import { HENodule } from "@/models-hyperbolic/HENodule";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { defineStore } from "pinia";
import {
  Intersection,
  Quaternion,
  Scene,
  Camera,
  Raycaster,
  Matrix4,
  Vector3,
  Vector4
} from "three";
import { markRaw } from "vue";
import { ref, Ref } from "vue";
import { useThreeFont } from "@/composables/useThreeFont";
import { HELine } from "@/models-hyperbolic/HELine";
import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import {
  ActionMode,
  HEIntersectionReturnType,
  HEOneDimensional,
  IntersectionReturnTypeH2
} from "@/types";
import { HELabel } from "@/models-hyperbolic/HELabel";
import EventBus from "@/eventHandlers-spherical/EventBus";
import {
  unitLength,
  zLowerClip,
  zUpperClip
} from "@/plottables-hyperbolic/MeshFactory";
import { intersectLineWithLine, vec4ToVec3 } from "@/utils/helpingHEFunctions";
import { rank_of_type } from "@/utils/helpingfunctions";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
const tmpVector = new Vector4();

export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const closestIntersectionIsSurface: Ref<boolean> = ref(false);
  // const hyperboloidIsClosestIntersection: Ref<boolean> = ref(false);
  // const idealStripIsClosestIntersection: Ref<boolean> = ref(false);
  // const ultraStripIsClosestIntersection: Ref<boolean> = ref(false);

  const objectMap: Map<string, CKNodule> = new Map();
  const pointsMap: Map<string, CKPoint> = new Map();
  const linesMap: Map<string, HELine> = new Map();
  const labelsMap: Map<string, HELabel> = new Map();
  //const circlesMap: Map<string, HECircle> = new Map();
  //const segmentsMap: Map<string, HESegment> = new Map();
  //const conicsMap: Map<string, HEConic> = new Map();

  const tempObjectsMap: Map<string, HENodule> = new Map();

  const cameraQuaternion: Ref<Quaternion> = ref(new Quaternion());
  // const cameraCF = new Matrix4();
  const cameraInverseMatrix = ref(new Matrix4());
  const cameraMatrix = ref(new Matrix4());
  const cameraDollyDistance = ref(0);
  const cameraFieldOfView = ref(0);
  const cameraOrigin = ref(new Vector3());
  const { font } = useThreeFont();
  const implementedHETools: Ref<Array<ActionMode>> = ref([
    "point",
    "line",
    "segment",
    "circle",
    "text",
    "rotate"
  ]);

  // const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;
  let threeJSCamera: Camera;
  let rayCaster: Raycaster;

  const tmp3Vector1 = new Vector3();
  const tmp3Vector2 = new Vector3();
  const tmp3Vector3 = new Vector3();
  const tmp3Vector4 = new Vector3();

  function setScene(s: Scene, c: Camera) {
    threeJSScene = s;
    threeJSCamera = c;

    cameraMatrix.value.copy(threeJSCamera.matrixWorld);
    // const v = new Vector3();
    const q = new Quaternion();
    const scale = new Vector3();
    // c.matrixWorld.decompose(v, q, scale);
    // console.debug("Camera details", v, q, s);
    cameraMatrix.value.decompose(cameraOrigin.value, q, scale);
    // console.debug("Camera inverse details", cameraOrigin, q, s);
    rayCaster = new Raycaster();
  }
  function getObjectById(id: string): CKNodule | null {
    // console.debug(`Searching for ${id} in`, objectMap);
    return objectMap.get(id) ?? null;
  }
  function addTempObject(obj: HENodule) {
    tempObjectsMap.set(obj.name, markRaw(obj));
  }
  // function removeTempObject(obj: HENodule) {
  //   tempObjectsMap.delete(obj.name);
  // }
  function addPoint(point: CKPoint) {
    point.ref?.addToScene(threeJSScene);
    objectMap.set(point.name, markRaw(point));
    console.debug(`After adding point ${point.name} to objectMap`, objectMap);
    pointsMap.set(point.name, markRaw(point));
  }
  function removePoint(point: CKPoint) {
    point.ref?.removeFromScene();
    point.labelRef?.removeFromScene();
    if (point.ref) point.unsubscribe(point.ref);
    if (point.labelRef) point.unsubscribe(point.labelRef);
    // point.removeGroupFromScene(threeJSScene);
    objectMap.delete(point.name);
    pointsMap.delete(point.name);
  }
  function addLabel(label: HELabel) {
    label.addGroupToScene(threeJSScene);
    // objectMap.set(label.name, markRaw(label));
    labelsMap.set(label.name, markRaw(label));
  }
  function removeLabel(label: HELabel) {
    label.removeGroupFromScene(threeJSScene);
    objectMap.delete(label.name);
    labelsMap.delete(label.name);
  }
  function addLine(line: HELine) {
    line.addGroupToScene(threeJSScene);
    // objectMap.set(line.name, markRaw(line));
    linesMap.set(line.name, markRaw(line));
  }
  function removeLine(line: HELine) {
    line.removeGroupFromScene(threeJSScene);
    objectMap.delete(line.name);
    linesMap.delete(line.name);
  }
  function updateDisplayForCameraUpdate() {
    // pointsMap.forEach(point => {
    //   if (point.position.w === 1 || point.position.w === -1) {
    //     if (
    //       point.position.z >
    //         zUpperClip.value - point.pointRadius * unitLength.value ||
    //       point.position.z <
    //         zLowerClip.value + point.pointRadius * unitLength.value
    //     ) {
    //       point.removeGroupFromScene(threeJSScene);
    //     } else {
    //       point.addGroupToScene(threeJSScene);
    //       point.shallowUpdate();
    //     }
    //   } else {
    //     point.shallowUpdate();
    //   }
    // });
    tempObjectsMap.forEach(obj => {
      obj.shallowUpdate();
    }); // the temporary objects need to updated when the display changes
  }
  function adjustLabelPose() {
    labelsMap.forEach(label => {
      //add or remove labels that are attached to non-ideal points and are outside of the clipping planes of the hyperboloid (plus a little buffer) from the scene
      // This is necessary so that labels that are outside of the clipping planes don't show as the user dollies and zooms.
      if (label.anchorPoint.w === 1 || label.anchorPoint.w === -1) {
        if (
          label.anchorPoint.z > zUpperClip.value - unitLength.value ||
          label.anchorPoint.z < zLowerClip.value + unitLength.value
        ) {
          label.removeGroupFromScene(threeJSScene);
        } else {
          label.addGroupToScene(threeJSScene);
          label.faceCamera();
        }
      } else {
        // make the labels attached to ideal points update
        label.faceCamera();
      }
    });
  }

  function lineIsNew(possibleNewLine): boolean {
    let lineIsNew = true;
    linesMap.forEach(line => {
      if (
        tmp3Vector3
          .crossVectors(line.unitNormalVector, possibleNewLine.unitNormalVector)
          .isZero() &&
        line.upper == possibleNewLine.upper &&
        line.mode == possibleNewLine.mode
      ) {
        if (line.mode !== 0 * 1 + 1 * 2 + 0 * 4) {
          // line segments are a special case we can have multiple line segments on the same line, but they must have different end points
          if (
            (tmp3Vector1
              .crossVectors(
                vec4ToVec3(line.startPoint.position),
                vec4ToVec3(possibleNewLine.startPoint.position)
              )
              .isZero() &&
              tmp3Vector2
                .crossVectors(
                  vec4ToVec3(line.endPoint.position),
                  vec4ToVec3(possibleNewLine.endPoint.position)
                )
                .isZero()) ||
            (tmp3Vector3
              .crossVectors(
                vec4ToVec3(line.startPoint.position),
                vec4ToVec3(possibleNewLine.endPoint.position)
              )
              .isZero() &&
              tmp3Vector4
                .crossVectors(
                  vec4ToVec3(line.endPoint.position),
                  vec4ToVec3(possibleNewLine.startPoint.position)
                )
                .isZero())
          ) {
            lineIsNew = false;
          } else {
            lineIsNew = true;
          }
        } else {
          lineIsNew = false;
        }
      }
    });
    return lineIsNew;
  }
  /**
   * Create the intersection of two one-dimensional objects
   * Make sure the SENodules are in the correct order: SELines, SESegments, SECircles then SEEllipses then parametrics.
   * That the (one,two) pair is one of:
   *  (SELine,SELine), (SELine,SESegment), (SELine,SECircle), (SELine,SEEllipse), (SESegment, SESegment),
   *      (SESegment, SECircle), (SESegment, SEEllipse),(SECircle, SECircle), (SECircle, SEEllipse)
   *      (SEEllipse, SEEllipse)
   * If they have the same type put them in lexicographic order. (old then new)
   * The creation of the intersection objects automatically follows this convention in assigning parents.
   */
  function createAllIntersectionsWith(
    newHENodule: HEOneDimensional,
    existingNewHEPoints?: HEPoint[]
  ): HEIntersectionReturnType[] {
    // Avoid creating an intersection where any HEPoint already exists
    const existingHEPoints: HEPoint[] = [];
    if (existingNewHEPoints) {
      existingHEPoints.push(...existingNewHEPoints);
    }
    // Add all the currently existing non-zero hePoints
    // for (let pt of pointsMap.values()) {
    //   if (
    //     !pt.position.isZero()
    //     // &&
    //     // !existingHEPoints.some(aPt => aPt.name === pt.name) // add only new HEPoints to the existingSEPoints array
    //   ) {
    //     existingHEPoints.push(pt);
    //   }
    // }
    console.log(
      `Number of points before intersection ${existingHEPoints.length}`
    );
    // The intersectionPointList to return
    const intersectionPointReturnArray: HEIntersectionReturnType[] = [];

    // type the newNodule
    if (newHENodule instanceof HELine) {
      newHENodule = newHENodule as HELine;
      // } else if (newHENodule instanceof SESegment) {
      //   newHENodule = newHENodule as SESegment;
      // } else if (newHENodule instanceof SECircle) {
      //   newHENodule = newHENodule as SECircle;
      // } else if (newHENodule instanceof SEEllipse) {
      //   newHENodule = newHENodule as SEEllipse;
      // } else if (newHENodule instanceof SEParametric) {
      //   newHENodule = newHENodule as SEParametric;
    }
    const rank1 = rank_of_type(newHENodule);

    const computedRefArray = [
      linesMap
      // seCircles,
      // seEllipses,
      // seParametrics
    ];
    computedRefArray.forEach(ref => {
      for (let oldHENodule of ref.values()) {
        let intersectionInfo: IntersectionReturnTypeH2[] = [];
        // type the oldNodule
        if (oldHENodule instanceof HELine) {
          oldHENodule = oldHENodule as HELine;
          // } else if (oldSENodule instanceof SESegment) {
          //   oldSENodule = oldSENodule as SESegment;
          // } else if (oldSENodule instanceof SECircle) {
          //   oldSENodule = oldSENodule as SECircle;
          // } else if (oldSENodule instanceof SEEllipse) {
          //   oldSENodule = oldSENodule as SEEllipse;
          // } else if (oldSENodule instanceof SEParametric) {
          //   oldSENodule = oldSENodule as SEParametric;
        }
        // Order the objects properly
        let object1: HEOneDimensional;
        let object2: HEOneDimensional;
        const rank2 = rank_of_type(oldHENodule);
        if (
          rank1 < rank2 ||
          (rank1 == rank2 && newHENodule.name < oldHENodule.name)
        ) {
          object1 = newHENodule;
          object2 = oldHENodule;
        } else {
          object2 = newHENodule;
          object1 = oldHENodule;
        }
        // now intersect them
        if (object1 instanceof HELine && object2 instanceof HELine) {
          if (object1.name != object2.name) {
            intersectionInfo = intersectLineWithLine(
              object1,
              object2,
              true // this is the first time these two objects have been intersected
            );
          }
          // } else if (object1 instanceof SELine && object2 instanceof SESegment) {
          //   intersectionInfo = intersectLineWithSegment(
          //     object1,
          //     object2,
          //     true // this is the first time these two objects have been intersected
          //   );
          // } else if (object1 instanceof SELine && object2 instanceof SECircle) {
          //   intersectionInfo = intersectLineWithCircle(object1, object2);
          // } else if (object1 instanceof SELine && object2 instanceof SEEllipse) {
          //   intersectionInfo = intersectLineWithEllipse(object1, object2);
          // } else if (
          //   object1 instanceof SELine &&
          //   object2 instanceof SEParametric
          // ) {
          //   intersectionInfo = intersectLineWithParametric(
          //     object1,
          //     object2,
          //     inverseTotalRotationMatrix.value
          //   );
          // } else if (
          //   object1 instanceof SESegment &&
          //   object2 instanceof SESegment
          // ) {
          //   if (object1.name != object2.name) {
          //     intersectionInfo = intersectSegmentWithSegment(
          //       object1,
          //       object2,
          //       true // this is the first time these two objects have been intersected
          //     );
          //   }
          // } else if (
          //   object1 instanceof SESegment &&
          //   object2 instanceof SECircle
          // ) {
          //   intersectionInfo = intersectSegmentWithCircle(object1, object2);
          // } else if (
          //   object1 instanceof SESegment &&
          //   object2 instanceof SEEllipse
          // ) {
          //   intersectionInfo = intersectSegmentWithEllipse(object1, object2);
          // } else if (
          //   object1 instanceof SESegment &&
          //   object2 instanceof SEParametric
          // ) {
          //   intersectionInfo = intersectSegmentWithParametric(
          //     object1,
          //     object2,
          //     inverseTotalRotationMatrix.value
          //   );
          // } else if (object1 instanceof SECircle && object2 instanceof SECircle) {
          //   if (object1.name != object2.name) {
          //     intersectionInfo = intersectCircleWithCircle(
          //       object1,
          //       object2,
          //       true
          //       // this is the first time these two objects have been intersected
          //     );
          //   }
          // } else if (
          //   object1 instanceof SECircle &&
          //   object2 instanceof SEEllipse
          // ) {
          //   intersectionInfo = intersectCircleWithEllipse(object1, object2);
          // } else if (
          //   object1 instanceof SECircle &&
          //   object2 instanceof SEParametric
          // ) {
          //   intersectionInfo = intersectCircleWithParametric(
          //     object1,
          //     object2,
          //     inverseTotalRotationMatrix.value
          //   );
          // } else if (
          //   object1 instanceof SEEllipse &&
          //   object2 instanceof SEEllipse
          // ) {
          //   if (object1.name != object2.name) {
          //     intersectionInfo = intersectEllipseWithEllipse(
          //       object1,
          //       object2,
          //       true // this is the first time these two objects have been intersected
          //     );
          //   }
          // } else if (
          //   object1 instanceof SEEllipse &&
          //   object2 instanceof SEParametric
          // ) {
          //   intersectionInfo = intersectEllipseWithParametric(
          //     object1,
          //     object2,
          //     inverseTotalRotationMatrix.value
          //   );
          // } else if (
          //   object1 instanceof SEParametric &&
          //   object2 instanceof SEParametric
          // ) {
          //   intersectionInfo = intersectParametricWithParametric(
          //     object1,
          //     object2
          //   );
        }
        const info = classifyIntersections(
          intersectionInfo,
          existingHEPoints,
          object1,
          object2
        );
        intersectionPointReturnArray.push(...info.intersections);
      }
    });
    return intersectionPointReturnArray;
  }

  // Takes the intersection info from an intersectXXXWithXXX command, compares it against the existing points and returns the intersections as either new (option 1) or old (option 2) with addition information and ignores those that are not an intersection point - say they are just an SEPoint, like the endpoint of a segment (option 0)
  function classifyIntersections(
    intersectionInfo: IntersectionReturnTypeH2[],
    existingHEPoints: HEPoint[],
    firstParent: HEOneDimensional,
    secondParent: HEOneDimensional
  ): {
    intersections: HEIntersectionReturnType[];
  } {
    const returnArray: HEIntersectionReturnType[] = [];
    const createAntipodal = !(
      firstParent instanceof HELine && secondParent instanceof HELine
    ); // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true

    let existingHEIntersectionPoint: HEIntersectionPoint | null = null;
    intersectionInfo.forEach((info, index) => {
      // Options
      //  0) The intersection point is on the list of hePoints, but the hePoint is not an heIntersection point (so do nothing with this intersection)
      //  1) The intersection point is new so create a new intersection point
      //  2) The intersection point is old so the intersection information might be added to the otherHEParents array of the intersection point

      //clear the existingSEIntersectionPoint
      existingHEIntersectionPoint = null;
      let isOnExistingPointList = false;
      // Search the existing (and newly created points and newly created --i.e. earlier in this command group) intersection points for these intersections
      existingHEPoints.forEach(pt => {
        if (
          tmpVector.subVectors(info.vector, pt.position).isZero() && //if this tolerance is too small, then we end up creating ****lots**** of intersection points at the same location
          !pt.position.isZero() //isZero is never true happens for a line and line as they always *initially* intersect.  However for a line and circle, if they
          // don't initially intersect then the intersection vectors are zero.
          //The default is that when two objects don't intersect initially the vector is zero
        ) {
          if (pt instanceof HEIntersectionPoint) {
            existingHEIntersectionPoint = pt;
          }
          isOnExistingPointList = true;
        }
      });

      if (!isOnExistingPointList) {
        // info.vector is not on the existing SE points array, so create an intersection (Option #1 above)
        const newHEIntersectionPt = new HEIntersectionPoint(
          info.vector,
          firstParent,
          secondParent,
          index,
          false
        );
        //put the new intersection point on the existing list
        existingHEPoints.push(newHEIntersectionPt);
        //copy the location and existence information into the new intersection point and put it on the list to be returned
        newHEIntersectionPt.position = info.vector;
        newHEIntersectionPt.exists = info.exists;
        returnArray.push({
          HEIntersectionPoint: newHEIntersectionPt,
          parent1: firstParent,
          parent2: secondParent,
          existingIntersectionPoint: false,
          createAntipodalPoint: createAntipodal,
          order: index
        });
      } else {
        // if existingSEIntersection Point is null here then we are in Option #0 above (means that the intersection vector is on the sePoint list, but the point is not an seIntersection point) so do nothing with these intersection points
        if (existingHEIntersectionPoint != null) {
          // the intersection vector (info.vector) is at an existing SEIntersection point (Option #2 above)
          // this means that the parents might new parents of this intersection point check later
          // this means that the parents might new parents of this intersection point check later
          returnArray.push({
            HEIntersectionPoint: existingHEIntersectionPoint,
            parent1: firstParent,
            parent2: secondParent,
            existingIntersectionPoint: true,
            createAntipodalPoint: createAntipodal, // This is only false when the parents are two straight objects and doesn't matter when existingIntersectionPoint is true
            order: index
          });
        }
      }
    });
    return {
      intersections: returnArray
    };
  }

  return {
    font,
    surfaceIntersections,
    // objectIntersections,
    closestIntersectionIsSurface,
    cameraQuaternion,
    cameraDollyDistance,
    cameraFieldOfView,
    cameraOrigin,
    cameraInverseMatrix,
    implementedHETools,
    // hyperboloidIsClosestIntersection,
    // idealStripIsClosestIntersection,
    // ultraStripIsClosestIntersection,
    linesMap,
    pointsMap,
    addTempObject,
    addPoint,
    addLine,
    addLabel,
    getObjectById,
    lineIsNew,
    removePoint,
    removeLabel,
    removeLine,
    setScene,
    adjustTextPose: adjustLabelPose,
    updateDisplayForCameraUpdate,
    createAllIntersectionsWith
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

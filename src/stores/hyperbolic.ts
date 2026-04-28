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
  Vector3
} from "three";
import { markRaw } from "vue";
import { ref, Ref } from "vue";
import { useThreeFont } from "@/composables/useThreeFont";
import { HELine } from "@/models-hyperbolic/HELine";
import SETTINGS, { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import { ActionMode } from "@/types";
import { HELabel } from "@/models-hyperbolic/HELabel";
import EventBus from "@/eventHandlers-spherical/EventBus";
import { zLowerClip, zUpperClip } from "@/plottables-hyperbolic/MeshFactory";

export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const closestIntersectionIsSurface: Ref<boolean> = ref(false);
  const hyperboloidIsClosestIntersection: Ref<boolean> = ref(false);
  const idealStripIsClosestIntersection: Ref<boolean> = ref(false);
  const ultraStripIsClosestIntersection: Ref<boolean> = ref(false);

  const objectMap: Map<string, HENodule> = new Map();
  const pointsMap: Map<string, HEPoint> = new Map();
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
  function getObjectById(id: string) {
    // console.log(`Searching for ${id} in`, objectMap);
    return objectMap.get(id) ?? null;
  }
  function addTempObject(obj: HENodule) {
    tempObjectsMap.set(obj.name, obj);
  }
  // function removeTempObject(obj: HENodule) {
  //   tempObjectsMap.delete(obj.name);
  // }
  function addPoint(point: HEPoint) {
    point.addGroupToScene(threeJSScene);
    objectMap.set(point.name, markRaw(point));
    pointsMap.set(point.name, markRaw(point));
  }
  function removePoint(point: HEPoint) {
    point.removeGroupFromScene(threeJSScene);
    objectMap.delete(point.name);
    pointsMap.delete(point.name);
  }
  function addLabel(label: HELabel) {
    label.addGroupToScene(threeJSScene);
    objectMap.set(label.name, markRaw(label));
    labelsMap.set(label.name, markRaw(label));
  }
  function removeLabel(label: HELabel) {
    label.removeGroupFromScene(threeJSScene);
    objectMap.delete(label.name);
    labelsMap.delete(label.name);
  }
  function addLine(line: HELine) {
    line.addGroupToScene(threeJSScene);
    objectMap.set(line.name, markRaw(line));
    linesMap.set(line.name, markRaw(line));
  }
  function removeLine(line: HELine) {
    line.removeGroupFromScene(threeJSScene);
    objectMap.delete(line.name);
    linesMap.delete(line.name);
  }
  function updateDisplayForCameraUpdate() {
    pointsMap.forEach(point => {
      point.shallowUpdate();
    });
    tempObjectsMap.forEach(obj => {
      obj.shallowUpdate();
    }); // the temporary objects need to updated when the display changes
  }
  function adjustTextPose() {
    labelsMap.forEach(label => {
      //add or remove labels that are attached to non-ideal points and are outside of the clipping planes of the hyperboloid (plus a little buffer) from the scene
      // This is necessary so that labels that are outside of the clipping planes don't show as the user dollies and zooms.
      if (label.anchorPoint.w > 0) {
        if (
          label.anchorPoint.z > zUpperClip.value ||
          label.anchorPoint.z < zLowerClip.value
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

  return {
    font,
    surfaceIntersections,
    objectIntersections,
    closestIntersectionIsSurface,
    cameraQuaternion,
    cameraDollyDistance,
    cameraFieldOfView,
    cameraOrigin,
    cameraInverseMatrix,
    implementedHETools,
    hyperboloidIsClosestIntersection,
    idealStripIsClosestIntersection,
    ultraStripIsClosestIntersection,
    linesMap,
    pointsMap,
    addTempObject,
    addPoint,
    addLine,
    addLabel,
    getObjectById,
    removePoint,
    removeLabel,
    removeLine,
    setScene,
    adjustTextPose,
    updateDisplayForCameraUpdate
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

import { HENodule } from "@/models-hyperbolic/HENodule";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
// import { ActionMode } from "@/types";
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
import { HYPERBOLIC_LAYER } from "@/global-settings";
import { Text } from "troika-three-text";
export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const objectMap: Map<string, HENodule> = new Map();
  const cameraQuaternion: Ref<Quaternion> = ref(new Quaternion());
  // const cameraCF = new Matrix4();
  const cameraInverseMatrix = ref(new Matrix4());
  const cameraScale = new Vector3();
  const rayCastDirection = new Vector3();
  const cameraOrigin = new Vector3();
  const kleinDiskElevation = ref(Math.cosh(2));
  const { font } = useThreeFont();

  // const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;
  let threeJSCamera: Camera;
  let rayCaster: Raycaster;
  const labelPosition = new Vector3();

  function setScene(s: Scene, c: Camera) {
    threeJSScene = s;
    threeJSCamera = c;

    cameraInverseMatrix.value.copy(threeJSCamera.matrixWorld).invert();
    // const v = new Vector3();
    const q = new Quaternion();
    const scale = new Vector3();
    // c.matrixWorld.decompose(v, q, scale);
    // console.debug("Camera details", v, q, s);
    cameraInverseMatrix.value.decompose(cameraOrigin, q, scale);
    // console.debug("Camera inverse details", cameraOrigin, q, s);
    rayCaster = new Raycaster();
  }

  function getObjectById(id: string) {
    // console.debug(`Searching for ${id} in`, objectMap);
    return objectMap.get(id) ?? null;
  }
  function addPoint(point: HEPoint) {
    point.addToScene(threeJSScene);
    objectMap.set(point.name, markRaw(point));
  }
  function removePoint(point: HEPoint) {
    point.removeFromScene(threeJSScene);
    objectMap.delete(point.name);
  }
  function addLine(line: HELine) {
    line.addToScene(threeJSScene);
    objectMap.set(line.name, markRaw(line));
  }
  function removeLine(line: HELine) {
    line.removeFromScene(threeJSScene);
    objectMap.delete(line.name);
  }
  function adjustTextPose(quat: Quaternion) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    threeJSCamera.matrixWorld.decompose(
      cameraOrigin,
      cameraQuaternion.value,
      cameraScale
    );
    rayCaster.layers.disableAll();
    rayCaster.layers.enable(HYPERBOLIC_LAYER.upperSheet);
    rayCaster.layers.enable(HYPERBOLIC_LAYER.lowerSheet);

    // Look for non-occluded objects
    const [visibleObjects, occludedobjects] = objectMap
      .values()
      .flatMap(obj => obj.group.children)
      .toArray()
      .partition(obj => {
        rayCastDirection.subVectors(cameraOrigin, obj.position);
        rayCaster.set(obj.position, rayCastDirection);
        const occlusions = rayCaster
          .intersectObjects(threeJSScene.children, true)
          .filter(occ => occ.distance > 1e-5);
        // if (occlusions.length > 0) {
        //   const msg = occlusions
        //     // .filter(occ => occ.distance >= 1e-6)
        //     .map(occ => occ.object.name + " @" + occ.distance.toFixed(2))
        //     .join();

        //   // console.debug(`${obj.name} is occluded by ${msg}`);
        // }
        return occlusions.length === 0;
      });
    console.debug(
      "Visible objects",
      visibleObjects.map(obj => obj.name).join(", ")
    );

    const allLabels = objectMap
      .values()
      // This flatMap assumes that the text is attached to its parent
      .flatMap(obj => obj.group.children[0].children)
      .toArray();

    const [occludedLabels, _otherLabels] = allLabels.partition(obj => {
      const pos = visibleObjects.findIndex(x => x.name === obj.parent?.name);
      if (pos < 0) return false;
      // Perform ray cast from the label to the camera
      labelPosition
        .copy(visibleObjects[pos].position)
        .addScaledVector(obj.position, 1);
      rayCastDirection.subVectors(cameraOrigin, labelPosition);
      rayCaster.set(labelPosition, rayCastDirection);
      const labelOcclusions = rayCaster
        .intersectObjects(threeJSScene.children, true)
        .filter(occ => occ.distance > 1e-5);
      // This label is occluded by other objects
      return labelOcclusions.length > 0;
    });

    occludedLabels.forEach(textObj => {
      // Move the label to the other side of the hyperboloid
      textObj.position.multiplyScalar(-1);
      // Adjust the text anchor in the Y direction
      (textObj as Text).anchorY = textObj.position.z > 0 ? "bottom" : "top";
    });
    allLabels.forEach(t => {
      t.quaternion.copy(quat);
    });
  }
  return {
    kleinDiskElevation,
    font,
    surfaceIntersections,
    objectIntersections,
    cameraQuaternion,
    cameraInverseMatrix,
    addPoint,
    addLine,
    getObjectById,
    removePoint,
    removeLine,
    setScene,
    adjustTextPose
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

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
import { LAYER } from "@/global-settings";
export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const labelLayerIntersections: Ref<Intersection[]> = ref([]);
  const objectMap: Map<string, HENodule> = new Map();
  const cameraQuaternion: Ref<Quaternion> = ref(new Quaternion());
  // const cameraCF = new Matrix4();
  const cameraInverseMatrix = ref(new Matrix4());
  const cameraScale = new Vector3();
  const rayCastDirection = new Vector3();
  const cameraOrigin = new Vector3();
  const { font } = useThreeFont();

  // const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;
  let threeJSCamera: Camera;
  let rayCaster: Raycaster;

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
    console.debug("Camera inverse details", cameraOrigin, q, s);
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
  function reorientTextBackup(quat: Quaternion) {
    threeJSCamera.matrixWorld.decompose(
      cameraOrigin,
      cameraQuaternion.value,
      cameraScale
    );
    // console.debug("Camera position 1", cameraOrigin.toFixed(2));
    // cameraInverseMatrix.value.copy(threeJSCamera.matrixWorld).invert();
    // cameraInverseMatrix.value.decompose(
    //   cameraOrigin,
    //   cameraQuaternion.value,
    //   cameraScale
    // );
    // console.debug("Camera origin 2", cameraOrigin.toFixed(2));
    rayCaster.layers.disableAll();
    rayCaster.layers.enable(LAYER.midground);
    // rayCaster.layers.enable(LAYER.foreground);
    // rayCaster.layers.enableAll();

    //   const labels = objectMap
    //     .values()
    //     .flatMap(obj => obj.group.children[0].children);
    //   // const visibleObjects: Set<HENodule> = new Set();
    //   objectMap
    //     .values()
    //     .filter(obj => obj instanceof HEPoint)
    //     .flatMap(p => [...p.group.children, ...p.group.children[0].children])
    //     // .filter(p => {
    //     //   // console.debug("Here is", p);
    //     //   return p.name.startsWith("La");
    //     // })
    //     .forEach(t => {
    //       // console.debug(`Object ${t.name}`);
    //       // if (t.parent) {
    //       //   const occlusions = rayCaster.intersectObjects(
    //       //     threeJSScene.children.filter(obj =>
    //       //       obj.layers.isEnabled(LAYER.midground)
    //       //     )
    //       //   );
    //       //   // if (occlusions.length === 0) {
    //       //   //   console.debug(`Object ${t.name} is visible`);
    //       //   // } else {
    //       //   //   console.debug(
    //       //   //     `Object ${t.name} is occluded by ${occlusions.map(
    //       //   //       obj => obj.object.name
    //       //   //     )}`)

    //       //   // }
    //       // }
    //       t.quaternion.copy(quat);
    //     });
  }
  function reorientText(quat: Quaternion) {
    threeJSCamera.matrixWorld.decompose(
      cameraOrigin,
      cameraQuaternion.value,
      cameraScale
    );
    rayCaster.layers.disableAll();
    rayCaster.layers.enable(LAYER.midground);
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
        if (occlusions.length > 0) {
          const msg = occlusions
            // .filter(occ => occ.distance >= 1e-6)
            .map(occ => occ.object.name + " @" + occ.distance.toFixed(2))
            .join();

          console.debug(`${obj.name} is occluded by ${msg}`);
        }
        return occlusions.length === 0;
      });
    console.debug(
      "Visible objects",
      visibleObjects.map(obj => obj.name).join(", ")
    );
    objectMap
      .values()
      .filter(obj => obj instanceof HEPoint)
      .flatMap(p => p.group.children[0].children)
      .filter(p => {
        // console.debug("Here is", p);
        return p.name.startsWith("La");
      })
      .forEach(t => {
        // console.debug("What is", t);
        t.quaternion.copy(quat);
      });
  }
  return {
    font,
    surfaceIntersections,
    labelLayerIntersections,
    objectIntersections,
    cameraQuaternion,
    cameraInverseMatrix,
    addPoint,
    addLine,
    getObjectById,
    removePoint,
    removeLine,
    setScene,
    reorientText
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

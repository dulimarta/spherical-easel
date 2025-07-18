import { HENodule } from "@/models-hyperbolic/HENodule";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
// import { ActionMode } from "@/types";
import { defineStore } from "pinia";
import { Intersection, Mesh, Object3D, Quaternion, Scene } from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { markRaw } from "vue";
import { ref, Ref } from "vue";
import axios from "axios";
import { useThreeFont } from "@/composables/useThreeFont";
export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const objectMap: Map<string, HENodule> = new Map();
  const cameraQuaternion: Ref<Quaternion> = ref(new Quaternion());
  const { font } = useThreeFont();

  // const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;

  function setScene(s: Scene) {
    threeJSScene = s;
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
  }
  function reorientText(quat: Quaternion) {
    objectMap
      .values()
      .filter(obj => obj instanceof HEPoint)
      .forEach(p => {
        // Using copy() cause the code to crash at runtime ("undefined property")
        // p.mesh[0].children[0].quaternion.set(quat.x, quat.y, quat.z, quat.w);
      });
  }
  return {
    font,
    surfaceIntersections,
    cameraQuaternion,
    objectIntersections,
    addPoint,
    getObjectById,
    removePoint,
    setScene,
    reorientText
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

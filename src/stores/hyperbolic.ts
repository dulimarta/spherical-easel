import { HENodule } from "@/models-hyperbolic/HENodule";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
// import { ActionMode } from "@/types";
import { defineStore } from "pinia";
import { Intersection, Mesh, Object3D, Scene } from "three";
import { markRaw } from "vue";
import { ref, Ref } from "vue";

export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const objectMap: Map<string, HENodule> = new Map();
  // const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;

  function setScene(s: Scene) {
    threeJSScene = s;
  }
  // function setActionMode(mode: ActionMode): void {
  //   actionMode.value = mode;
  //   // this.activeToolName = mode.name;
  // }
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
  return {
    surfaceIntersections,
    objectIntersections,
    addPoint,
    getObjectById,
    removePoint,
    setScene
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

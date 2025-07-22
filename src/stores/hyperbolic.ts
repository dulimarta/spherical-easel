import { HENodule } from "@/models-hyperbolic/HENodule";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
// import { ActionMode } from "@/types";
import { defineStore } from "pinia";
import { Intersection, Quaternion, Scene } from "three";
import { markRaw } from "vue";
import { ref, Ref } from "vue";
import { useThreeFont } from "@/composables/useThreeFont";
export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const surfaceIntersections: Ref<Intersection[]> = ref([]);
  const objectIntersections: Ref<Intersection[]> = ref([]);
  const labelLayerIntersections: Ref<Intersection[]> = ref([]);
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
    addPoint,
    getObjectById,
    removePoint,
    setScene,
    reorientText
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

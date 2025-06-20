import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { ActionMode } from "@/types";
import { defineStore } from "pinia";
import { Intersection, Scene } from "three";
import { ref, Ref } from "vue";

export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const mouseIntersections: Ref<Intersection[]> = ref([]);
  const actionMode: Ref<ActionMode> = ref("move");
  let threeJSScene: Scene;

  function setScene(s: Scene) {
    threeJSScene = s;
  }
  function setActionMode(mode: ActionMode): void {
    actionMode.value = mode;
    // this.activeToolName = mode.name;
  }
  function addPoint(point: HEPoint) {
    point.addToScene(threeJSScene);
  }
  return {
    mouseIntersections,
    actionMode,
    addPoint,
    setScene,
    setActionMode
  };
});

export type HEStoreType = ReturnType<typeof useHyperbolicStore>;

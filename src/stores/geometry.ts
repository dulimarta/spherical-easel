import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { defineStore } from "pinia";
import { Intersection, Scene, Vector3 } from "three";
import { Group } from "two.js/src/group";
import { ref, markRaw, Ref } from "vue";

export const useGeometryStore = defineStore("geometry", () => {
  const objectIntersections: Ref<Intersection[]> = ref([]);
  let layers: Array<Group> = [];
  let threejsScene: Scene | null = null;
  const points: Ref<Array<CKNodule>> = ref([]);
  const nodules: Ref<Array<CKNodule>> = ref([]);

  function setLayers(newLayers: Array<Group>, scene: Scene | null) {
    layers = newLayers;
    threejsScene = scene;
  }

  function getObjectById(id: string): CKNodule | null {
    const pos = nodules.value.findIndex(obj => {
      console.debug(`Checking object with id ${obj.name} against ${id}`);
      return obj.name === id;
    });
    console.debug(
      `Searching for ${id} in`,
      nodules.value,
      " Found at position:",
      pos
    );
    if (pos >= 0) {
      return nodules.value[pos];
    }
    return null;
  }

  function addPoint(g: CKPoint) {
    // Using "markRaw" to prevent Vue from making the CKPoint object reactive,
    // This also solve the issue with calling removeFromLayers(), when VueJS
    // complains with the error message: "cannot access private property".
    points.value.push(markRaw(g));
    nodules.value.push(markRaw(g));
    g.ref?.addToLayers(layers, threejsScene);
    g.labelRef?.addToLayers(layers);
  }

  function removeNodule(objId: number) {
    const idx = nodules.value.findIndex(item => item.id === objId);
    if (idx >= 0) {
      nodules.value.splice(idx, 1);
    }
  }

  function removePoint(objId: number) {
    const idx = points.value.findIndex(item => item.id === objId);
    if (idx >= 0) {
      const obj = points.value[idx];
      obj.ref?.removeFromLayers();
      obj.labelRef?.removeFromLayers();
      points.value.splice(idx, 1);
      removeNodule(objId);
    }
  }

  function clearGeometries() {
    points.value.forEach(g => {
      g.ref?.removeFromLayers();
    });
    points.value.splice(0, points.value.length);
  }

  function findNearByNodules(unitIdealVector: Vector3): Array<CKNodule> {
    const z: CKNodule[] = nodules.value.filter((obj: CKNodule) =>
      obj.isHitAt(unitIdealVector)
    );
    return z;
  }

  return {
    /* properties */
    points,
    objectIntersections,

    /* methods */
    findNearByNodules,
    setLayers,
    addPoint,
    removePoint,
    clearGeometries,
    getObjectById
  };
});

export type GeometryStoreType = ReturnType<typeof useGeometryStore>;

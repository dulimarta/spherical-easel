import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { defineStore } from "pinia";
import { Vector3 } from "three";
import { Group } from "two.js/src/group";
import { ref, markRaw, Ref } from "vue";

export const useGeometryStore = defineStore("geometry", () => {
  let layers: Array<Group> = [];
  const points: Ref<Array<CKNodule>> = ref([]);
  const nodules: Ref<Array<CKNodule>> = ref([]);

  function setLayers(newLayers: Array<Group>) {
    layers = newLayers;
  }
  function addPoint(g: CKPoint) {
    // Using "markRaw" to prevent Vue from making the CKPoint object reactive,
    // This also solve the issue with calling removeFromLayers(), when VueJS
    // complains with the error message: "cannot access private property".
    points.value.push(markRaw(g));
    nodules.value.push(markRaw(g));
    g.ref?.addToLayers(layers);
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

    /* methods */
    findNearByNodules,
    setLayers,
    addPoint,
    removePoint,
    clearGeometries
  };
});

export type GeometryStoreType = ReturnType<typeof useGeometryStore>;

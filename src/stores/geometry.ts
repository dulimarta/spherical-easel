import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { defineStore } from "pinia";
import { Intersection, Quaternion, Scene, Vector3 } from "three";
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
    g.labelRef?.addToLayers(layers, threejsScene);
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
      if (obj instanceof CKNodule) {
        obj.ref?.removeFromLayers();
        obj.labelRef?.removeFromLayers();
        if (obj.ref) obj.unsubscribe(obj.ref);
        if (obj.labelRef) obj.unsubscribe(obj.labelRef);
      }
      points.value.splice(idx, 1);
      removeNodule(objId);
    }
  }

  function clearGeometries() {
    points.value.forEach(g => {
      if (g instanceof CKNodule) {
        g.ref?.removeFromLayers();
        g.labelRef?.removeFromLayers();
        if (g.ref) g.unsubscribe(g.ref);
        if (g.labelRef) g.unsubscribe(g.labelRef);
      }
    });
    points.value.splice(0, points.value.length);
  }

  function findNearByNodules(unitIdealVector: Vector3): Array<CKNodule> {
    const z: CKNodule[] = nodules.value.filter((obj: CKNodule) =>
      obj.isHitAt(unitIdealVector)
    );
    return z;
  }

  function adjustLabelPose(qc: Quaternion) {
    console.debug("Adjust orientation of labels");
    nodules.value
      .filter(obj => obj instanceof CKPoint)
      .filter(pt => pt.labelRef)
      .forEach(p => {
        console.debug(`Point ${p.name} with `, p.labelRef?.name);
        p.labelRef?.lookAtCamera(qc);
      });
  }
  return {
    /* properties */
    points,
    objectIntersections,

    /* methods */
    adjustLabelPose,
    findNearByNodules,
    setLayers,
    addPoint,
    removePoint,
    clearGeometries,
    getObjectById
  };
});

export type GeometryStoreType = ReturnType<typeof useGeometryStore>;

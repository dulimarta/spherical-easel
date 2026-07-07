import { CKLine } from "@/models/CKLine";
import { CKNodule } from "@/models/CKNodule";
import { CKPoint } from "@/models/CKPoint";
import { CKSegment } from "@/models/CKSegment";
import { defineStore } from "pinia";
import { Intersection, Quaternion, Scene, Vector3 } from "three";
import { ref, markRaw, Ref } from "vue";

export const useGeometryStore = defineStore("geometry", () => {
  const objectIntersections: Ref<Intersection[]> = ref([]);
  let threejsScene: Scene;
  const points: Ref<Array<CKNodule>> = ref([]);
  const lines: Ref<Array<CKNodule>> = ref([]);
  const nodules: Ref<Array<CKNodule>> = ref([]);

  function setScene(scene: Scene) {
    // layers = newLayers;
    threejsScene = scene;
  }

  function getObjectById(id: string): CKNodule | null {
    const pos = nodules.value.findIndex(obj => {
      // console.debug(`Checking object with id ${obj.name} against ${id}`);
      return obj.name === id;
    });
    // console.debug(
    //   `Searching for ${id} in`,
    //   nodules.value,
    //   " Found at position:",
    //   pos
    // );
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
    g.ref?.addToScene(threejsScene);
    g.labelRef?.addToScene(threejsScene);
  }

  function removePoint(objId: number) {
    const idx = points.value.findIndex(item => item.id === objId);
    if (idx >= 0) {
      const obj = points.value[idx];
      if (obj instanceof CKNodule) {
        obj.ref?.removeFromScene();
        obj.labelRef?.removeFromScene();
        if (obj.ref) obj.unsubscribe(obj.ref);
        if (obj.labelRef) obj.unsubscribe(obj.labelRef);
      }
      points.value.splice(idx, 1);
      removeNodule(objId);
    }
  }

  function addLineOrSegment(g: CKLine | CKSegment) {
    lines.value.push(markRaw(g));
    nodules.value.push(markRaw(g));
    g.ref?.addToScene(threejsScene);
    g.labelRef?.addToScene(threejsScene);
  }

  function removeLine(objId: number) {
    const idx = lines.value.findIndex(item => item.id === objId);
    if (idx >= 0) {
      const obj = lines.value[idx];
      if (obj instanceof CKNodule) {
        obj.ref?.removeFromScene();
        obj.labelRef?.removeFromScene();
        if (obj.ref) obj.unsubscribe(obj.ref);
        if (obj.labelRef) obj.unsubscribe(obj.labelRef);
      }
      lines.value.splice(idx, 1);
      removeNodule(objId);
    }
  }
  function removeNodule(objId: number) {
    const idx = nodules.value.findIndex(item => item.id === objId);
    if (idx >= 0) {
      nodules.value.splice(idx, 1);
    }
  }

  function clearGeometries() {
    points.value.forEach(g => {
      if (g instanceof CKNodule) {
        g.ref?.removeFromScene();
        g.labelRef?.removeFromScene();
        if (g.ref) g.unsubscribe(g.ref);
        if (g.labelRef) g.unsubscribe(g.labelRef);
      }
    });
    points.value.splice(0, points.value.length);
  }

  function findNearByNodules(unitIdealVector: Vector3): Array<CKNodule> {
    // const z: CKNodule[] = nodules.value.filter((obj: CKNodule) =>
    //   obj.isHitAt(unitIdealVector)
    // );
    return [];
  }

  function adjustLabelPose(qc: Quaternion) {
    // console.debug("Adjust orientation of labels using quat", qc);
    nodules.value
      .filter(obj => obj instanceof CKPoint)
      .filter(pt => pt.labelRef)
      .forEach(p => {
        // console.debug(`Point ${p.name} with `, p.labelRef?.name);
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
    setScene,
    addPoint,
    removePoint,
    addLineOrSegment,
    removeLine,
    clearGeometries,
    getObjectById
  };
});

export type GeometryStoreType = ReturnType<typeof useGeometryStore>;

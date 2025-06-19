import { defineStore } from "pinia";
import { Intersection } from "three";
import { ref, Ref } from "vue";

export const useHyperbolicStore = defineStore("hyperbolic", () => {
  const mouseIntersections: Ref<Intersection[]> = ref([])
  
  return {
    mouseIntersections
  }
})
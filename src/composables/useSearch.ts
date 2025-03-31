import { ref, watch } from "vue";
import { useConstructionStore } from "@/stores/construction";
import { SphericalConstruction } from "src/types";

export function useSearch(searchKey: string) {
  const searchKeyRef = ref(searchKey); // wrap the string in a ref
  const constructionStore = useConstructionStore();
  const filteredPrivateConstructions = ref<SphericalConstruction[]>([]);
  const filteredPublicConstructions = ref<SphericalConstruction[]>([]);
  const filteredStarredConstructions = ref<SphericalConstruction[]>([]);

  watch(searchKeyRef, (newKey) => {
    if (!newKey) {
      resetFilters();
      return;
    }
    filterConstructions(newKey);
  });

  function filterConstructions(key: string) {
    filteredPrivateConstructions.value = constructionStore.privateConstructions.filter(
      (c) => c.description.toLowerCase().includes(key.toLowerCase())
    );
    filteredPublicConstructions.value = constructionStore.publicConstructions.filter(
      (c) => c.description.toLowerCase().includes(key.toLowerCase())
    );
    filteredStarredConstructions.value = constructionStore.starredConstructions.filter(
      (c) => c.description.toLowerCase().includes(key.toLowerCase())
    );
  }

  function resetFilters() {
    filteredPrivateConstructions.value = [...constructionStore.privateConstructions];
    filteredPublicConstructions.value = [...constructionStore.publicConstructions];
    filteredStarredConstructions.value = [...constructionStore.starredConstructions];
  }

  return {
    filteredPrivateConstructions,
    filteredPublicConstructions,
    filteredStarredConstructions,
    resetFilters
  };
}

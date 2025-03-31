import { ref } from "vue";
import { SphericalConstruction } from "@/types/ConstructionTypes";

export function useFolderActions() {
  const checkedConstructions = ref([]);
  const newFolderName = ref("");

  function moveConstruction(
    constructions: SphericalConstruction[],
    folderName: string
  ) {
    if (!folderName || constructions.length === 0) {
      alert("Please select a construction and enter a folder name.");
      return;
    }
    console.log(`Moving constructions to: ${folderName}`);
    newFolderName.value = "";
  }

  return {
    checkedConstructions,
    newFolderName,
    moveConstruction
  };
}

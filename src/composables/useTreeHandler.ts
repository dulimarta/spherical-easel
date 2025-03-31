import { ref, watch } from "vue";

interface TreeItem {
    id: string;
    title: string;
    children?: TreeItem[];
  }

export function useTreeHandler(treeItems: TreeItem[]) {
  const selectedItems = ref<string[]>([]);
  const openPanels = ref<string[]>([]);

  function handleNodeSelection(value: string[]) {
    console.log("Selected node(s):", value);
    selectedItems.value = [...value];
    openPanels.value = selectedItems.value.includes("private")
      ? ["private"]
      : selectedItems.value.includes("public")
      ? ["public"]
      : selectedItems.value.includes("starred")
      ? ["starred"]
      : [];
  }

  watch(
    () => treeItems,
    (newValue) => {
      console.log("Tree Items Updated:", newValue);
    },
    { deep: true }
  );

  return {
    selectedItems,
    openPanels,
    handleNodeSelection
  };
}

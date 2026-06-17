import { PointHandler } from "@/eventHandlers-spherical/NewPointHandler";
import { SphericalTool } from "@/eventHandlers-spherical/ToolStrategy";
import { ActionMode } from "@/types";
import { useEventListener } from "@vueuse/core";
import { Scene, Vector3 } from "three/webgpu";
import { onMounted, Ref } from "vue";
export function useSphericTools(
  scene: Scene,
  currentPosition: Ref<Vector3 | null>
) {
  let currentTool: SphericalTool | null = null;
  let pointTool: SphericalTool | null = null;
  onMounted(() => {
    useEventListener("mousemove", doMouseMoved);
  });

  function doMouseMoved(event: MouseEvent) {
    currentTool?.mouseMoved(event, currentPosition.value);
  }

  function setCurrentTool(mode: ActionMode) {
    currentTool = null;
    switch (mode) {
      case "point":
        if (pointTool === null) pointTool = new PointHandler(scene);
        currentTool = pointTool;
        break;
    }
  }

  return { setCurrentTool };
}

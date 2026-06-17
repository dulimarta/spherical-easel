import { ActionMode } from "@/types";
import { defineStore } from "pinia";
import { PointHandler } from "@/eventHandlers/PointHandler";
import { Group } from "two.js/src/group";
import { onMounted, onUnmounted, watch } from "vue";
import { useSEStore } from "./se";
import MouseHandler from "@/eventHandlers/MouseHandler";
let pointTool: PointHandler | null = null;

export const useTools = defineStore("tools", () => {
  // const seStore = useSEStore();
  let currentTool: MouseHandler | null = null;
  let layers: Array<Group> = [];
  let target: HTMLCanvasElement | null = null;

  onMounted(() => {
    console.debug("Tools store mounted", target);
  });
  onUnmounted(() => {
    console.debug("Tools store mounted", target);
    target?.removeEventListener("mousemove", doMouseMoved);
    target?.removeEventListener("mousedown", doMouseDown);
    target?.removeEventListener("mouseup", doMouseUp);
    target?.removeEventListener("mouseleave", doMouseLeave);
  });

  function configure(twoLayers: Array<Group>, canvas: HTMLCanvasElement) {
    layers = twoLayers;
    target = canvas;
    target.addEventListener("mousemove", doMouseMoved);
    target.addEventListener("mousedown", doMouseDown);
    target.addEventListener("mouseup", doMouseUp);
    target.addEventListener("mouseleave", doMouseLeave);
  }
  function setCurrentTool(mode: ActionMode) {
    currentTool?.deactivate();
    switch (mode) {
      case "point":
        // if (pointTool === null) pointTool = new PointHandler(layers);
        // currentTool = pointTool;
        break;
    }
    currentTool?.activate();
  }

  function doMouseMoved(event: MouseEvent) {
    currentTool?.mouseMoved(event);
  }
  function doMouseDown(event: MouseEvent) {
    currentTool?.mousePressed(event);
  }
  function doMouseUp(event: MouseEvent) {
    currentTool?.mouseReleased(event);
  }
  function doMouseLeave(event: MouseEvent) {
    currentTool?.mouseLeave(event);
  }
  return { currentTool, setCurrentTool, configure };
});

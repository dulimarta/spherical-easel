<template>
  <!-- <CurrentToolSelection /> -->
  <div id="sphereContainer">
    <div id="canvas" ref="canvas"></div>
    <div class="anchored top left">
      <div
        v-for="(shortcut, index) in topLeftShortcuts"
        :key="index"
        :style="listItemStyle(index, 'left', 'top')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div>
    <div class="anchored bottom left">
      <div
        v-for="(shortcut, index) in bottomLeftShortcuts"
        :key="index"
        :style="listItemStyle(index, 'left', 'bottom')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div>
    <div class="anchored bottom right">
      <div
        v-for="(shortcut, index) in bottomRightShortcuts"
        :key="index"
        :style="listItemStyle(index, 'right', 'bottom')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
  watch,
  computed
} from "vue";
import SETTINGS, { LAYER } from "@/global-settings";
import ShortcutIcon from "./ShortcutIcon.vue";
import { ZoomSphereCommand } from "@/commands/ZoomSphereCommand";
import { Command } from "@/commands/Command";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import CurrentToolSelection from "./CurrentToolSelection.vue";
import SelectionHandler from "@/eventHandlers/SelectionHandler";
import PointHandler from "@/eventHandlers/PointHandler";
import LineHandler from "@/eventHandlers/LineHandler";
import SegmentHandler from "@/eventHandlers/SegmentHandler";
import CircleHandler from "@/eventHandlers/CircleHandler";
import RotateHandler from "@/eventHandlers/RotateHandler";
import PointOnOneDimensionalHandler from "@/eventHandlers/PointOnOneOrTwoDimensionalHandler";
import IntersectionPointHandler from "@/eventHandlers/IntersectionPointHandler";
import AntipodalPointHandler from "@/eventHandlers/AntipodalPointHandler";
import PolarObjectHandler from "@/eventHandlers/PolarObjectHandler";
import PanZoomHandler, { ZoomMode } from "@/eventHandlers/PanZoomHandler";
import DeleteHandler from "@/eventHandlers/DeleteHandler";
import HideObjectHandler from "@/eventHandlers/HideObjectHandler";
import SegmentLengthHandler from "@/eventHandlers/SegmentLengthHandler";
import PointDistanceHandler from "@/eventHandlers/PointDistanceHandler";
import AngleHandler from "@/eventHandlers/AngleHandler";
import CoordinateHandler from "@/eventHandlers/PointCoordinateHandler";
import ToggleLabelDisplayHandler from "@/eventHandlers/ToggleLabelDisplayHandler";
import PerpendicularLineThruPointHandler from "@/eventHandlers/PerpendicularLineThruPointHandler";
import TangentLineThruPointHandler from "@/eventHandlers/TangentLineThruPointHandler";
import IconFactoryHandler from "@/eventHandlers/IconFactoryHandler";
import EllipseHandler from "@/eventHandlers/EllipseHandler";
import PolygonHandler from "@/eventHandlers/PolygonHandler";
import NSectSegmentHandler from "@/eventHandlers/NSectSegmentHandler";
import NSectAngleHandler from "@/eventHandlers/NSectAngleHandler";
import ThreePointCircleHandler from "@/eventHandlers/ThreePointCircleHandler";
import MeasuredCircleHandler from "@/eventHandlers/MeasuredCircleHandler";
import TranslationTransformationHandler from "@/eventHandlers/TranslationTransformationHandler";

import EventBus from "@/eventHandlers/EventBus";
import MoveHandler from "../eventHandlers/MoveHandler";
import { ActionMode, ShortcutIconType } from "@/types";
import colors from "vuetify/lib/util/colors";
import { SELabel } from "@/models/SELabel";
import FileSaver from "file-saver";
import Nodule from "@/plottables/Nodule";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import Two from "two.js";
import { SEExpression } from "@/models/SEExpression";
import RotationTransformationHandler from "@/eventHandlers/RotationTransformationHandler";
import ReflectionTransformationHandler from "@/eventHandlers/ReflectionTransformationHandler";
import PointReflectionTransformationHandler from "@/eventHandlers/PointReflectionTransformationHandler";
import InversionTransformationHandler from "@/eventHandlers/InversionTransformationHandler";
import { SETransformation } from "@/models/SETransformation";
import ApplyTransformationHandler from "@/eventHandlers/ApplyTransformationHandler";
import { SENodule } from "@/models/SENodule";
import { useI18n } from "vue-i18n";
import ToolGroups from "./ToolGroups.vue";
// import i18n from "@/i18n";

const seStore = useSEStore();
const {
  actionMode,
  zoomMagnificationFactor,
  zoomTranslation,
  seLabels,
  layers,
  expressions,
  buttonSelection
} = storeToRefs(seStore);
const { t } = useI18n();

const props = withDefaults(defineProps<{ canvasSize: number,isEarthMode: boolean }>(), {
  canvasSize: 240,
  isEarthMode: false
});


const canvas: Ref<HTMLDivElement | null> = ref(null);
const topLeftShortcuts = computed((): ShortcutIconType[] => {
  return [
    {
      tooltipMessage: "main.UndoLastAction",
      icon: SETTINGS.icons.undo.props.mdiIcon,
      clickFunc: Command.undo,
      iconColor: "blue",
      disableBtn: false //&& !stylePanelMinified.value || !undoEnabled
    },
    {
      tooltipMessage: "main.RedoLastAction",
      icon: SETTINGS.icons.redo.props.mdiIcon,
      clickFunc: Command.redo,
      iconColor: "blue",
      disableBtn: false // !stylePanelMinified.value || !undoEnabled
    }
  ];
});
const bottomLeftShortcuts = computed((): ShortcutIconType[] => {
  return [
    {
      tooltipMessage: "buttons.CreatePointToolTipMessage",
      icon: "$point",
      iconColor: "blue",
      disableBtn: false,
      action: "point"
    },

    {
      tooltipMessage: "buttons.CreateLineToolTipMessage",
      icon: "$line",
      iconColor: "blue",
      disableBtn: false,
      action: "line"
    },

    {
      tooltipMessage: "buttons.CreateLineSegmentToolTipMessage",
      icon: "$segment",
      iconColor: "blue",
      disableBtn: false,
      action: "segment"
    },

    {
      tooltipMessage: "buttons.CreateCircleToolTipMessage",
      icon: "$circle",
      iconColor: "blue",
      disableBtn: false,
      action: "circle"
    }
  ];
});

const bottomRightShortcuts = computed((): ShortcutIconType[] => {
  return [
    {
      tooltipMessage: "buttons.PanZoomInToolTipMessage",
      icon: SETTINGS.icons.zoomIn.props.mdiIcon,
      iconColor: "blue",
      disableBtn: false,
      action: "zoomIn"
    },

    {
      tooltipMessage: "buttons.PanZoomOutToolTipMessage",
      icon: SETTINGS.icons.zoomOut.props.mdiIcon,
      iconColor: "blue",
      disableBtn: false,
      action: "zoomOut"
    },
    {
      tooltipMessage: "buttons.ZoomFitToolTipMessage",
      icon: SETTINGS.icons.zoomFit.props.mdiIcon,
      iconColor: "blue",
      disableBtn: false,
      action: "zoomFit"
    }
  ];
});
/**
 * The main (the only one) TwoJS object that contains the layers (each a Group) making up the screen graph
 * First layers  (Groups) are added to the twoInstance (index by the enum LAYER from
 * global-settings.ts), then TwoJs objects (Path, Ellipse, etc..) are added to the
 * appropriate layer. This object is refreshed at 60 fps (in constructor -- autostart: true).
 */
let twoInstance!: Two;

/**
 * The circle that is the end of the projection of the Default Sphere in the Default Screen Plane
 */
let boundaryCircle!: Two.Circle;
/**
 * The Global Vuex Store
 */

/** Tools for handling user input */
let currentTool: ToolStrategy | null = null;
let selectTool: SelectionHandler | null = null;
let pointTool: PointHandler | null = null;
let lineTool: LineHandler | null = null;
let segmentTool: SegmentHandler | null = null;
let circleTool: CircleHandler | null = null;
let ellipseTool: EllipseHandler | null = null;
let rotateTool: RotateHandler | null = null;
let zoomTool: PanZoomHandler | null = null;
let moveTool: MoveHandler | null = null;
let pointOnOneDimensionalTool: PointOnOneDimensionalHandler | null = null;
let antipodalPointTool: AntipodalPointHandler | null = null;
let polarObjectTool: PolarObjectHandler | null = null;
let intersectTool: IntersectionPointHandler | null = null;
let deleteTool: DeleteHandler | null = null;
let hideTool: HideObjectHandler | null = null;
let segmentLengthTool: SegmentLengthHandler | null = null;
let pointDistanceTool: PointDistanceHandler | null = null;
let angleTool: AngleHandler | null = null;
let coordinateTool: CoordinateHandler | null = null;
let toggleLabelDisplayTool: ToggleLabelDisplayHandler | null = null;
let perpendicularLineThruPointTool: PerpendicularLineThruPointHandler | null =
  null;
let tangentLineThruPointTool: TangentLineThruPointHandler | null = null;
let iconFactoryTool: IconFactoryHandler | null = null;
let measureTriangleTool: PolygonHandler | null = null;
let measurePolygonTool: PolygonHandler | null = null;
let midpointTool: NSectSegmentHandler | null = null;
let nSectSegmentTool: NSectSegmentHandler | null = null;
let angleBisectorTool: NSectAngleHandler | null = null;
let nSectAngleTool: NSectAngleHandler | null = null;
let threePointCircleTool: ThreePointCircleHandler | null = null;
let measuredCircleTool: MeasuredCircleHandler | null = null;
let translationTool: TranslationTransformationHandler | null = null;
let rotationTool: RotationTransformationHandler | null = null;
let reflectionTool: ReflectionTransformationHandler | null = null;
let pointReflectionTool: PointReflectionTransformationHandler | null = null;
let inversionTool: InversionTransformationHandler | null = null;
let applyTransformationTool: ApplyTransformationHandler | null = null;

/**
 * The layers for displaying the various objects in the right way. So a point in the
 * background is not displayed over a line in the foreground
 */
// readonly layers!: Two.Group[];

onBeforeMount((): void => {
  twoInstance = new Two({
    width: props.canvasSize,
    height: props.canvasSize,
    autostart: true
    // ratio: window.devicePixelRatio
  });
  // twoInstance.scene.matrix.manual = true;
  // Clear layer array
  // layers.splice(0);

  //#region addlayers
  // Record the text layer number so that the y axis is not flipped for them
  const textLayers = [
    LAYER.foregroundText,
    LAYER.backgroundText,
    LAYER.foregroundTextGlowing,
    LAYER.backgroundTextGlowing
  ].map(Number); // shortcut for .map(x => Number(x))

  // Create a detached group to prevent duplicate group ID
  // in TwoJS scene (https://github.com/jonobr1/two.js/issues/639)
  const dummy_group = new Two.Group();
  let groups: Array<Two.Group> = [];
  for (const layer in LAYER) {
    const layerIdx = Number(layer);
    if (!isNaN(layerIdx)) {
      // Create the layers
      const newLayer = new Two.Group();
      if (layerIdx === LAYER.background)
        console.debug("Background layer is", newLayer.id);
      if (layerIdx === LAYER.foreground)
        console.debug("Foreground layer is", newLayer.id);
      // newLayer.matrix.manual = true;
      // Undo the y-flip on text layers
      if (textLayers.indexOf(layerIdx) >= 0) {
        // Not in textLayers
        newLayer.scale = new Two.Vector(1, -1);
        // newLayer.matrix.scale(1, -1);
      }

      newLayer.addTo(twoInstance.scene);
      groups.push(newLayer);
    }
  }
  //#endregion addlayers

  // The midground is where the temporary objects and the boundary circle were drawn TODO: Needed?
  //sphereCanvas = layers[LAYER.midground];
  // console.info("Sphere canvas ID", sphereCanvas.id);
  // Add the layers to the store
  seStore.init();
  seStore.setLayers(groups);

  // Draw the boundary circle in the default radius
  // and scale it later to fit the canvas
  boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
  boundaryCircle.noFill();
  boundaryCircle.stroke = "rgba(255, 0, 0, 0.2)";

  boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth;
  boundaryCircle.addTo(layers.value[Number(LAYER.midground)]);

  //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
  Nodule.idPlottableDescriptionMap.set(String(boundaryCircle.id), {
    type: "boundaryCircle",
    side: "mid",
    fill: false,
    part: ""
  });

  // Draw horizontal and vertical lines (just for debugging)
  // const R = SETTINGS.boundaryCircle.radius;
  // const hLine = new Line(-R, 0, R, 0);
  // const vLine = new Line(0, -R, 0, R);
  // hLine.stroke = "red";
  // vLine.stroke = "green";
  // sphereCanvas.add(
  //   hLine,
  //   vLine,
  //   new Line(100, -R, 100, R),
  //   new Line(-R, 100, R, 100)
  // );
  //visitor = new RotationVisitor();

  // Create the tools/handlers
  rotateTool = new RotateHandler(layers.value);
  currentTool = rotateTool;
  // Postpone the instantiation of the remaining tools to on-demand
  // to avoid runtime error when the tools depend of Pinia initialization

  // Add Event Bus (a Vue component) listeners to change the display of the sphere - rotate and Zoom/Pan
  EventBus.listen("sphere-rotate", handleSphereRotation);
  EventBus.listen("zoom-updated", updateView);
  EventBus.listen("export-current-svg", getCurrentSVGForIcon);
  EventBus.listen("construction-loaded", animateCanvas);
  EventBus.listen(
    "measured-circle-set-temporary-radius",
    measuredCircleSetTemporaryRadius
  );
  EventBus.listen("set-expression-for-tool", setExpressionForTool);
  EventBus.listen("set-transformation-for-tool", setTransformationForTool);
  EventBus.listen("delete-node", deleteNode);
  // EventBus.listen("dialog-box-is-active", dialogBoxIsActive);
  // EventBus.listen(
  //   "set-point-visibility-and-label",
  //   setPointInitialVibilityAndLabel
  // );
});

onMounted((): void => {
  // Put the main js instance into the canvas
  twoInstance.appendTo(canvas.value!);
  // Set up the listeners
  canvas.value!.addEventListener("mousemove", handleMouseMoved);
  canvas.value?.addEventListener("mousedown", handleMousePressed);
  canvas.value?.addEventListener("mouseup", handleMouseReleased);
  canvas.value?.addEventListener("mouseleave", handleMouseLeave);
  canvas.value?.addEventListener("wheel", handleMouseWheel);

  // Add the listener to disable the context menu because without this line of code, if the user activates a tool,
  // then *first* presses ctrl key, then mouse clicks, a context menu appears and the functionality of the tool is
  // unpredictable. (In the case of the move tool, if the user first clicks, then presses ctrl, the behavior is fine.)
  // source: https://www.sitepoint.com/community/t/how-do-i-disable-the-context-menu-in-chrome-on-a-mac/346738
  // I can't see a good way to remove this listener
  // IS THIS A GOOD IDEA? Maybe not
  canvas.value?.addEventListener("contextmenu", event =>
    event.preventDefault()
  );

  watch(()=>props.isEarthMode,()=>{
    if(!props.isEarthMode){
      let i = 0;
      for (const layer of Object.values(LAYER).filter((layer)=>typeof layer !== "number")) {
        if((layer as string).includes("background")){
          (seStore.layers[i] as any).visible = true;
        }
        i++;
      }
    }else{

      // console.log(Object.values(LAYER));
      // (seStore.layers[Number(LAYER.background)] as any).visible = false;
      // (seStore.layers[Number(LAYER.backgroundAngleMarkers)] as any).visible = false;
      let i = 0;
      for (const layer of Object.values(LAYER).filter((layer)=>typeof layer !== "number")) {
        if((layer as string).includes("background")){
          (seStore.layers[i] as any).visible = false;
        }
        i++;
      }
    }
      // seStore.layers[Number(LAYER.midground)].visible = false;

  })
  // canvas.value!.style.width = twoInstance.width.toString() + "px";
  // canvas.value!.style.height = twoInstance.height.toString() + "px";
  // Set the canvas size to the window size
  // Make the canvas accessible to other components which need
  // to grab the SVG contents of the sphere
  watch(()=>(seStore.canvasWidth),()=>{
    canvas.value!.style.width = seStore.canvasWidth.toString() + "px";
    canvas.value!.style.height = seStore.canvasWidth.toString() + "px";
  })
  seStore.setCanvas(canvas.value!);
  updateView();
});

onBeforeUnmount((): void => {
  canvas.value?.removeEventListener("mousemove", handleMouseMoved);
  canvas.value?.removeEventListener("mousedown", handleMousePressed);
  canvas.value?.removeEventListener("mouseup", handleMouseReleased);
  canvas.value?.removeEventListener("mouseleave", handleMouseLeave);
  canvas.value?.removeEventListener("wheel", handleMouseWheel);
  // Does this remove the context menu listener? I'm not sure.
  canvas.value?.removeEventListener("contextmenu", event =>
    event.preventDefault()
  );

  EventBus.unlisten("sphere-rotate");
  EventBus.unlisten("zoom-updated");
  EventBus.unlisten("export-current-svg");
  EventBus.unlisten("construction-loaded");
  EventBus.unlisten("measured-circle-set-temporary-radius");
  EventBus.unlisten("set-expression-for-tool");
  EventBus.unlisten("set-transformation-for-tool");
  EventBus.unlisten("delete-node");
  // EventBus.unlisten("dialog-box-is-active");
});

watch(
  () => props.canvasSize,
  (size: number): void => {
    twoInstance.width = size;
    twoInstance.height = size;
    // layers.forEach(z => {
    //   z.translation.set(size / 2, size / 2);
    // });

    const radius = size / 2 - 16; // 16-pixel gap
    // setSphereRadius(radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    //zoomMagnificationFactor = ratio;
    //set the zoom magnification in the store so that all geometric/plottable objects are updated.
    seStore.setZoomMagnificationFactor(ratio);
    // Each window size gets its own zoom matrix
    // When you resize a window the zoom resets
    zoomTranslation.value.splice(0);
    // zoomTranslation.push(size / 2, size / 2);
    zoomTranslation.value.push(0, 0);

    updateView();
    // record the canvas width for the SELabel so that the bounding box of the text can be computed correctly
    seStore.setCanvasWidth(size);
  }
);

/** Apply the affine transform (m) to the entire TwoJS SVG tree! */

// The translation element of the CSS transform matrix
// is actually the pivot/origin of the zoom

//#region updateView
function updateView() {
  // Get the current maginification factor and translation vector
  const mag = zoomMagnificationFactor.value;
  const transVector = zoomTranslation;
  const origin = props.canvasSize / 2;

  twoInstance.scene.translation = new Two.Vector(
    origin + transVector.value[0],
    origin + transVector.value[1]
  );
  twoInstance.scene.scale = new Two.Vector(mag, -mag);
  // twoInstance.scene.matrix
  //   .identity()
  //   .translate(origin + transVector[0], origin + transVector[1]) // Order of these two operations
  //   .scale(mag, -mag); // (translate & scale) is important
  //Now update the display of the arrangement (i.e. make sure the labels are not too far from their associated objects)
  seLabels.value.forEach((l: SELabel) => {
    l.update();
  });
}
//#endregion updateView

function handleMouseWheel(event: WheelEvent): void {
  // Compute (pixelX,pixelY) = the location of the mouse release in pixel coordinates relative to
  //  the top left of the sphere frame. This is a location *post* affine transformation
  const target = (event.currentTarget || event.target) as HTMLDivElement;
  const boundingRect = target.getBoundingClientRect();
  const pixelX = event.clientX - boundingRect.left - boundingRect.width / 2;
  const pixelY = event.clientY - boundingRect.top - boundingRect.height / 2;
  event.preventDefault();

  // Compute the fraction to zoom in or out by
  let scrollFraction = event.deltaY / boundingRect.height;
  if (event.ctrlKey) {
    // Flip the sign for pinch/zoom gestures on Mac trackpad
    scrollFraction *= -1;
  }
  // Get the current magnification factor and set a variable for the next one
  const currentMagFactor = zoomMagnificationFactor;
  let newMagFactor = currentMagFactor;
  // Set the next magnification factor. Positive scroll fraction means zoom out, negative zoom in.
  if (scrollFraction < 0) {
    if (currentMagFactor.value < SETTINGS.zoom.minMagnification) {
      console.error(
        `Exceeded zoom out limit ${SETTINGS.zoom.maxMagnification}`
      );
      EventBus.fire("show-alert", {
        key: `handlers.panZoomHandlerZoomOutLimitReached`,
        keyOptions: {},
        type: "warning"
      });
      return;
    }
    newMagFactor.value =
      (1 - Math.abs(scrollFraction)) * currentMagFactor.value;
  }
  if (scrollFraction > 0) {
    if (currentMagFactor.value > SETTINGS.zoom.maxMagnification) {
      console.error(`Exceeded zoom in limit ${SETTINGS.zoom.minMagnification}`);
      EventBus.fire("show-alert", {
        key: `handlers.panZoomHandlerZoomInLimitReached`,
        keyOptions: {},
        type: "warning"
      });
      return;
    }
    newMagFactor.value = (1 + scrollFraction) * currentMagFactor.value;
  }
  // Get the current translation vector to allow us to untransform the CSS transformation
  const currentTranslationVector = [
    zoomTranslation.value[0],
    zoomTranslation.value[1]
  ];

  // Compute (untransformedPixelX,untransformedPixelY) which is the location of the mouse
  // wheel event *pre* affine transformation
  const untransformedPixelX =
    (pixelX - currentTranslationVector[0]) / currentMagFactor.value;
  const untransformedPixelY =
    (pixelY - currentTranslationVector[1]) / currentMagFactor.value;
  // Compute the new translation Vector. We want the untransformedPixel vector to be mapped
  // to the pixel vector under the new magnification factor. That is, if
  //  Z(x,y)= newMagFactor*(x,y) + newTranslationVector
  // then we must have
  //  Z(untransformedPixel) = pixel Vector
  // Solve for newTranslationVector yields

  const newTranslationVector = [
    pixelX - untransformedPixelX * newMagFactor.value,
    pixelY - untransformedPixelY * newMagFactor.value
  ];
  // When zooming out, add extra translation so the pivot of
  // zoom is eventually (0,0) when the magnification factor reaches 1
  if (newMagFactor.value < currentMagFactor.value) {
    if (newMagFactor.value > 1) {
      const fraction = (newMagFactor.value - 1) / (currentMagFactor.value - 1);
      newTranslationVector[0] *= fraction;
      newTranslationVector[1] *= fraction;
    } else {
      newTranslationVector[0] = 0;
      newTranslationVector[1] = 0;
    }
  }

  // Set the new magnification factor and the next translation vector in the store
  // zoomMagnificationFactor = newMagFactor;
  seStore.setZoomMagnificationFactor(newMagFactor.value); //must be set this way so that plottables resize correctly
  zoomTranslation.value.splice(0);
  zoomTranslation.value.push(...newTranslationVector);
  // Update the display
  updateView();
  // Query to see if the last command on the stack was also a zoom sphere command. If it was, simply update that command with the new
  // magnification factor and translations vector. If the last command wasn't a zoom sphere command, push a new one onto the stack.
  const commandStackLength = Command.commandHistory.length;
  if (
    Command.commandHistory[commandStackLength - 1] instanceof ZoomSphereCommand
  ) {
    (
      Command.commandHistory[commandStackLength - 1] as ZoomSphereCommand
    ).setMagnificationFactor = newMagFactor.value;
    (
      Command.commandHistory[commandStackLength - 1] as ZoomSphereCommand
    ).setTranslationVector = newTranslationVector;
  } else {
    // Store the zoom as a command that can be undone or redone
    const zoomCommand = new ZoomSphereCommand(
      newMagFactor.value,
      newTranslationVector,
      currentMagFactor.value,
      currentTranslationVector
    );
    // Push the command on to the command stack, but do not execute it because it has already been enacted
    zoomCommand.push();
  }
}
function handleMouseMoved(e: MouseEvent): void {
  // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
  if (e.button === 0)
    // When currentTool is NULL, currentTool? resolves to no action
    currentTool?.mouseMoved(e);
}

function handleMousePressed(e: MouseEvent): void {
  // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
  // const bb = (e.currentTarget as HTMLElement).getBoundingClientRect();
  // console.debug(
  //   "Mode",
  //   actionMode,
  //   ` mouse pressed at (${e.clientX - bb.left},${e.clientY - bb.top})`
  // );
  if (e.button === 0) currentTool?.mousePressed(e);
}

function handleMouseReleased(e: MouseEvent): void {
  // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
  // const bb = (e.currentTarget as HTMLElement).getBoundingClientRect();
  // console.debug(
  //   "Mode",
  //   actionMode,
  //   ` mouse released at (${e.clientX - bb.left},${e.clientY - bb.top})`
  // );
  if (e.button === 0) {
    // When currentTool is NULL, the following line does nothing
    currentTool?.mouseReleased(e);
  }
}

function handleMouseLeave(e: MouseEvent): void {
  // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
  if (e.button === 0)
    // When currentTool is NULL, the following line does nothing
    currentTool?.mouseLeave(e);
}

//#region handleSphereRotation
function handleSphereRotation(e: unknown): void {
  seStore.rotateSphere((e as any).transform);
  // console.log(seStore.inverseTotalRotationMatrix.elements);
}
//#endregion handleSphereRotation

function getCurrentSVGForIcon(): void {
  const svgRoot = canvas.value?.querySelector("svg") as SVGElement;
  //Dump a copy of the Nodule.idPlottableDescriptionMap into the console to it tso.js object
  console.log(
    "Nodule.idPlottableDescriptionMap",
    Nodule.idPlottableDescriptionMap
  );

  // Make a duplicate of the SVG tree
  const svgElement = svgRoot.cloneNode(true) as SVGElement;
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  //remove all the text items
  const textGroups = svgElement.querySelectorAll("text");
  for (let i = 0; i < textGroups.length; i++) {
    textGroups[i].remove();
  }
  // remove all the hidden paths or paths with no anchors
  // Also remove the straight edge start/end front/back for the angle markers (they look horrible in the icon)
  const allElements = svgElement.querySelectorAll("path");
  for (let i = 0; i < allElements.length; i++) {
    const element = allElements[i];
    const description = Nodule.idPlottableDescriptionMap.get(
      element.getAttribute("id") ?? ""
    );

    if (
      element.getAttribute("visibility") === "hidden" ||
      element.getAttribute("d") === "" ||
      (description?.type === "angleMarker" && description.part === "edge")
    ) {
      element.remove();
    }
  }

  // remove all SVG groups with no children (they are are result of empty layers)
  const groups = svgElement.querySelectorAll("g");
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (group.childElementCount === 0) {
      group.remove();
    }
  }
  const iconArray = [];
  const defs = svgElement.querySelectorAll("defs");
  for (let i = 0; i < defs.length; i++) {
    iconArray.push(defs[i].outerHTML);
  }

  const paths = svgElement.querySelectorAll("path");
  for (let i = 0; i < paths.length; i++) {
    paths[i].setAttribute("vector-effect", "non-scaling-stroke");

    // Into each path inject four new attributes, which will be removed later
    const description = Nodule.idPlottableDescriptionMap.get(
      paths[i].getAttribute("id") ?? ""
    );
    if (description === undefined) {
      throw new Error(`IconBase - ${paths[i]} has no id.`);
    }
    paths[i].setAttribute("type", description.type);
    paths[i].setAttribute("side", description.side);
    paths[i].setAttribute("myfill", String(description.fill));
    paths[i].setAttribute("part", description.part);

    iconArray.push(paths[i].outerHTML);
  }

  // We are NOT actually saving an SVG content,
  // but it is actually a plain text payload
  // The ";" delimiter is required by IconBase.vue
  var blob = new Blob([iconArray.join(";")], {
    type: "text/plain;charset=utf-8"
  });
  FileSaver.saveAs(blob, "iconXXXPaths.svg");
}

function animateCanvas(): void {
  canvas.value?.classList.add("spin");
  setTimeout(() => {
    canvas.value?.classList.remove("spin");
  }, 1200);
}

function measuredCircleSetTemporaryRadius(e: {
  display: boolean;
  radius: number;
}): void {
  if (currentTool instanceof MeasuredCircleHandler) {
    currentTool.displayTemporaryCircle(e.display, e.radius);
  }
}

function setExpressionForTool(e: { expression: SEExpression }): void {
  if (
    currentTool instanceof MeasuredCircleHandler ||
    currentTool instanceof RotationTransformationHandler ||
    currentTool instanceof TranslationTransformationHandler
  ) {
    currentTool.setExpression(e.expression);
  }
}

function setTransformationForTool(e: {
  transformation: SETransformation;
}): void {
  if (currentTool instanceof ApplyTransformationHandler) {
    currentTool.setTransformation(e.transformation);
  } else {
    // console.debug(`The current action mode ${actionMode}`);
    seStore.setActionMode("applyTransformation");
    // console.debug(`The current action mode ${actionMode}`);
    // currentTool?.deactivate();
    if (!applyTransformationTool) {
      applyTransformationTool = new ApplyTransformationHandler(layers.value);
    }
    applyTransformationTool.setTransformation(e.transformation);
  }
}

function deleteNode(e: {
  victim: SENodule;
  victimName: string;
  victimType: string;
}): void {
  if (!deleteTool) {
    deleteTool = new DeleteHandler(layers.value);
  }
  const deletedNodeIds = deleteTool.delete(e.victim);
  //deletedNodes: "Successfully deleted {type} {name} and {number} {objects} that depend on it.",
  EventBus.fire("show-alert", {
    key: `handlers.deletedNodes`,
    keyOptions: {
      type: e.victimType,
      name: e.victimName,
      number: deletedNodeIds.length - 1,
      objects:
        deletedNodeIds.length === 2
          ? t(`objects.objects`, 4)
          : t(`objects.objects`, 3)
    },
    type: "success"
  });
}

// dialogBoxIsActive(e: { active: boolean }): void {
//   // console.debug(`dialog box is active is ${e.active}`);
//   if (hideTool) {
//     hideTool.disableKeyHandler = e.active;
//   }
//   if (nSectAngleTool) {
//     nSectAngleTool.disableKeyHandler = e.active;
//   }
//   if (nSectSegmentTool) {
//     nSectSegmentTool.disableKeyHandler = e.active;
//   }
//   if (rotateTool) {
//     rotateTool.disableKeyHandler = e.active;
//   }
//   if (selectTool) {
//     selectTool.disableKeyHandler = e.active;
//   }
//   if (toggleLabelDisplayTool) {
//     toggleLabelDisplayTool.disableKeyHandler = e.active;
//   }
// }
/**
 * Watch the actionMode in the store. This is the two-way binding of variables in the Vuex Store.  Notice that this
 * is a vue component so we are able to Watch for changes in variables in the store. If this was not a vue component
 * we would not be able to do this (at least not directly).
 */
watch(
  () => actionMode.value,
  (mode: ActionMode): void => {
    //console.debug("Switch tool /action mode");
    currentTool?.deactivate();
    currentTool = null;
    //set the default footer color -- override as necessary
    EventBus.fire("set-footer-color", { color: colors.blue.lighten4 });
    const directiveMsg = {
      key: "buttons." + buttonSelection.value.displayedName,
      secondaryMsg: "buttons." + buttonSelection.value.toolUseMessage,
      keyOptions: {},
      secondaryMsgKeyOptions: {},
      type: "directive"
    };

    switch (mode) {
      case "select":
        if (!selectTool) {
          selectTool = new SelectionHandler(layers.value);
        }
        currentTool = selectTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "delete":
        if (!deleteTool) {
          deleteTool = new DeleteHandler(layers.value);
        }
        currentTool = deleteTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "zoomIn":
        if (!zoomTool) {
          zoomTool = new PanZoomHandler(canvas.value!);
        }
        zoomTool.zoomMode = ZoomMode.MAGNIFY;
        currentTool = zoomTool;
        break;
      case "zoomOut":
        if (!zoomTool) {
          zoomTool = new PanZoomHandler(canvas.value!);
        }
        zoomTool.zoomMode = ZoomMode.MINIFY;
        currentTool = zoomTool;
        break;
      case "zoomFit":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the zoom fit (and the tool should be the same)
        if (!zoomTool) {
          zoomTool = new PanZoomHandler(canvas.value!);
        }

        zoomTool.doZoomFit(props.canvasSize);
        zoomTool.activate(); // unglow any selected objects.
        zoomTool.deactivate(); // shut the tool down properly
        seStore.revertActionMode();
        break;

      case "iconFactory":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the click (and the tool should be the same)
        if (!iconFactoryTool) {
          iconFactoryTool = new IconFactoryHandler();
        }
        iconFactoryTool.createIconPaths();
        seStore.revertActionMode();
        break;

      case "hide":
        if (!hideTool) {
          hideTool = new HideObjectHandler(layers.value);
        }
        currentTool = hideTool;
        break;
      case "move":
        if (!moveTool) {
          moveTool = new MoveHandler(layers.value);
        }
        currentTool = moveTool;
        EventBus.fire("set-footer-color", { color: colors.red.lighten5 });
        break;
      case "rotate":
        if (!rotateTool) {
          rotateTool = new RotateHandler(layers.value);
        }
        currentTool = rotateTool;
        break;

      case "point":
        if (!pointTool) {
          pointTool = new PointHandler(layers.value);
        }
        currentTool = pointTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "line":
        if (!lineTool) {
          lineTool = new LineHandler(layers.value);
        }
        currentTool = lineTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "segment":
        if (!segmentTool) {
          segmentTool = new SegmentHandler(layers.value);
        }
        currentTool = segmentTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "circle":
        if (!circleTool) {
          circleTool = new CircleHandler(layers.value);
        }
        currentTool = circleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "ellipse":
        if (!ellipseTool) {
          ellipseTool = new EllipseHandler(layers.value);
        }
        currentTool = ellipseTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "antipodalPoint":
        if (!antipodalPointTool) {
          antipodalPointTool = new AntipodalPointHandler(layers.value);
        }
        currentTool = antipodalPointTool;
        break;
      case "polar":
        if (!polarObjectTool) {
          polarObjectTool = new PolarObjectHandler(layers.value);
        }
        currentTool = polarObjectTool;
        break;
      case "intersect":
        if (!intersectTool) {
          intersectTool = new IntersectionPointHandler(layers.value);
        }
        currentTool = intersectTool;
        break;
      case "pointOnObject":
        if (!pointOnOneDimensionalTool) {
          pointOnOneDimensionalTool = new PointOnOneDimensionalHandler(
            layers.value
          );
        }
        currentTool = pointOnOneDimensionalTool;
        break;

      case "segmentLength":
        if (!segmentLengthTool) {
          segmentLengthTool = new SegmentLengthHandler(layers.value);
        }
        currentTool = segmentLengthTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "pointDistance":
        if (!pointDistanceTool) {
          pointDistanceTool = new PointDistanceHandler(layers.value);
        }
        currentTool = pointDistanceTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "angle":
        if (!angleTool) {
          angleTool = new AngleHandler(layers.value);
        }
        currentTool = angleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "coordinate":
        if (!coordinateTool) {
          coordinateTool = new CoordinateHandler(layers.value);
        }
        currentTool = coordinateTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "toggleLabelDisplay":
        if (!toggleLabelDisplayTool) {
          toggleLabelDisplayTool = new ToggleLabelDisplayHandler(layers.value);
        }
        currentTool = toggleLabelDisplayTool;
        break;
      case "perpendicular":
        if (!perpendicularLineThruPointTool) {
          perpendicularLineThruPointTool =
            new PerpendicularLineThruPointHandler(layers.value);
        }

        currentTool = perpendicularLineThruPointTool;
        break;
      case "tangent":
        if (!tangentLineThruPointTool) {
          tangentLineThruPointTool = new TangentLineThruPointHandler(
            layers.value
          );
        }
        currentTool = tangentLineThruPointTool;
        break;
      case "measureTriangle":
        if (!measureTriangleTool) {
          measureTriangleTool = new PolygonHandler(layers.value, true);
        }
        currentTool = measureTriangleTool;
        break;
      case "measurePolygon":
        if (!measurePolygonTool) {
          measurePolygonTool = new PolygonHandler(layers.value, false);
        }
        currentTool = measurePolygonTool;
        break;
      case "midpoint":
        if (!midpointTool) {
          midpointTool = new NSectSegmentHandler(layers.value, true);
        }
        currentTool = midpointTool;
        break;
      case "nSectPoint":
        if (!nSectSegmentTool) {
          nSectSegmentTool = new NSectSegmentHandler(layers.value, false);
        }
        currentTool = nSectSegmentTool;
        break;
      case "angleBisector":
        if (!angleBisectorTool) {
          angleBisectorTool = new NSectAngleHandler(layers.value, true);
        }
        currentTool = angleBisectorTool;
        break;
      case "nSectLine":
        if (!nSectAngleTool) {
          nSectAngleTool = new NSectAngleHandler(layers.value, false);
        }
        currentTool = nSectAngleTool;
        break;
      case "threePointCircle":
        if (!threePointCircleTool) {
          threePointCircleTool = new ThreePointCircleHandler(layers.value);
        }
        currentTool = threePointCircleTool;
        break;
      case "measuredCircle":
        if (!measuredCircleTool) {
          measuredCircleTool = new MeasuredCircleHandler(layers.value);
        }
        currentTool = measuredCircleTool;
        break;
      case "translation":
        if (!translationTool) {
          translationTool = new TranslationTransformationHandler(layers.value);
        }
        currentTool = translationTool;
        break;
      case "rotation":
        if (!rotationTool) {
          rotationTool = new RotationTransformationHandler(layers.value);
        }
        currentTool = rotationTool;
        break;
      case "reflection":
        if (!reflectionTool) {
          reflectionTool = new ReflectionTransformationHandler(layers.value);
        }
        currentTool = reflectionTool;
        break;
      case "pointReflection":
        if (!pointReflectionTool) {
          pointReflectionTool = new PointReflectionTransformationHandler(
            layers.value
          );
        }
        currentTool = pointReflectionTool;
        break;
      case "inversion":
        if (!inversionTool) {
          inversionTool = new InversionTransformationHandler(layers.value);
        }
        currentTool = inversionTool;
        break;
      case "applyTransformation":
        if (!applyTransformationTool) {
          applyTransformationTool = new ApplyTransformationHandler(
            layers.value
          );
        }
        currentTool = applyTransformationTool;
        break;
      default:
        currentTool = null;
    }
    if (currentTool) {
      EventBus.fire("show-alert", directiveMsg);
    }
    currentTool?.activate();
  }
);
function listItemStyle(idx: number, xLoc: string, yLoc: string) {
  //xLoc determines left or right, yLoc determines top or bottom
  const style: any = {};
  let r = 0;
  let c = 0;
  let startCol = 0;
  // Place by moving in the "south-west" direction
  while (idx > 0) {
    if (c > 0) {
      c--; // Move west
      r++; // Move south
    } else {
      // if we hit the edge, move over to the next column
      startCol++;
      c = startCol;
      r = 0;
    }
    idx--;
  }

  style.position = "absolute";
  style[xLoc] = `${c * 36}px`;
  style[yLoc] = `${r * 36}px`;
  return style;
}
</script>

<style lang="scss" scoped>
.spin {
  animation-name: spinCCW;
  animation-duration: 600ms;
  animation-direction: normal;
}
@keyframes spinCCW {
  50% {
    transform: rotate(180deg);
  }
}

#sphereContainer {
  border: 3px solid black;

  position: relative;
}
.anchored {
  margin: 0px;
  position: absolute;
}
.left {
  left: 0;
}

.right {
  right: 0;
}

.top {
  top: 0;
}

.bottom {
  bottom: 0;
}
</style>

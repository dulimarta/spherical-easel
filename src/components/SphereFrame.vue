<template>
  <!-- <CurrentToolSelection /> -->
  <!-- <span style="position:relative; left: 200px; border: 1px solid blue">Size: {{ availableWidth }}x{{ availableHeight }}</span> -->
  <div id="sphereContainer">
    <div
      id="canvas"
      ref="canvas"
      :class="animateClass"
      :width="availableWidth"
      :height="availableHeight"></div>
    <div class="anchored top left">
      <div
        v-for="(shortcut, index) in shortCutIcons[0]"
        :key="`${shortcut.action}-L`"
        :style="listItemStyle(index, 'left', 'top')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div>
    <div class="anchored top right">
      <div
        v-for="(shortcut, index) in shortCutIcons[1]"
        :key="`${shortcut.action}-R`"
        :style="listItemStyle(index, 'right', 'top')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div>
    <div
      v-if="showMousePos"
      :style="{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        border: '2px solid gray',
        borderRadius: '0.5em',
        padding: '0.25em',
        fontSize: '11pt'
      }">
      {{ mousePos }}
    </div>
    <!--div class="anchored bottom left">
      <div
        v-for="(shortcut, index) in shortCutIcons[2]"
        :key="index"
        :style="listItemStyle(index, 'left', 'bottom')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </!--div>
    <div-- class="anchored bottom right">
      <div
        v-for="(shortcut, index) in shortCutIcons[3]"
        :key="index"
        :style="listItemStyle(index, 'right', 'bottom')">
        <ShortcutIcon :model="shortcut" />
      </div>
    </div-->
  </div>
  <!-- Dialog here -->
  <Dialog
    id="inputDialog"
    ref="inputDialog"
    :title="t('collectTextObjectString')"
    :yes-text="t('exportAction')"
    :no-text="t('cancelAction')"
    :yes-action="submitAction"
    :no-action="cancelAction"
    max-width="40%">
    <v-text-field
      type="text"
      density="compact"
      clearable
      counter
      persistent-hint
      :label="t('inputText')"
      required
      v-model="userInput"></v-text-field>
  </Dialog>
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
import { TOOL_DICTIONARY } from "@/components/tooldictionary";
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
import EllipseHandler from "@/eventHandlers/EllipseHandler";
import IconFactoryHandler from "../eventHandlers/IconFactoryHandler";
import PolygonHandler from "@/eventHandlers/PolygonHandler";
import NSectSegmentHandler from "@/eventHandlers/NSectSegmentHandler";
import NSectAngleHandler from "@/eventHandlers/NSectAngleHandler";
import ThreePointCircleHandler from "@/eventHandlers/ThreePointCircleHandler";
import MeasuredCircleHandler from "@/eventHandlers/MeasuredCircleHandler";
import TranslationTransformationHandler from "@/eventHandlers/TranslationTransformationHandler";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
import { getAuth } from "firebase/auth";

import EventBus from "@/eventHandlers/EventBus";
import MoveHandler from "../eventHandlers/MoveHandler";
import { ActionMode } from "@/types";

// import colors from "vuetify/lib/util/colors";
import { storeToRefs } from "pinia";
import { useSEStore } from "@/stores/se";
import { useAccountStore } from "@/stores/account";

import { SEExpression } from "@/models/SEExpression";
import RotationTransformationHandler from "@/eventHandlers/RotationTransformationHandler";
import ReflectionTransformationHandler from "@/eventHandlers/ReflectionTransformationHandler";
import PointReflectionTransformationHandler from "@/eventHandlers/PointReflectionTransformationHandler";
import InversionTransformationHandler from "@/eventHandlers/InversionTransformationHandler";
// Use the DummyHandler example as a starter for a new handler
import DummyHandler from "@/eventHandlers/DummyHandler";
import TextHandler from "@/eventHandlers/TextHandler";
import { SETransformation } from "@/models/SETransformation";
import ApplyTransformationHandler from "@/eventHandlers/ApplyTransformationHandler";
import { SENodule } from "@/models/SENodule";
import { useI18n } from "vue-i18n";
import { ToolButtonType } from "@/types";
import Two from "two.js";
import { Circle } from "two.js/src/shapes/circle";
import { Group } from "two.js/src/group";
import { useMagicKeys } from "@vueuse/core";
import { watchEffect } from "vue";
import { Handler } from "mitt";
import { useUserPreferencesStore } from "@/stores/userPreferences";


type ComponentProps = {
  availableHeight: number;
  availableWidth: number;
  isEarthMode: boolean;
};

const seStore = useSEStore();
const {
  actionMode,
  zoomMagnificationFactor,
  zoomTranslation,
  seLabels,
  seEllipses,
  sePolygons,
  seCircles
} = storeToRefs(seStore);
const acctStore = useAccountStore();
const prefsStore = useUserPreferencesStore();
const { boundaryColor, boundaryWidth } = storeToRefs(prefsStore);
const { t } = useI18n({ useScope: "local" });

const props = withDefaults(defineProps<ComponentProps>(), {
  availableHeight: 240,
  availableWidth: 240
});

const canvas: Ref<HTMLDivElement | null> = ref(null);
const animateClass = ref("");

const { favoriteTools } = storeToRefs(acctStore);

const shortCutIcons = computed((): Array<Array<ToolButtonType>> => {
  // console.debug("Updating shortcut icons");
  return favoriteTools.value.map(
    (corner: Array<ActionMode>): Array<ToolButtonType> =>
      corner.map((act: ActionMode): ToolButtonType => TOOL_DICTIONARY.get(act)!)
  );
});
const mousePos = ref("");
const showMousePos = ref(false);
const { shift, alt, d, ctrl } = useMagicKeys();

const inputDialog: Ref<DialogAction | null> = ref(null);
const userInput = ref("");
const submitAction = ref(() => {}); // Dynamic action placeholder
const cancelAction = ref(() => {}); // Dynamic action placeholder

const handleTextObjectEdit = () => {
  EventBus.fire("text-data-submitted", {
    text: userInput.value
  }); // if the text is empty, the user is issued a warning in textHandler
  inputDialog.value?.hide();
  userInput.value = ""; // Clear input after submission
};

const handleTextObjectEditCancel = () => {
  userInput.value = ""; // set the payload in "text-data-submitted" to the empty string so that in textHandler the selected text object is set to null
  handleTextObjectEdit();
};
const showTextObjectEditDialog = (payload: { oldText: string | null }) => {
  submitAction.value = handleTextObjectEdit; // Set action to edit
  cancelAction.value = handleTextObjectEditCancel;
  userInput.value = payload.oldText ?? "";
  inputDialog.value?.show();
};

/**
 * The main (the only one) TwoJS object that contains the groups (each a Group) making up the screen graph
 * First groups  (Groups) are added to the twoInstance (index by the enum LAYER from
 * global-settings.ts), then TwoJs objects (Path, Ellipse, etc..) are added to the
 * appropriate layer. This object is refreshed at 60 fps (in constructor -- autostart: true).
 */
let twoInstance!: Two;

/**
 * The circle that is the edge of the projection of the Default Sphere in the Default Screen Plane
 */
let boundaryCircle!: Circle;
/**
 * The Global Pinia Store
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
let iconFactoryTool: IconFactoryHandler | null = null;
let tangentLineThruPointTool: TangentLineThruPointHandler | null = null;
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
let textTool: TextHandler | null = null;

// Use the following line as a starter for a new handler
let dummyTool: DummyHandler | null = null;

let layers: Array<Group> = [];

watchEffect(() => {
  if (ctrl.value && alt.value && d.value) {
    showMousePos.value = !showMousePos.value;
  }
});
onBeforeMount(async (): Promise<void> => {
  // Initialize Two.js right away
  twoInstance = new Two({
    width: props.availableWidth,
    height: props.availableHeight,
    autostart: true
  });

  // Build Two.js layers
  const textLayers = [
    LAYER.foregroundText,
    LAYER.foregroundLabel,
    LAYER.backgroundLabel,
    LAYER.foregroundLabelGlowing,
    LAYER.backgroundLabelGlowing
  ].map(Number);

  for (const layer in LAYER) {
    const idx = Number(layer);
    if (!isNaN(idx)) {
      const newLayer = new Two.Group();
      if (textLayers.includes(idx)) newLayer.scale = new Two.Vector(1, -1);
      newLayer.addTo(twoInstance.scene);
      layers.push(newLayer);
    }
  }

  seStore.init();
  seStore.setLayers(twoInstance, layers);

  // Create the boundary circle immediately using defaults
  boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
  boundaryCircle.noFill();
  boundaryCircle.stroke = SETTINGS.boundaryCircle.color;
  boundaryCircle.linewidth =
    SETTINGS.boundaryCircle.lineWidth / (zoomMagnificationFactor.value || 1);
  boundaryCircle.addTo(layers[Number(LAYER.midground)]);

  // Register event listeners
  EventBus.listen("sphere-rotate", handleSphereRotation);
  EventBus.listen("zoom-updated", updateView);
  EventBus.listen("construction-loaded", animateCanvas);
  EventBus.listen(
    "measured-circle-set-temporary-radius",
    measuredCircleSetTemporaryRadius as Handler<unknown>
  );
  EventBus.listen(
    "set-expression-for-tool",
    setExpressionForTool as Handler<unknown>
  );
  EventBus.listen(
    "set-transformation-for-tool",
    setTransformationForTool as Handler<unknown>
  );
  EventBus.listen("delete-node", deleteNode as Handler<unknown>);
  EventBus.listen("cursor-position", (arg: any) => {
    const rawPos = arg.raw.map((s: number) => s.toFixed(2)).join(",");
    const normPos = arg.normalized.map((s: number) => s.toFixed(2)).join(",");
    mousePos.value = `(${normPos}) (${rawPos})`;
  });
  EventBus.listen("update-fill-objects", updateObjectsWithFill);
  EventBus.listen(
    "show-text-edit-dialog",
    showTextObjectEditDialog as Handler<unknown>
  );

  // Then asynchronously load preferences *after* everything is drawn
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await prefsStore.load(uid);
      console.debug(" Preferences loaded after mount, applying now");
      // Apply color and width once available
      if (prefsStore.boundaryColor)
        boundaryCircle.stroke = prefsStore.boundaryColor;
      if (prefsStore.boundaryWidth)
        boundaryCircle.linewidth =
          prefsStore.boundaryWidth / (zoomMagnificationFactor.value || 1);
      twoInstance.update();
    } catch (err) {
      console.warn("Could not load user preferences:", err);
    }
  }
});




onMounted((): void => {
  console.debug("SphereFrame::onMounted");
  // Put the main js instance into the canvas
  twoInstance.appendTo(canvas.value!);
  // Set up the listeners
  canvas.value?.addEventListener("mouseenter", ev => {
    // console.debug(`SphereFrame.vue: Mouse entered the canvas (${ev.clientX},${ev.clientY})`)
  });
  canvas.value!.addEventListener("mousemove", ev => {
    // console.debug(`SphereFrame.vue: Mouse moved in canvas (${ev.clientX},${ev.clientY})`)
    handleMouseMoved(ev);
  });
  canvas.value?.addEventListener("mousedown", ev => {
    // console.debug(`SphereFrame.vue: Mouse down in canvas (${ev.clientX},${ev.clientY})`)
    handleMousePressed(ev);
  });
  canvas.value?.addEventListener("mouseup", ev => {
    // console.debug(`SphereFrame.vue: Mouse up in canvas (${ev.clientX},${ev.clientY})`)
    handleMouseReleased(ev);
  });
  canvas.value?.addEventListener("mouseleave", handleMouseLeave);
  // Add the passive option to avoid Chrome warning
  // Without this option, scroll events will potentially block touch/wheel events
  canvas.value?.addEventListener("wheel", handleMouseWheel, { passive: true });

  // Add the listener to disable the context menu because without this line of code, if the user activates a tool,
  // then *first* presses ctrl key, then mouse clicks, a context menu appears and the functionality of the tool is
  // unpredictable. (In the case of the move tool, if the user first clicks, then presses ctrl, the behavior is fine.)
  // source: https://www.sitepoint.com/community/t/how-do-i-disable-the-context-menu-in-chrome-on-a-mac/346738
  // I can't see a good way to remove this listener
  // IS THIS A GOOD IDEA? Maybe not
  canvas.value?.addEventListener("contextmenu", event =>
    event.preventDefault()
  );

  // canvas.value!.style.width = twoInstance.width.toString() + "px";
  // canvas.value!.style.height = twoInstance.height.toString() + "px";
  // Set the canvas size to the window size
  // Make the canvas accessible to other components which need
  // to grab the SVG contents of the sphere
  // console.debug("TwoJS SVG Canvas is", canvas.value);
  seStore.setCanvas(canvas.value!);
  // updateShortcutTools();
  updateView();
  //Listen For text dialog box
});
watch(
  () => props.isEarthMode,
  earthMode => {
    let i = 0;
    for (const layer of Object.values(LAYER).filter(
      layer => typeof layer !== "number"
    )) {
      if ((layer as string).includes("background")) {
        layers[i].visible = !earthMode;
      }
      i++;
    }
    if (!earthMode) {
      boundaryCircle.stroke = "black";
      boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth;
    } else {
      let currentLineWidth = boundaryCircle.linewidth;
      boundaryCircle.stroke = "blue";
      let intervalHandle;
      // Gradually decrease the linewidth until it disappears
      intervalHandle = setInterval(() => {
        currentLineWidth -= 0.2;
        if (currentLineWidth < 0) {
          boundaryCircle.linewidth = 0;
          clearInterval(intervalHandle);
        } else {
          boundaryCircle.linewidth = currentLineWidth;
        }
      }, 100);
    }
  }
);

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
  EventBus.unlisten("construction-loaded");
  EventBus.unlisten("measured-circle-set-temporary-radius");
  EventBus.unlisten("set-expression-for-tool");
  EventBus.unlisten("set-transformation-for-tool");
  EventBus.unlisten("delete-node");
  // EventBus.unlisten("update-two-instance");
  EventBus.unlisten("update-fill-objects");
  //EventBus.unlisten("export-current-svg-for-icon");
  EventBus.unlisten("show-text-edit-dialog");
});

watch(
  [() => props.availableWidth, () => props.availableHeight],
  ([width, height]): void => {
    console.debug(`Available rectangle WxH ${width}x${height}`);
    twoInstance.width = width;
    twoInstance.height = height;
    // groups.forEach(z => {
    //   z.translation.set(size / 2, size / 2);
    // });

    const radius = Math.min(width, height) / 2 - 16; // 16-pixel gap

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
    seStore.setCanvasDimension(width, height);
  }
);
//adjust the width of the boundary circle for zoom
watch(
  () => zoomMagnificationFactor.value,
  newFactor => {
    boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth / newFactor;
  }
);

// Watch for boundary circle color and width preference changes
watch(
  [boundaryColor, boundaryWidth],
  ([color, width]) => {
    console.log("Watcher triggered:", color, width);
    if (!boundaryCircle) return;

    // Update the circle stroke color and line width
    if (color) boundaryCircle.stroke = color;
    if (width)
      boundaryCircle.linewidth = width / (zoomMagnificationFactor.value || 1);

    twoInstance.update(); // Refresh rendering
  },
  { immediate: true }
);


/** Apply the affine transform (m) to the entire TwoJS SVG tree! */

// The translation element of the CSS transform matrix
// is actually the pivot/origin of the zoom

//#region updateView
function updateView() {
  // Get the current magnification factor and translation vector
  const mag = zoomMagnificationFactor.value;
  const transVector = zoomTranslation;
  const originX = props.availableWidth / 2;
  const originY = props.availableHeight / 2;

  twoInstance.scene.translation = new Two.Vector(
    originX + transVector.value[0],
    originY + transVector.value[1]
  );
  twoInstance.scene.scale = new Two.Vector(mag, -mag);
  // twoInstance.scene.matrix
  //   .identity()
  //   .translate(origin + transVector[0], origin + transVector[1]) // Order of these two operations
  //   .scale(mag, -mag); // (translate & scale) is important
  //Now update the display of the arrangement (i.e. make sure the labels are not too far from their associated objects)
  for (let l of seLabels.value) {
    l.update();
  }
}
//#endregion updateView

function handleMouseWheel(event: WheelEvent): void {
  // Compute (pixelX,pixelY) = the location of the mouse release in pixel coordinates relative to
  //  the top left of the sphere frame. This is a location *post* affine transformation
  const target = (event.currentTarget || event.target) as HTMLDivElement;
  const boundingRect = target.getBoundingClientRect();
  const pixelX = event.clientX - boundingRect.left - boundingRect.width / 2;
  const pixelY = event.clientY - boundingRect.top - boundingRect.height / 2;
  /* Uncommenting this line triggers errors in Chrome console:
     Unable to preventDefault inside passive event listener */
  // event.preventDefault();

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
  // console.debug("SphereFrame::handleMousePress", currentTool !== null)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seStore.rotateSphere((e as any).transform);
  // console.log(seStore.inverseTotalRotationMatrix.elements);
}
//#endregion handleSphereRotation

function animateCanvas(): void {
  animateClass.value = "spin";
  setTimeout(() => {
    animateClass.value = "";
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
      applyTransformationTool = new ApplyTransformationHandler(layers);
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
    deleteTool = new DeleteHandler(layers);
  }
  const deletedNodeIds = deleteTool.delete(e.victim);
  //deletedNodes: "Successfully deleted {type} {name} and {number} {objects} that depend on it.",
  EventBus.fire("show-alert", {
    key: `deletedNodes`,
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

function updateObjectsWithFill() {
  for (let e of seEllipses.value) {
    e.update();
  }
  for (let c of seCircles.value) {
    c.update();
  }
  for (let p of sePolygons.value) {
    p.update();
  }
}

/**
 * Watch the actionMode in the store. This is the two-way binding of variables in the Pinia Store.  Notice that this
 * is a vue component so we are able to Watch for changes in variables in the store. If this was not a vue component
 * we would not be able to do this (at least not directly).
 */
watch(
  () => actionMode.value,
  (mode: ActionMode): void => {
    console.debug("Switch tool /action mode to", mode);
    currentTool?.deactivate();
    currentTool = null;
    //set the default footer color -- override as necessary
    let directiveMsg;
    const associatedButton = TOOL_DICTIONARY.get(mode);
    if (associatedButton)
      directiveMsg = {
        key: associatedButton.displayedName,
        secondaryMsg: associatedButton.toolUseMessage,
        keyOptions: {},
        secondaryMsgKeyOptions: {},
        type: "directive"
      };

    switch (mode) {
      case "select":
        if (!selectTool) {
          selectTool = new SelectionHandler(layers);
        }
        currentTool = selectTool;
        break;
      case "delete":
        if (!deleteTool) {
          deleteTool = new DeleteHandler(layers);
        }
        currentTool = deleteTool;
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

        zoomTool.doZoomFit(
          Math.min(props.availableHeight, props.availableWidth)
        );
        zoomTool.activate(); // unglow any selected objects.
        zoomTool.deactivate(); // shut the tool down properly
        seStore.revertActionMode();
        break;
      case "hide":
        if (!hideTool) {
          hideTool = new HideObjectHandler(layers);
        }
        currentTool = hideTool;
        break;
      case "move":
        if (!moveTool) {
          moveTool = new MoveHandler(layers);
        }
        currentTool = moveTool;
        break;
      case "rotate":
        if (!rotateTool) {
          rotateTool = new RotateHandler(layers);
        }
        currentTool = rotateTool;
        break;

      case "point":
        if (!pointTool) {
          pointTool = new PointHandler(layers);
        }
        currentTool = pointTool;
        break;
      case "line":
        if (!lineTool) {
          lineTool = new LineHandler(layers);
        }
        currentTool = lineTool;
        break;
      case "segment":
        if (!segmentTool) {
          segmentTool = new SegmentHandler(layers);
        }
        currentTool = segmentTool;
        break;
      case "circle":
        if (!circleTool) {
          circleTool = new CircleHandler(layers);
        }
        currentTool = circleTool;
        break;
      case "ellipse":
        if (!ellipseTool) {
          ellipseTool = new EllipseHandler(layers);
        }
        currentTool = ellipseTool;
        break;
      case "antipodalPoint":
        if (!antipodalPointTool) {
          antipodalPointTool = new AntipodalPointHandler(layers);
        }
        currentTool = antipodalPointTool;
        break;
      case "polar":
        if (!polarObjectTool) {
          polarObjectTool = new PolarObjectHandler(layers);
        }
        currentTool = polarObjectTool;
        break;
      case "intersect":
        if (!intersectTool) {
          intersectTool = new IntersectionPointHandler(layers);
        }
        currentTool = intersectTool;
        break;
      case "pointOnObject":
        if (!pointOnOneDimensionalTool) {
          pointOnOneDimensionalTool = new PointOnOneDimensionalHandler(layers);
        }
        currentTool = pointOnOneDimensionalTool;
        break;
      case "iconFactory":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the click (and the tool should be the same)
        if (!iconFactoryTool) {
          iconFactoryTool = new IconFactoryHandler();
        }
        iconFactoryTool.createIconPaths();
        seStore.revertActionMode();
        break;
      case "segmentLength":
        if (!segmentLengthTool) {
          segmentLengthTool = new SegmentLengthHandler(layers);
        }
        currentTool = segmentLengthTool;
        break;
      case "pointDistance":
        if (!pointDistanceTool) {
          pointDistanceTool = new PointDistanceHandler(layers);
        }
        currentTool = pointDistanceTool;
        break;
      case "angle":
        if (!angleTool) {
          angleTool = new AngleHandler(layers);
        }
        currentTool = angleTool;
        break;
      case "coordinate":
        if (!coordinateTool) {
          coordinateTool = new CoordinateHandler(layers);
        }
        currentTool = coordinateTool;
        break;
      case "toggleLabelDisplay":
        if (!toggleLabelDisplayTool) {
          toggleLabelDisplayTool = new ToggleLabelDisplayHandler(layers);
        }
        currentTool = toggleLabelDisplayTool;
        break;
      case "perpendicular":
        if (!perpendicularLineThruPointTool) {
          perpendicularLineThruPointTool =
            new PerpendicularLineThruPointHandler(layers);
        }

        currentTool = perpendicularLineThruPointTool;
        break;
      case "tangent":
        if (!tangentLineThruPointTool) {
          tangentLineThruPointTool = new TangentLineThruPointHandler(layers);
        }
        currentTool = tangentLineThruPointTool;
        break;
      case "measureTriangle":
        if (!measureTriangleTool) {
          measureTriangleTool = new PolygonHandler(layers, true);
        }
        currentTool = measureTriangleTool;
        break;
      case "measurePolygon":
        if (!measurePolygonTool) {
          measurePolygonTool = new PolygonHandler(layers, false);
        }
        currentTool = measurePolygonTool;
        break;
      case "midpoint":
        if (!midpointTool) {
          midpointTool = new NSectSegmentHandler(layers, true);
        }
        currentTool = midpointTool;
        break;
      case "nSectPoint":
        if (!nSectSegmentTool) {
          nSectSegmentTool = new NSectSegmentHandler(layers, false);
        }
        currentTool = nSectSegmentTool;
        break;
      case "angleBisector":
        if (!angleBisectorTool) {
          angleBisectorTool = new NSectAngleHandler(layers, true);
        }
        currentTool = angleBisectorTool;
        break;
      case "nSectLine":
        if (!nSectAngleTool) {
          nSectAngleTool = new NSectAngleHandler(layers, false);
        }
        currentTool = nSectAngleTool;
        break;
      case "threePointCircle":
        if (!threePointCircleTool) {
          threePointCircleTool = new ThreePointCircleHandler(layers);
        }
        currentTool = threePointCircleTool;
        break;
      case "measuredCircle":
        if (!measuredCircleTool) {
          measuredCircleTool = new MeasuredCircleHandler(layers);
        }
        currentTool = measuredCircleTool;
        break;
      case "translation":
        if (!translationTool) {
          translationTool = new TranslationTransformationHandler(layers);
        }
        currentTool = translationTool;
        break;
      case "rotation":
        if (!rotationTool) {
          rotationTool = new RotationTransformationHandler(layers);
        }
        currentTool = rotationTool;
        break;
      case "reflection":
        if (!reflectionTool) {
          reflectionTool = new ReflectionTransformationHandler(layers);
        }
        currentTool = reflectionTool;
        break;
      case "pointReflection":
        if (!pointReflectionTool) {
          pointReflectionTool = new PointReflectionTransformationHandler(
            layers
          );
        }
        currentTool = pointReflectionTool;
        break;
      case "inversion":
        if (!inversionTool) {
          inversionTool = new InversionTransformationHandler(layers);
        }
        currentTool = inversionTool;
        break;
      case "applyTransformation":
        if (!applyTransformationTool) {
          applyTransformationTool = new ApplyTransformationHandler(layers);
        }
        currentTool = applyTransformationTool;
        break;
      case "text":
        if (!textTool) {
          textTool = new TextHandler(layers);
        }
        currentTool = textTool;
        break;
      // Use the following switch case to activate a new handler
      case "dummy":
        if (!dummyTool) {
          dummyTool = new DummyHandler(layers);
        }
        currentTool = dummyTool;
        break;
      default:
        currentTool = null;
        if (import.meta.env.MODE === "test") assertNever(mode);
    }
    if (currentTool && directiveMsg) {
      EventBus.fire("show-alert", directiveMsg);
    }
    currentTool?.activate();
  }
);

function assertNever(x: unknown): never {
  throw Error(`This should not happen ${x}`);
}

function listItemStyle(idx: number, xLoc: string, yLoc: string) {
  //xLoc determines left or right, yLoc determines top or bottom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style: Record<string, any> = {};
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
  // add in 3 px padding around the icons and 2 px between containers.
  style[xLoc] = `${
    c * (SETTINGS.icons.shortcutButtonSize + 3) + (c - 1) * 2
  }px`;
  style[yLoc] = `${
    r * (SETTINGS.icons.shortcutButtonSize + 3) + (r - 1) * 2
  }px`;
  return style;
}
</script>
<i18n locale="en" lang="json">
{
  "collectTextObjectString": "Text Object String",
  "exportAction": "Enter",
  "cancelAction": "Cancel",
  "inputText": "Enter Text String"
}
</i18n>

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
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.anchored {
  margin: 8px;
  position: absolute;
}
.left {
  left: 0;
}

.right {
  right: 0px;
}
</style>
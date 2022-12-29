<template>
  <div>
    <div id="canvas"
      ref="canvas"></div>
  </div>
</template>


<script lang="ts">
import VueComponent from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
import SETTINGS, { LAYER } from "@/global-settings";
import { ZoomSphereCommand } from "@/commands/ZoomSphereCommand";
import { Command } from "@/commands/Command";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";

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
import { ActionMode, ToolButtonType } from "@/types";
import colors from "vuetify/es5/util/colors";
import { SELabel } from "@/models/SELabel";
import FileSaver from "file-saver";
import Nodule from "@/plottables/Nodule";
import { mapState, mapActions, mapWritableState } from "pinia";
import { useSEStore } from "@/stores/se";
import { Matrix4 } from "three";
import Two from "two.js";
// import { Circle } from "two.js/src/shapes/circle";
// import { Group } from "two.js/src/group";
import { SEExpression } from "@/models/SEExpression";
import RotationTransformationHandler from "@/eventHandlers/RotationTransformationHandler";
import ReflectionTransformationHandler from "@/eventHandlers/ReflectionTransformationHandler";
import PointReflectionTransformationHandler from "@/eventHandlers/PointReflectionTransformationHandler";
import InversionTransformationHandler from "@/eventHandlers/InversionTransformationHandler";
import { SETransformation } from "@/models/SETransformation";
import ApplyTransformationHandler from "@/eventHandlers/ApplyTransformationHandler";
import { SENodule } from "@/models/SENodule";

import i18n from "@/i18n";

@Component({
  computed: {
    ...mapState(useSEStore, [
      "actionMode",
      "zoomMagnificationFactor",
      "zoomTranslation",
      "seLabels",
      "layers",
      "expressions",
      "buttonSelection"
    ]),
    ...mapWritableState(useSEStore, ["zoomMagnificationFactor"])
  },

  methods: {
    ...mapActions(useSEStore, [
      "init",
      "setLayers",
      "setCanvas",
      "rotateSphere",
      // "setSphereRadius",
      "setCanvasWidth",
      "setActionMode",
      "revertActionMode",
      "setZoomMagnificationFactor"
    ])
  }
})
export default class SphereFrame extends VueComponent {
  @Prop({ default: 240 })
  readonly canvasSize!: number;

  readonly actionMode!: ActionMode;
  readonly buttonSelection!: ToolButtonType;
  readonly zoomMagnificationFactor!: number;
  readonly zoomTranslation!: number[];
  readonly seLabels!: SELabel[];

  readonly init!: () => void;
  readonly setLayers!: (_: Array<Two.Group>) => void;
  readonly setCanvas!: (_: HTMLDivElement | null) => void;
  readonly setCanvasWidth!: (_: number) => void;
  // readonly setSphereRadius!: (_: number) => void;
  readonly setZoomMagnificationFactor!: (_: number) => void;
  readonly rotateSphere!: (_: Matrix4) => void;
  readonly revertActionMode!: () => void;
  readonly getZoomMagnificationFactor!: () => number;
  readonly setActionMode!: (args: { id: ActionMode; name: string }) => void;
  readonly expressions!: SEExpression[];
  readonly seTransformations!: SETransformation[];

  $refs!: {
    canvas: HTMLDivElement;
  };
  /**
   * The main (the only one) TwoJS object that contains the layers (each a Group) making up the screen graph
   * First layers  (Groups) are added to the twoInstance (index by the enum LAYER from
   * global-settings.ts), then TwoJs objects (Path, Ellipse, etc..) are added to the
   * appropriate layer. This object is refreshed at 60 fps (in constructor -- autostart: true).
   */
  private twoInstance!: Two;

  // private sphereCanvas!: Group;
  /**
   * The circle that is the end of the projection of the Default Sphere in the Default Screen Plane
   */
  private boundaryCircle!: Two.Circle;
  /**
   * The Global Vuex Store
   */

  /** Tools for handling user input */
  private currentTool: ToolStrategy | null = null;
  private selectTool: SelectionHandler | null = null;
  private pointTool: PointHandler | null = null;
  private lineTool: LineHandler | null = null;
  private segmentTool: SegmentHandler | null = null;
  private circleTool: CircleHandler | null = null;
  private ellipseTool: EllipseHandler | null = null;
  private rotateTool: RotateHandler | null = null;
  private zoomTool: PanZoomHandler | null = null;
  private moveTool: MoveHandler | null = null;
  private pointOnOneDimensionalTool: PointOnOneDimensionalHandler | null = null;
  private antipodalPointTool: AntipodalPointHandler | null = null;
  private polarObjectTool: PolarObjectHandler | null = null;
  private intersectTool: IntersectionPointHandler | null = null;
  private deleteTool: DeleteHandler | null = null;
  private hideTool: HideObjectHandler | null = null;
  private segmentLengthTool: SegmentLengthHandler | null = null;
  private pointDistanceTool: PointDistanceHandler | null = null;
  private angleTool: AngleHandler | null = null;
  private coordinateTool: CoordinateHandler | null = null;
  private toggleLabelDisplayTool: ToggleLabelDisplayHandler | null = null;
  private perpendicularLineThruPointTool: PerpendicularLineThruPointHandler | null =
    null;
  private tangentLineThruPointTool: TangentLineThruPointHandler | null = null;
  private iconFactoryTool: IconFactoryHandler | null = null;
  private measureTriangleTool: PolygonHandler | null = null;
  private measurePolygonTool: PolygonHandler | null = null;
  private midpointTool: NSectSegmentHandler | null = null;
  private nSectSegmentTool: NSectSegmentHandler | null = null;
  private angleBisectorTool: NSectAngleHandler | null = null;
  private nSectAngleTool: NSectAngleHandler | null = null;
  private threePointCircleTool: ThreePointCircleHandler | null = null;
  private measuredCircleTool: MeasuredCircleHandler | null = null;
  private translationTool: TranslationTransformationHandler | null = null;
  private rotationTool: RotationTransformationHandler | null = null;
  private reflectionTool: ReflectionTransformationHandler | null = null;
  private pointReflectionTool: PointReflectionTransformationHandler | null =
    null;
  private inversionTool: InversionTransformationHandler | null = null;
  private applyTransformationTool: ApplyTransformationHandler | null = null;

  /**
   * The layers for displaying the various objects in the right way. So a point in the
   * background is not displayed over a line in the foreground
   */
  readonly layers!: Two.Group[];

  created(): void {
    this.twoInstance = new Two({
      width: this.canvasSize,
      height: this.canvasSize,
      autostart: true
      // ratio: window.devicePixelRatio
    });
    // this.twoInstance.scene.matrix.manual = true;
    // Clear layer array
    // this.layers.splice(0);

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

        newLayer.addTo(this.twoInstance.scene);
        groups.push(newLayer);
      }
    }
    //#endregion addlayers

    // The midground is where the temporary objects and the boundary circle were drawn TODO: Needed?
    //this.sphereCanvas = this.layers[LAYER.midground];
    // console.info("Sphere canvas ID", this.sphereCanvas.id);
    // Add the layers to the store
    this.init();
    this.setLayers(groups);

    // Draw the boundary circle in the default radius
    // and scale it later to fit the canvas
    this.boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
    this.boundaryCircle.noFill();
    this.boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth;
    this.boundaryCircle.addTo(this.layers[Number(LAYER.midground)]);

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.boundaryCircle.id), {
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
    // this.sphereCanvas.add(
    //   hLine,
    //   vLine,
    //   new Line(100, -R, 100, R),
    //   new Line(-R, 100, R, 100)
    // );
    //this.visitor = new RotationVisitor();

    // Create the tools/handlers
    this.rotateTool = new RotateHandler(this.layers);
    this.currentTool = this.rotateTool;
    // Postpone the instantiation of the remaining tools to on-demand
    // to avoid runtime error when the tools depend of Pinia initialization

    // Add Event Bus (a Vue component) listeners to change the display of the sphere - rotate and Zoom/Pan
    EventBus.listen("sphere-rotate", this.handleSphereRotation);
    EventBus.listen("zoom-updated", this.updateView);
    EventBus.listen("export-current-svg", this.getCurrentSVGForIcon);
    EventBus.listen("construction-loaded", this.animateCanvas);
    EventBus.listen(
      "measured-circle-set-temporary-radius",
      this.measuredCircleSetTemporaryRadius
    );
    EventBus.listen("set-expression-for-tool", this.setExpressionForTool);
    EventBus.listen(
      "set-transformation-for-tool",
      this.setTransformationForTool
    );
    EventBus.listen("delete-node", this.deleteNode);
    // EventBus.listen("dialog-box-is-active", this.dialogBoxIsActive);
    // EventBus.listen(
    //   "set-point-visibility-and-label",
    //   this.setPointInitialVibilityAndLabel
    // );
  }

  mounted(): void {
    // Put the main js instance into the canvas
    this.twoInstance.appendTo(this.$refs.canvas);
    // Set up the listeners
    this.$refs.canvas.addEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.addEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.addEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.addEventListener("wheel", this.handleMouseWheel);

    // Add the listener to disable the context menu because without this line of code, if the user activates a tool,
    // then *first* presses ctrl key, then mouse clicks, a context menu appears and the functionality of the tool is
    // unpredictable. (In the case of the move tool, if the user first clicks, then presses ctrl, the behavior is fine.)
    // source: https://www.sitepoint.com/community/t/how-do-i-disable-the-context-menu-in-chrome-on-a-mac/346738
    // I can't see a good way to remove this listener
    // IS THIS A GOOD IDEA? Maybe not
    this.$refs.canvas.addEventListener("contextmenu", event =>
      event.preventDefault()
    );

    // Make the canvas accessible to other components which need
    // to grab the SVG contents of the sphere
    this.setCanvas(this.$refs.canvas);
    this.updateView();
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.removeEventListener("wheel", this.handleMouseWheel);
    // Does this remove the context menu listener? I'm not sure.
    this.$refs.canvas.removeEventListener("contextmenu", event =>
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
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    this.twoInstance.width = size;
    this.twoInstance.height = size;
    // this.layers.forEach(z => {
    //   z.translation.set(size / 2, size / 2);
    // });

    const radius = size / 2 - 16; // 16-pixel gap
    // this.setSphereRadius(radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    //this.zoomMagnificationFactor = ratio;
    //set the zoom magnification in the store so that all geometric/plottable objects are updated.
    this.setZoomMagnificationFactor(ratio);
    // Each window size gets its own zoom matrix
    // When you resize a window the zoom resets
    this.zoomTranslation.splice(0);
    // this.zoomTranslation.push(size / 2, size / 2);
    this.zoomTranslation.push(0, 0);

    this.updateView();
    // record the canvas width for the SELabel so that the bounding box of the text can be computed correctly
    this.setCanvasWidth(size);
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */

  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom

  //#region updateView
  private updateView() {
    // Get the current maginification factor and translation vector
    const mag = this.zoomMagnificationFactor;
    const transVector = this.zoomTranslation;
    const origin = this.canvasSize / 2;

    this.twoInstance.scene.translation = new Two.Vector(
      origin + transVector[0],
      origin + transVector[1]
    );
    this.twoInstance.scene.scale = new Two.Vector(mag, -mag);
    // this.twoInstance.scene.matrix
    //   .identity()
    //   .translate(origin + transVector[0], origin + transVector[1]) // Order of these two operations
    //   .scale(mag, -mag); // (translate & scale) is important
    //Now update the display of the arrangement (i.e. make sure the labels are not too far from their associated objects)
    this.seLabels.forEach((l: SELabel) => {
      l.update();
    });
  }
  //#endregion updateView

  handleMouseWheel(event: WheelEvent): void {
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
    const currentMagFactor = this.zoomMagnificationFactor;
    let newMagFactor = currentMagFactor;
    // Set the next magnification factor. Positive scroll fraction means zoom out, negative zoom in.
    if (scrollFraction < 0) {
      if (currentMagFactor < SETTINGS.zoom.minMagnification) {
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
      newMagFactor = (1 - Math.abs(scrollFraction)) * currentMagFactor;
    }
    if (scrollFraction > 0) {
      if (currentMagFactor > SETTINGS.zoom.maxMagnification) {
        console.error(
          `Exceeded zoom in limit ${SETTINGS.zoom.minMagnification}`
        );
        EventBus.fire("show-alert", {
          key: `handlers.panZoomHandlerZoomInLimitReached`,
          keyOptions: {},
          type: "warning"
        });
        return;
      }
      newMagFactor = (1 + scrollFraction) * currentMagFactor;
    }
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = [
      this.zoomTranslation[0],
      this.zoomTranslation[1]
    ];

    // Compute (untransformedPixelX,untransformedPixelY) which is the location of the mouse
    // wheel event *pre* affine transformation
    const untransformedPixelX =
      (pixelX - currentTranslationVector[0]) / currentMagFactor;
    const untransformedPixelY =
      (pixelY - currentTranslationVector[1]) / currentMagFactor;
    // Compute the new translation Vector. We want the untransformedPixel vector to be mapped
    // to the pixel vector under the new magnification factor. That is, if
    //  Z(x,y)= newMagFactor*(x,y) + newTranslationVector
    // then we must have
    //  Z(untransformedPixel) = pixel Vector
    // Solve for newTranslationVector yields

    const newTranslationVector = [
      pixelX - untransformedPixelX * newMagFactor,
      pixelY - untransformedPixelY * newMagFactor
    ];
    // When zooming out, add extra translation so the pivot of
    // zoom is eventually (0,0) when the magnification factor reaches 1
    if (newMagFactor < currentMagFactor) {
      if (newMagFactor > 1) {
        const fraction = (newMagFactor - 1) / (currentMagFactor - 1);
        newTranslationVector[0] *= fraction;
        newTranslationVector[1] *= fraction;
      } else {
        newTranslationVector[0] = 0;
        newTranslationVector[1] = 0;
      }
    }

    // Set the new magnification factor and the next translation vector in the store
    // this.zoomMagnificationFactor = newMagFactor;
    this.setZoomMagnificationFactor(newMagFactor); //must be set this way so that plottables resize correctly
    this.zoomTranslation.splice(0);
    this.zoomTranslation.push(...newTranslationVector);
    // Update the display
    this.updateView();
    // Query to see if the last command on the stack was also a zoom sphere command. If it was, simply update that command with the new
    // magnification factor and translations vector. If the last command wasn't a zoom sphere command, push a new one onto the stack.
    const commandStackLength = Command.commandHistory.length;
    if (
      Command.commandHistory[commandStackLength - 1] instanceof
      ZoomSphereCommand
    ) {
      (
        Command.commandHistory[commandStackLength - 1] as ZoomSphereCommand
      ).setMagnificationFactor = newMagFactor;
      (
        Command.commandHistory[commandStackLength - 1] as ZoomSphereCommand
      ).setTranslationVector = newTranslationVector;
    } else {
      // Store the zoom as a command that can be undone or redone
      const zoomCommand = new ZoomSphereCommand(
        newMagFactor,
        newTranslationVector,
        currentMagFactor,
        currentTranslationVector
      );
      // Push the command on to the command stack, but do not execute it because it has already been enacted
      zoomCommand.push();
    }
  }
  handleMouseMoved(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, currentTool? resolves to no action
      this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    // const bb = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // console.debug(
    //   "Mode",
    //   this.actionMode,
    //   ` mouse pressed at (${e.clientX - bb.left},${e.clientY - bb.top})`
    // );
    if (e.button === 0) this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    // const bb = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // console.debug(
    //   "Mode",
    //   this.actionMode,
    //   ` mouse released at (${e.clientX - bb.left},${e.clientY - bb.top})`
    // );
    if (e.button === 0) {
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseReleased(e);
    }
  }

  handleMouseLeave(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseLeave(e);
  }

  //#region handleSphereRotation
  handleSphereRotation(e: unknown): void {
    this.rotateSphere((e as any).transform);
  }
  //#endregion handleSphereRotation

  getCurrentSVGForIcon(): void {
    const svgRoot = this.$refs.canvas?.querySelector("svg") as SVGElement;
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

  animateCanvas(): void {
    this.$refs.canvas.classList.add("spin");
    setTimeout(() => {
      this.$refs.canvas.classList.remove("spin");
    }, 1200);
  }

  measuredCircleSetTemporaryRadius(e: {
    display: boolean;
    radius: number;
  }): void {
    if (this.currentTool instanceof MeasuredCircleHandler) {
      this.currentTool.displayTemporaryCircle(e.display, e.radius);
    }
  }

  setExpressionForTool(e: { expression: SEExpression }): void {
    if (
      this.currentTool instanceof MeasuredCircleHandler ||
      this.currentTool instanceof RotationTransformationHandler ||
      this.currentTool instanceof TranslationTransformationHandler
    ) {
      this.currentTool.setExpression(e.expression);
    }
  }

  setTransformationForTool(e: { transformation: SETransformation }): void {
    if (this.currentTool instanceof ApplyTransformationHandler) {
      this.currentTool.setTransformation(e.transformation);
    } else {
      // console.debug(`The current action mode ${this.actionMode}`);
      this.setActionMode({
        id: "applyTransformation",
        name: "ApplyTransformationDisplayedName"
      });
      // console.debug(`The current action mode ${this.actionMode}`);
      // this.currentTool?.deactivate();
      if (!this.applyTransformationTool) {
        this.applyTransformationTool = new ApplyTransformationHandler(
          this.layers
        );
      }
      this.applyTransformationTool.setTransformation(e.transformation);
    }
  }

  deleteNode(e: {
    victim: SENodule;
    victimName: string;
    victimType: string;
  }): void {
    if (!this.deleteTool) {
      this.deleteTool = new DeleteHandler(this.layers);
    }
    const deletedNodeIds = this.deleteTool.delete(e.victim);
    //deletedNodes: "Successfully deleted {type} {name} and {number} {objects} that depend on it.",
    EventBus.fire("show-alert", {
      key: `handlers.deletedNodes`,
      keyOptions: {
        type: e.victimType,
        name: e.victimName,
        number: deletedNodeIds.length - 1,
        objects:
          deletedNodeIds.length === 2
            ? i18n.tc(`objects.objects`, 4)
            : i18n.tc(`objects.objects`, 3)
      },
      type: "success"
    });
  }

  // dialogBoxIsActive(e: { active: boolean }): void {
  //   // console.debug(`dialog box is active is ${e.active}`);
  //   if (this.hideTool) {
  //     this.hideTool.disableKeyHandler = e.active;
  //   }
  //   if (this.nSectAngleTool) {
  //     this.nSectAngleTool.disableKeyHandler = e.active;
  //   }
  //   if (this.nSectSegmentTool) {
  //     this.nSectSegmentTool.disableKeyHandler = e.active;
  //   }
  //   if (this.rotateTool) {
  //     this.rotateTool.disableKeyHandler = e.active;
  //   }
  //   if (this.selectTool) {
  //     this.selectTool.disableKeyHandler = e.active;
  //   }
  //   if (this.toggleLabelDisplayTool) {
  //     this.toggleLabelDisplayTool.disableKeyHandler = e.active;
  //   }
  // }
  /**
   * Watch the actionMode in the store. This is the two-way binding of variables in the Vuex Store.  Notice that this
   * is a vue component so we are able to Watch for changes in variables in the store. If this was not a vue component
   * we would not be able to do this (at least not directly).
   */
  @Watch("actionMode")
  switchActionMode(mode: ActionMode): void {
    //console.debug("Switch tool /action mode");
    this.currentTool?.deactivate();
    this.currentTool = null;
    //set the default footer color -- override as necessary
    EventBus.fire("set-footer-color", { color: colors.blue.lighten4 });
    const directiveMsg = {key: "buttons." + this.buttonSelection.displayedName,
            secondaryMsg: "buttons." + this.buttonSelection.toolUseMessage,
            keyOptions: {},
            secondaryMsgKeyOptions: {},
            type: "directive",
          };

    switch (mode) {
      case "select":
        if (!this.selectTool) {
          this.selectTool = new SelectionHandler(this.layers);
        }
        this.currentTool = this.selectTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "delete":
        if (!this.deleteTool) {
          this.deleteTool = new DeleteHandler(this.layers);
        }
        this.currentTool = this.deleteTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "zoomIn":
        if (!this.zoomTool) {
          this.zoomTool = new PanZoomHandler(this.$refs.canvas);
        }
        this.zoomTool.zoomMode = ZoomMode.MAGNIFY;
        this.currentTool = this.zoomTool;
        break;
      case "zoomOut":
        if (!this.zoomTool) {
          this.zoomTool = new PanZoomHandler(this.$refs.canvas);
        }
        this.zoomTool.zoomMode = ZoomMode.MINIFY;
        this.currentTool = this.zoomTool;
        break;
      case "zoomFit":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the zoom fit (and the tool should be the same)
        if (!this.zoomTool) {
          this.zoomTool = new PanZoomHandler(this.$refs.canvas);
        }

        this.zoomTool.doZoomFit(this.canvasSize);
        this.zoomTool.activate(); // unglow any selected objects.
        this.zoomTool.deactivate(); // shut the tool down properly
        this.revertActionMode();
        break;

      case "iconFactory":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the click (and the tool should be the same)
        if (!this.iconFactoryTool) {
          this.iconFactoryTool = new IconFactoryHandler();
        }
        this.iconFactoryTool.createIconPaths();
        this.revertActionMode();
        break;

      case "hide":
        if (!this.hideTool) {
          this.hideTool = new HideObjectHandler(this.layers);
        }
        this.currentTool = this.hideTool;
        break;
      case "move":
        if (!this.moveTool) {
          this.moveTool = new MoveHandler(this.layers);
        }
        this.currentTool = this.moveTool;
        EventBus.fire("set-footer-color", { color: colors.red.lighten5 });
        break;
      case "rotate":
        if (!this.rotateTool) {
          this.rotateTool = new RotateHandler(this.layers);
        }
        this.currentTool = this.rotateTool;
        break;

      case "point":
        if (!this.pointTool) {
          this.pointTool = new PointHandler(this.layers);
        }
        this.currentTool = this.pointTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "line":
        if (!this.lineTool) {
          this.lineTool = new LineHandler(this.layers);
        }
        this.currentTool = this.lineTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "segment":
        if (!this.segmentTool) {
          this.segmentTool = new SegmentHandler(this.layers);
        }
        this.currentTool = this.segmentTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "circle":
        if (!this.circleTool) {
          this.circleTool = new CircleHandler(this.layers);
        }
        this.currentTool = this.circleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "ellipse":
        if (!this.ellipseTool) {
          this.ellipseTool = new EllipseHandler(this.layers);
        }
        this.currentTool = this.ellipseTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "antipodalPoint":
        if (!this.antipodalPointTool) {
          this.antipodalPointTool = new AntipodalPointHandler(this.layers);
        }
        this.currentTool = this.antipodalPointTool;
        break;
      case "polar":
        if (!this.polarObjectTool) {
          this.polarObjectTool = new PolarObjectHandler(this.layers);
        }
        this.currentTool = this.polarObjectTool;
        break;
      case "intersect":
        if (!this.intersectTool) {
          this.intersectTool = new IntersectionPointHandler(this.layers);
        }
        this.currentTool = this.intersectTool;
        break;
      case "pointOnObject":
        if (!this.pointOnOneDimensionalTool) {
          this.pointOnOneDimensionalTool = new PointOnOneDimensionalHandler(
            this.layers
          );
        }
        this.currentTool = this.pointOnOneDimensionalTool;
        break;

      case "segmentLength":
        if (!this.segmentLengthTool) {
          this.segmentLengthTool = new SegmentLengthHandler(this.layers);
        }
        this.currentTool = this.segmentLengthTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "pointDistance":
        if (!this.pointDistanceTool) {
          this.pointDistanceTool = new PointDistanceHandler(this.layers);
        }
        this.currentTool = this.pointDistanceTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "angle":
        if (!this.angleTool) {
          this.angleTool = new AngleHandler(this.layers);
        }
        this.currentTool = this.angleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "coordinate":
        if (!this.coordinateTool) {
          this.coordinateTool = new CoordinateHandler(this.layers);
        }
        this.currentTool = this.coordinateTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "toggleLabelDisplay":
        if (!this.toggleLabelDisplayTool) {
          this.toggleLabelDisplayTool = new ToggleLabelDisplayHandler(
            this.layers
          );
        }
        this.currentTool = this.toggleLabelDisplayTool;
        break;
      case "perpendicular":
        if (!this.perpendicularLineThruPointTool) {
          this.perpendicularLineThruPointTool =
            new PerpendicularLineThruPointHandler(this.layers);
        }

        this.currentTool = this.perpendicularLineThruPointTool;
        break;
      case "tangent":
        if (!this.tangentLineThruPointTool) {
          this.tangentLineThruPointTool = new TangentLineThruPointHandler(
            this.layers
          );
        }
        this.currentTool = this.tangentLineThruPointTool;
        break;
      case "measureTriangle":
        if (!this.measureTriangleTool) {
          this.measureTriangleTool = new PolygonHandler(this.layers, true);
        }
        this.currentTool = this.measureTriangleTool;
        break;
      case "measurePolygon":
        if (!this.measurePolygonTool) {
          this.measurePolygonTool = new PolygonHandler(this.layers, false);
        }
        this.currentTool = this.measurePolygonTool;
        break;
      case "midpoint":
        if (!this.midpointTool) {
          this.midpointTool = new NSectSegmentHandler(this.layers, true);
        }
        this.currentTool = this.midpointTool;
        break;
      case "nSectPoint":
        if (!this.nSectSegmentTool) {
          this.nSectSegmentTool = new NSectSegmentHandler(this.layers, false);
        }
        this.currentTool = this.nSectSegmentTool;
        break;
      case "angleBisector":
        if (!this.angleBisectorTool) {
          this.angleBisectorTool = new NSectAngleHandler(this.layers, true);
        }
        this.currentTool = this.angleBisectorTool;
        break;
      case "nSectLine":
        if (!this.nSectAngleTool) {
          this.nSectAngleTool = new NSectAngleHandler(this.layers, false);
        }
        this.currentTool = this.nSectAngleTool;
        break;
      case "threePointCircle":
        if (!this.threePointCircleTool) {
          this.threePointCircleTool = new ThreePointCircleHandler(this.layers);
        }
        this.currentTool = this.threePointCircleTool;
        break;
      case "measuredCircle":
        if (!this.measuredCircleTool) {
          this.measuredCircleTool = new MeasuredCircleHandler(this.layers);
        }
        this.currentTool = this.measuredCircleTool;
        break;
      case "translation":
        if (!this.translationTool) {
          this.translationTool = new TranslationTransformationHandler(
            this.layers
          );
        }
        this.currentTool = this.translationTool;
        break;
      case "rotation":
        if (!this.rotationTool) {
          this.rotationTool = new RotationTransformationHandler(this.layers);
        }
        this.currentTool = this.rotationTool;
        break;
      case "reflection":
        if (!this.reflectionTool) {
          this.reflectionTool = new ReflectionTransformationHandler(
            this.layers
          );
        }
        this.currentTool = this.reflectionTool;
        break;
      case "pointReflection":
        if (!this.pointReflectionTool) {
          this.pointReflectionTool = new PointReflectionTransformationHandler(
            this.layers
          );
        }
        this.currentTool = this.pointReflectionTool;
        break;
      case "inversion":
        if (!this.inversionTool) {
          this.inversionTool = new InversionTransformationHandler(this.layers);
        }
        this.currentTool = this.inversionTool;
        break;
      case "applyTransformation":
        if (!this.applyTransformationTool) {
          this.applyTransformationTool = new ApplyTransformationHandler(
            this.layers
          );
        }
        this.currentTool = this.applyTransformationTool;
        break;
      default:
        this.currentTool = null;
    }
    if (this.currentTool) {
      EventBus.fire("show-alert", directiveMsg);
    }
    this.currentTool?.activate();
  }
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
</style>
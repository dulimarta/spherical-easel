<template>
  <div>
    <div id="canvas"
      ref="canvas"></div>
  </div>
</template>


<script lang="ts">
import VueComponent from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
import Two from "two.js";
import SETTINGS, { LAYER } from "@/global-settings";
import { namespace } from "vuex-class";
import { SEStore } from "@/store";
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
import SliderHandler from "@/eventHandlers/SliderHandler";
import ToggleLabelDisplayHandler from "@/eventHandlers/ToggleLabelDisplayHandler";
import PerpendicularLineThruPointHandler from "@/eventHandlers/PerpendicularLineThruPointHandler";
import TangentLineThruPointHandler from "@/eventHandlers/TangentLineThruPointHandler";
import IconFactoryHandler from "@/eventHandlers/IconFactoryHandler";
import EllipseHandler from "@/eventHandlers/EllipseHandler";
import PolygonHandler from "@/eventHandlers/PolygonHandler";
import NSectSegmentHandler from "@/eventHandlers/NSectSegmentHandler";
import NSectAngleHandler from "@/eventHandlers/NSectAngleHandler";

import EventBus from "@/eventHandlers/EventBus";
import MoveHandler from "../eventHandlers/MoveHandler";
import { ActionMode, AppState, plottableType } from "@/types";
import colors from "vuetify/es5/util/colors";
import { SELabel } from "@/models/SELabel";
import FileSaver from "file-saver";
import Nodule from "@/plottables/Nodule";
import { SELine } from "@/models/SELine";
const SE = namespace("se");

@Component({})
export default class SphereFrame extends VueComponent {
  @Prop({ default: 240 })
  readonly canvasSize!: number;

  @SE.State((s: AppState) => s.actionMode)
  readonly actionMode!: ActionMode;

  @SE.State((s: AppState) => s.zoomMagnificationFactor)
  readonly zoomMagnificationFactor!: number;

  @SE.State((s: AppState) => s.zoomTranslation)
  readonly zoomTranslation!: number[];

  @SE.State((s: AppState) => s.seLabels)
  readonly seLabels!: SELabel[];

  // @SE.Mutation setCanvas!: (_: HTMLDivElement) => void;

  $refs!: {
    canvas: HTMLDivElement;
  };
  /**
   * The main (the only one) TwoJS object that contains the layers (each a Two.Group) making up the screen graph
   * First layers  (Two.Groups) are added to the twoInstance (index by the enum LAYER from
   * global-settings.ts), then TwoJs objects (Two.Path, Two.Ellipse, etc..) are added to the
   * appropriate layer. This object is refreahed at 60 fps (in constructir -- autostart: true).
   */
  private twoInstance: Two;

  // private sphereCanvas!: Two.Group;
  /**
   * The circle that is the end of the projection of the Default Sphere in the Default Screen Plane
   */
  private boundaryCircle!: Two.Circle;
  /**
   * The Global Vuex Store
   */

  /** Tools for handling user input */
  private currentTool: ToolStrategy | null = null;
  private selectTool!: SelectionHandler;
  private pointTool!: PointHandler;
  private lineTool!: LineHandler;
  private segmentTool!: SegmentHandler;
  private circleTool!: CircleHandler;
  private ellipseTool!: EllipseHandler;
  private rotateTool!: RotateHandler;
  private zoomTool!: PanZoomHandler;
  private moveTool!: MoveHandler;
  private pointOnOneDimensionalTool!: PointOnOneDimensionalHandler;
  private antipodalPointTool!: AntipodalPointHandler;
  private polarObjectTool!: PolarObjectHandler;
  private intersectTool!: IntersectionPointHandler;
  private deleteTool!: DeleteHandler;
  private hideTool!: HideObjectHandler;
  private segmentLengthTool!: SegmentLengthHandler;
  private pointDistanceTool!: PointDistanceHandler;
  private angleTool!: AngleHandler;
  private coordinateTool!: CoordinateHandler;
  private sliderTool!: SliderHandler;
  private toggleLabelDisplayTool!: ToggleLabelDisplayHandler;
  private perpendicularLineThruPointTool!: PerpendicularLineThruPointHandler;
  private tangentLineThruPointTool!: TangentLineThruPointHandler;
  private iconFactoryTool!: IconFactoryHandler;
  private measureTriangleTool!: PolygonHandler;
  private measurePolygonTool!: PolygonHandler;
  private midpointTool!: NSectSegmentHandler;
  private nSectSegmentTool!: NSectSegmentHandler;
  private angleBisectorTool!: NSectAngleHandler;
  private nSectAngleTool!: NSectAngleHandler;

  /**
   * The layers for displaying the various objects in the right way. So a point in the
   * background is not displayed over a line in the foreground
   */
  private layers: Two.Group[] = [];

  constructor() {
    super();
    this.twoInstance = new Two({
      width: this.canvasSize,
      height: this.canvasSize,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    // Clear layer array
    this.layers.splice(0, this.layers.length);

    //#region addlayers
    // Record the text layer number so that the y axis is not flipped for them
    const textLayers = [
      LAYER.foregroundText,
      LAYER.backgroundText,
      LAYER.foregroundTextGlowing,
      LAYER.backgroundTextGlowing
    ].map(Number); // shortcut for .map(x => Number(x))
    for (const layer in LAYER) {
      const layerIdx = Number(layer);
      if (!isNaN(layerIdx)) {
        // Create the layers
        const newLayer = this.twoInstance.makeGroup();
        this.layers.push(newLayer);

        // Don't flip the y-coord of text layers
        if (textLayers.indexOf(layerIdx) < 0) {
          // Not in textLayers
          newLayer.scale = new Two.Vector(1, -1);
        }
      }
    }
    //#endregion addlayers

    // The midground is where the temporary objects and the boundary circle were drawn TODO: Needed?
    //this.sphereCanvas = this.layers[LAYER.midground];
    // console.info("Sphere canvas ID", this.sphereCanvas.id);
    // Add the layers to the store
    SEStore.setLayers(this.layers);

    // Draw the boundary circle in the default radius
    // and scale it later to fit the canvas
    this.boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
    this.boundaryCircle.noFill();
    this.boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth;
    this.layers[LAYER.midground].add(this.boundaryCircle);

    //Record the path ids for all the TwoJS objects which are not glowing. This is for use in IconBase to create icons.
    Nodule.idPlottableDescriptionMap.set(String(this.boundaryCircle.id), {
      type: "boundaryCircle",
      side: "mid",
      fill: false,
      part: ""
    });

    // const box1 = new Two.Rectangle(-100, 150, 100, 150);
    // box1.fill = "hsl(200,80%,50%)";
    // const box2 = new Two.Rectangle(100, 150, 100, 150);
    // box2.fill = "red";
    // box1.addTo(this.layers[LAYER.background]);
    // box2.addTo(this.layers[LAYER.foregroundText]);

    // const t1 = new Two.Text(
    //   "Text must &#13;&#10; be upright 2\u{1D7B9}",
    //   50,
    //   80,
    //   {}
    // );
    // t1.size = 12;
    // t1.noStroke();
    // t1.fill = "#000";
    // (t1 as any).leading = 50;
    // // (t1 as any).linewidth = 30;
    // (t1 as any).id = "mytext";
    // (t1 as any).className = "myclass";
    // t1.decoration = "strikethrough";

    // this.layers[LAYER.foregroundText].add(t1);
    // console.debug("bound box", t1.getBoundingClientRect());
    // Draw horizontal and vertical lines (just for debugging)
    // const R = SETTINGS.boundaryCircle.radius;
    // const hLine = new Two.Line(-R, 0, R, 0);
    // const vLine = new Two.Line(0, -R, 0, R);
    // hLine.stroke = "red";
    // vLine.stroke = "green";
    // this.sphereCanvas.add(
    //   hLine,
    //   vLine,
    //   new Two.Line(100, -R, 100, R),
    //   new Two.Line(-R, 100, R, 100)
    // );
    //this.visitor = new RotationVisitor();
    // Add Event Bus (a Vue component) listeners to change the display of the sphere - rotate and Zoom/Pan
    EventBus.listen("sphere-rotate", this.handleSphereRotation);
    EventBus.listen("zoom-updated", this.updateView);
    EventBus.listen("export-current-svg", this.getCurrentSVGForIcon);
    EventBus.listen("construction-loaded", this.animateCanvas);
  }

  mounted(): void {
    // Put the main Two.js instance into the canvas
    this.twoInstance.appendTo(this.$refs.canvas);
    // Set the main Two.js instance to refresh at 60 fps
    this.twoInstance.play();

    // Set up the listeners
    this.$refs.canvas.addEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.addEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.addEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.addEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.addEventListener("wheel", this.handleMouseWheel);

    // Create the tools/handlers
    this.selectTool = new SelectionHandler(this.layers);
    this.currentTool = this.selectTool;
    this.pointTool = new PointHandler(this.layers);
    this.lineTool = new LineHandler(this.layers);
    this.segmentTool = new SegmentHandler(this.layers);
    this.circleTool = new CircleHandler(this.layers);
    this.ellipseTool = new EllipseHandler(this.layers);
    this.rotateTool = new RotateHandler(this.layers);
    this.zoomTool = new PanZoomHandler(this.$refs.canvas);
    this.iconFactoryTool = new IconFactoryHandler();
    this.moveTool = new MoveHandler(this.layers);
    this.intersectTool = new IntersectionPointHandler(this.layers);
    this.pointOnOneDimensionalTool = new PointOnOneDimensionalHandler(
      this.layers
    );
    this.antipodalPointTool = new AntipodalPointHandler(this.layers);
    this.polarObjectTool = new PolarObjectHandler(this.layers);
    this.deleteTool = new DeleteHandler(this.layers);
    this.hideTool = new HideObjectHandler(this.layers);
    this.segmentLengthTool = new SegmentLengthHandler(this.layers);
    this.pointDistanceTool = new PointDistanceHandler(this.layers);
    this.angleTool = new AngleHandler(this.layers);
    this.coordinateTool = new CoordinateHandler(this.layers);
    this.sliderTool = new SliderHandler(this.layers);
    this.toggleLabelDisplayTool = new ToggleLabelDisplayHandler(this.layers);
    this.perpendicularLineThruPointTool = new PerpendicularLineThruPointHandler(
      this.layers
    );
    this.tangentLineThruPointTool = new TangentLineThruPointHandler(
      this.layers
    );
    this.measureTriangleTool = new PolygonHandler(this.layers, true);
    this.measurePolygonTool = new PolygonHandler(this.layers, false);
    this.midpointTool = new NSectSegmentHandler(this.layers, true);
    this.nSectSegmentTool = new NSectSegmentHandler(this.layers, false);
    this.angleBisectorTool = new NSectAngleHandler(this.layers, true);
    this.nSectAngleTool = new NSectAngleHandler(this.layers, false);
    // Make the canvas accessible to other components which need
    // to grab the SVG contents of the sphere
    SEStore.setCanvas(this.$refs.canvas);
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.removeEventListener("wheel", this.handleMouseWheel);
    EventBus.unlisten("sphere-rotate");
    EventBus.unlisten("zoom-updated");
    EventBus.unlisten("export-current-svg");
    EventBus.unlisten("construction-loaded");
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    (this.twoInstance.renderer as any).setSize(size, size);
    // Move the origin of all layers to the center of the viewport
    this.layers.forEach(z => {
      z.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    });

    const radius = size / 2 - 16; // 16-pixel gap
    SEStore.setSphereRadius(radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    SEStore.setZoomMagnificationFactor(ratio);
    // Each window size gets its own zoom matrix
    // When you resize a window the zoom resets
    SEStore.setZoomTranslation([0, 0]);

    this.updateView();
    // record the canvas width for the SELabel so that the bounding box of the text can be computed correctly
    SEStore.setCanvasWidth(size);
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */

  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom

  //#region updateView
  private updateView() {
    // Get the current maginiication factor and translation vector
    const mag = SEStore.zoomMagnificationFactor;
    const transVector = SEStore.zoomTranslation;

    // Get the DOM element to apply the transform to
    const el = (this.twoInstance.renderer as any).domElement as HTMLElement;
    // Set the transform
    const mat = `matrix(${mag},0,0,${mag},${transVector[0]},${transVector[1]})`;
    // console.debug("CSS transform matrix: ", mat);
    el.style.transform = mat;
    // Set the origin of the transform
    const origin = this.canvasSize / 2;
    el.style.transformOrigin = `${origin}px ${origin}px`;
    // What does this do?
    el.style.overflow = "visible";
    //Now update the display of the arrangment (i.e. make sure the labels are not too far from their associated objects)
    this.seLabels.forEach((l: SELabel) => {
      l.update();
    });
  }
  //#endregion updateView

  handleMouseWheel(event: WheelEvent): void {
    // console.debug("Mouse Wheel Zoom!");
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
    const currentMagFactor = SEStore.zoomMagnificationFactor;
    let newMagFactor = currentMagFactor;
    // Set the next magnification factor. Positive scroll fraction means zoom out, negative zoom in.
    if (scrollFraction < 0) {
      if (currentMagFactor < SETTINGS.zoom.minMagnification) return;
      newMagFactor = (1 - Math.abs(scrollFraction)) * currentMagFactor;
    }
    if (scrollFraction > 0) {
      if (currentMagFactor > SETTINGS.zoom.maxMagnification) return;
      newMagFactor = (1 + scrollFraction) * currentMagFactor;
    }
    // Get the current translation vector to allow us to untransform the CSS transformation
    const currentTranslationVector = [
      SEStore.zoomTranslation[0],
      SEStore.zoomTranslation[1]
    ];

    // Compute (untransformedPixelX,untransformedPixelY) which is the location of the mouse
    // wheel event *pre* affine transformation
    const untransformedPixelX =
      (pixelX - currentTranslationVector[0]) / currentMagFactor;
    const untransformedPixelY =
      (pixelY - currentTranslationVector[1]) / currentMagFactor;
    // Compute the new translation Vector. We want the untransformedPixel vector to be mapped
    // to the pixel vector under the new maginification factor. That is, if
    //  Z(x,y)= newMagFactor*(x,y) + newTranslationVector
    // then we must have
    //  Z(untransformedPixel) = pixel Vector
    // Solve for newTranlationVector yields

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

    // Set the new magnifiction factor and the next translation vector in the store
    SEStore.setZoomMagnificationFactor(newMagFactor);
    SEStore.setZoomTranslation(newTranslationVector);
    // Update the display
    this.updateView();
    // Query to see if the last command on the stack was also a zoom sphere command. If it was, simply update that command with the new
    // magnification factor and translations vector. If the last command wasn't a zoom sphere command, push a new one onto the stack.
    const commandStackLength = Command.commandHistory.length;
    if (
      Command.commandHistory[commandStackLength - 1] instanceof
      ZoomSphereCommand
    ) {
      (Command.commandHistory[
        commandStackLength - 1
      ] as ZoomSphereCommand).setMagnificationFactor = newMagFactor;
      (Command.commandHistory[
        commandStackLength - 1
      ] as ZoomSphereCommand).setTranslationVector = newTranslationVector;
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
      // console.debug(
      //   SEStore.sePoints.length,
      //   "P  ",
      //   SEStore.seLines.length,
      //   "L   ",
      //   SEStore.seSegments.length,
      //   "S   ",
      //   SEStore.seCircles.length,
      //   "C   ",
      //   SEStore.seEllipses.length,
      //   "E"
      // );
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
    SEStore.rotateSphere((e as any).transform);
  }
  //#endregion handleSphereRotation

  getCurrentSVGForIcon(): void {
    const svgRoot = SEStore.svgCanvas?.querySelector("svg") as SVGElement;
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

    // remove all SVG goups with no children (they are are result of empty layers)
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
  /**
   * Watch the actionMode in the store. This is the two-way binding of variables in the Vuex Store.  Notice that this
   * is a vue component so we are able to Watch for changes in variables in the store. If this was not a vue component
   * we would not be able to do this (at least not directly).
   */
  @Watch("actionMode")
  switchActionMode(mode: ActionMode): void {
    this.currentTool?.deactivate();
    this.currentTool = null;
    //set the default footer color -- override as necessary
    EventBus.fire("set-footer-color", { color: colors.blue.lighten4 });
    switch (mode) {
      case "select":
        this.currentTool = this.selectTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "delete":
        this.currentTool = this.deleteTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "zoomIn":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MAGNIFY;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "zoomOut":
        this.currentTool = this.zoomTool;
        this.zoomTool.zoomMode = ZoomMode.MINIFY;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "zoomFit":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the zoom fit (and the tool should be the same)
        this.zoomTool.doZoomFit(this.canvasSize);
        SEStore.revertActionMode();
        break;

      case "iconFactory":
        // This is a tool that only needs to run once and then the actionMode should be the same as the is was before the click (and the tool should be the same)
        this.iconFactoryTool.createIconPaths();
        SEStore.revertActionMode();
        break;

      case "hide":
        this.currentTool = this.hideTool;
        break;
      case "move":
        this.currentTool = this.moveTool;
        EventBus.fire("set-footer-color", { color: colors.red.lighten5 });
        break;
      case "rotate":
        this.currentTool = this.rotateTool;
        break;

      case "point":
        this.currentTool = this.pointTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "line":
        this.currentTool = this.lineTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "segment":
        this.currentTool = this.segmentTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "circle":
        this.currentTool = this.circleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "ellipse":
        this.currentTool = this.ellipseTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "antipodalPoint":
        this.currentTool = this.antipodalPointTool;
        break;
      case "polar":
        this.currentTool = this.polarObjectTool;
        break;
      case "intersect":
        this.currentTool = this.intersectTool;
        break;
      case "pointOnOneDim":
        this.currentTool = this.pointOnOneDimensionalTool;
        break;

      case "segmentLength":
        this.currentTool = this.segmentLengthTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "pointDistance":
        this.currentTool = this.pointDistanceTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "angle":
        this.currentTool = this.angleTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "coordinate":
        this.currentTool = this.coordinateTool;
        EventBus.fire("set-footer-color", { color: colors.blue.lighten2 });
        break;
      case "slider":
        this.currentTool = this.sliderTool;
        break;
      case "toggleLabelDisplay":
        this.currentTool = this.toggleLabelDisplayTool;
        break;
      case "perpendicular":
        this.currentTool = this.perpendicularLineThruPointTool;
        break;
      case "tangent":
        this.currentTool = this.tangentLineThruPointTool;
        break;
      case "measureTriangle":
        this.currentTool = this.measureTriangleTool;
        break;
      case "measurePolygon":
        this.currentTool = this.measurePolygonTool;
        break;
      case "midpoint":
        this.currentTool = this.midpointTool;
        break;
      case "nSectPoint":
        this.currentTool = this.nSectSegmentTool;
        break;
      case "angleBisector":
        this.currentTool = this.angleBisectorTool;
        break;
      case "nSectLine":
        this.currentTool = this.nSectAngleTool;
        break;
      default:
        this.currentTool = null;
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
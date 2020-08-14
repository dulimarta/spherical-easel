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
import { State } from "vuex-class";
import AppStore from "@/store";
import { ZoomSphereCommand } from "@/commands/ZoomSphereCommand";
import { Command } from "@/commands/Command";
import { ToolStrategy } from "@/eventHandlers/ToolStrategy";
import SelectionHandler from "@/eventHandlers/SelectionHandler";
import PointHandler from "@/eventHandlers/PointHandler";
import LineHandler from "@/eventHandlers/LineHandler";
import SegmentHandler from "@/eventHandlers/SegmentHandler";
import CircleHandler from "@/eventHandlers/CircleHandler";
import RotateHandler from "@/eventHandlers/RotateHandler";
import PointOnOneDimensionalHandler from "@/eventHandlers/PointOnOneDimensionalHandler";
import IntersectionPointHandler from "@/eventHandlers/IntersectionPointHandler";
import AntipodalPointHandler from "@/eventHandlers/AntipodalPointHandler";
import PanZoomHandler, { ZoomMode } from "@/eventHandlers/PanZoomHandler";
import DeleteHandler from "@/eventHandlers/DeleteHandler";
import HideObjectHandler from "@/eventHandlers/HideObjectHandler";
import SegmentLengthHandler from "@/eventHandlers/SegmentLengthHandler";
import PointDistanceHandler from "@/eventHandlers/PointDistanceHandler";
import AngleHandler from "@/eventHandlers/AngleHandler";
import CoordinateHandler from "@/eventHandlers/PointCoordinateHandler";
import SliderHandler from "@/eventHandlers/SliderHandler";
import ToggleLabelDisplayHandler from "@/eventHandlers/ToggleLabelDisplayHandler";

import EventBus from "@/eventHandlers/EventBus";
import MoveHandler from "../eventHandlers/MoveHandler";
import { AppState } from "@/types";
import colors from "vuetify/es5/util/colors";

@Component({})
export default class SphereFrame extends VueComponent {
  @Prop()
  readonly canvasSize!: number;

  @State((s: AppState) => s.actionMode)
  readonly actionMode!: string;

  @State((s: AppState) => s.zoomMagnificationFactor)
  readonly zoomMagnificationFactor!: number;

  @State((s: AppState) => s.zoomTranslation)
  readonly zoomTranslation!: number[];

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
  protected store = AppStore;

  /** Tools for handling user input */
  private currentTool: ToolStrategy | null = null;
  private selectTool!: SelectionHandler;
  private pointTool!: PointHandler;
  private lineTool!: LineHandler;
  private segmentTool!: SegmentHandler;
  private circleTool!: CircleHandler;
  private rotateTool!: RotateHandler;
  private zoomTool!: PanZoomHandler;
  private moveTool!: MoveHandler;
  private pointOnOneDimensionalTool!: PointOnOneDimensionalHandler;
  private antipodalPointTool!: AntipodalPointHandler;
  private intersectTool!: IntersectionPointHandler;
  private deleteTool!: DeleteHandler;
  private hideTool!: HideObjectHandler;
  private segmentLengthTool!: SegmentLengthHandler;
  private pointDistanceTool!: PointDistanceHandler;
  private angleTool!: AngleHandler;
  private coordinateTool!: CoordinateHandler;
  private sliderTool!: SliderHandler;
  private toggleLabelDisplayTool!: ToggleLabelDisplayHandler;

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
    this.store.commit.setLayers(this.layers);

    // Draw the boundary circle in the default radius
    // and scale it later to fit the canvas
    this.boundaryCircle = new Two.Circle(0, 0, SETTINGS.boundaryCircle.radius);
    this.boundaryCircle.noFill();
    this.boundaryCircle.linewidth = SETTINGS.boundaryCircle.lineWidth;
    this.layers[LAYER.midground].add(this.boundaryCircle);
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
    // console.log("bound box", t1.getBoundingClientRect());
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
    this.rotateTool = new RotateHandler(this.layers);
    this.zoomTool = new PanZoomHandler(this.$refs.canvas);
    this.moveTool = new MoveHandler(this.layers);
    this.intersectTool = new IntersectionPointHandler(this.layers);
    this.pointOnOneDimensionalTool = new PointOnOneDimensionalHandler(
      this.layers
    );
    this.antipodalPointTool = new AntipodalPointHandler(this.layers);
    this.deleteTool = new DeleteHandler(this.layers);
    this.hideTool = new HideObjectHandler(this.layers);
    this.segmentLengthTool = new SegmentLengthHandler(this.layers);
    this.pointDistanceTool = new PointDistanceHandler(this.layers);
    this.angleTool = new AngleHandler(this.layers);
    this.coordinateTool = new CoordinateHandler(this.layers);
    this.sliderTool = new SliderHandler(this.layers);
    this.toggleLabelDisplayTool = new ToggleLabelDisplayHandler(this.layers);
  }

  beforeDestroy(): void {
    this.$refs.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.$refs.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.$refs.canvas.removeEventListener("mouseup", this.handleMouseReleased);
    this.$refs.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.$refs.canvas.removeEventListener("wheel", this.handleMouseWheel);
    EventBus.unlisten("new-slider-requested");
  }

  @Watch("canvasSize")
  onCanvasResize(size: number): void {
    // console.debug("onCanvasResize");
    (this.twoInstance.renderer as any).setSize(size, size);
    // Move the origin of all layers to the center of the viewport
    this.layers.forEach(z => {
      z.translation.set(this.canvasSize / 2, this.canvasSize / 2);
    });

    const radius = size / 2 - 16; // 16-pixel gap
    this.store.commit.setSphereRadius(radius);

    const ratio = radius / SETTINGS.boundaryCircle.radius;
    this.store.dispatch.changeZoomFactor(ratio);
    // Each window size gets its own zoom matrix
    // When you resize a window the zoom resets
    this.store.commit.setZoomTranslation([0, 0]);

    this.updateView();
    // record the canvas width for the SELabel so that the bounding box of the text can be computed correctly
    this.store.commit.setCanvasWidth(size);
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */

  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom

  //#region updateView
  private updateView() {
    // Get the current maginiication factor and translation vector
    const mag = this.store.state.zoomMagnificationFactor;
    const transVector = this.store.state.zoomTranslation;

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
  }
  //#endregion updateView

  handleMouseWheel(event: MouseWheelEvent): void {
    console.log("Mouse Wheel Zoom!");
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
    const currentMagFactor = this.store.state.zoomMagnificationFactor;
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
      this.store.state.zoomTranslation[0],
      this.store.state.zoomTranslation[1]
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
    this.store.dispatch.changeZoomFactor(newMagFactor);
    this.store.commit.setZoomTranslation(newTranslationVector);
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
    if (e.button === 0) this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseReleased(e);
  }

  handleMouseLeave(e: MouseEvent): void {
    // Only process events from the left (inner) mouse button to avoid adverse interactions with any pop-up menu
    if (e.button === 0)
      // When currentTool is NULL, the following line does nothing
      this.currentTool?.mouseLeave(e);
  }

  //#region handleSphereRotation
  handleSphereRotation(e: unknown): void {
    this.store.commit.rotateSphere((e as any).transform);
  }
  //#endregion handleSphereRotation

  getCurrentSVGForIcon(): void {
    const minimumNormForOneDimensional = 20000;
    const desiredIconSize = 32;
    const desiredSphereOutlineRadiusSize = 28;
    const sphereBoundaryStrokeWidth = 1;
    const desiredPointScale = 0.6;
    const num = this.canvasSize;
    const searchString = String(num / 2);
    const SVG = this.$refs.canvas.innerHTML.split(searchString).join("0");
    const splitSVG = SVG.split(/(<g.+?><\/g>)/);
    const noTextNoHidden = splitSVG.filter(
      subStr => !(subStr.indexOf("hidden") > -1 || subStr.indexOf("text") > -1)
    );
    const regEx1 = /\swidth.*defs>/g;
    const regEx2 = /\B<g id="two-\d*?" transform="matrix\(\d \d \d (\d|-\d) \d+ \d+\)" opacity="\d*?"><\/g>\B/g;
    // Remove the id="two-126" like strings
    const regEx3 = /\sid="two-\d*?"(\B|\s)/g;
    const regEx4 = /\btransform="matrix\(1 0 0 1 0\s0\)"\s\b/g;
    // Set the width of the boundary circle
    const regEx5 = /\sstroke-width="3"\s/g;

    const nextSVG1 = noTextNoHidden
      .join("")
      .replace(
        regEx1,
        ' viewBox=" ' +
          -desiredIconSize / 2 +
          " " +
          -desiredIconSize / 2 +
          " " +
          desiredIconSize +
          " " +
          desiredIconSize +
          '" preserveAspectRatio="xMidYMid meet" style="overflow: visible;">'
      )
      .replace(regEx2, "")
      .replace(regEx3, "")
      .replace(regEx4, "")
      .replace(regEx5, 'stroke-width="' + sphereBoundaryStrokeWidth + '"');
    const splitSVG2: string[] = [];
    const pointTransformMatrixIndices: number[] = [];
    nextSVG1.split('"').forEach((subStr, ind) => {
      const splitSubString = subStr.split(" ");

      if (
        splitSubString[0] === "M" &&
        Number(splitSubString[1]) !== undefined &&
        Number(splitSubString[2]) !== undefined
      ) {
        if (
          Number(splitSubString[1]) * Number(splitSubString[1]) +
            Number(splitSubString[2]) * Number(splitSubString[2]) >
          minimumNormForOneDimensional
        ) {
          // this is a line or segment or boundary circle description
          // so scale all the numbers in the subString
          const scaledSplitSubstring: string[] = [];
          splitSubString.forEach(str => {
            if (Number(str)) {
              scaledSplitSubstring.push(
                String((2 * desiredSphereOutlineRadiusSize * Number(str)) / num)
              );
            } else {
              scaledSplitSubstring.push(str);
            }
          });
          splitSVG2.push(scaledSplitSubstring.join(" "));
        } else {
          // This is the point description record the location and push it onto the splitSVG2
          pointTransformMatrixIndices.push(ind);
          splitSVG2.push(subStr);
        }
      } else {
        splitSVG2.push(subStr);
      }
    });
    // Two before each of the numbers in pointTransformMatrixIndices is a string of the form
    //   "matrix(0.649 0 0 0.649 -110.532 -112.988)"
    // replace it with
    //  "matrix(desiredPointScale 0 0 desiredPointScale <scaled1> <scaled2>)
    pointTransformMatrixIndices.forEach(num => {
      const str = splitSVG2[num - 2];
      const splitStr = str.split(" ");
      const transX = splitStr[4];
      const transY = splitStr[5].slice(0, splitStr[5].length - 2);
      const oldPointScale = splitStr[3];
      // oldx * scale + tranx = old locx--> newLocx= old/nummm

      const newStr =
        "matrix(" +
        oldPointScale +
        " 0 0 " +
        oldPointScale +
        " " +
        ((desiredSphereOutlineRadiusSize * Number(transX)) / num) * 0.28 +
        " " +
        ((desiredSphereOutlineRadiusSize * Number(transY)) / num) * 0.28 +
        ")";
      splitSVG2[num - 2] = newStr;
    });
    console.log(splitSVG2.join('"'));
    // const scaledSVG = splitSVG.join("");
    // //Divide all numbers surrounded by spaces that are not 1 or -1 by the num/(2*desiredSphereOutlineRadiusSize)
    // // SVG.split(" ").forEach(str => {
    // //   if (Number(str)) {
    // //     if (str === "1" || str === "-1") {
    // //       scaledSVG.push(str);
    // //     } else {
    // //       scaledSVG.push(
    // //         String((2 * desiredSphereOutlineRadiusSize * Number(str)) / num)
    // //       );
    // //     }
    // //   } else {
    // //     scaledSVG.push(str);
    // //   }
    // // });
    // console.log(scaledSVG);
    // const regEx1 = /(\B<g\sid="two-\d*"\stransform="matrix\(1 0 0 -1 0\s0\)" opacity="1"><\/g>\B|\B<g\sid="two-\d*"\stransform="matrix\(1 0 0 1 0\s0\)" opacity="1"><\/g>\B)/g;
    // const nextSVG1 = scaledSVG.replace(regEx1, "");
    // const regEx2 = /\btransform="matrix\(1 0 0 1 0\s0\)"\s\b/g;
    // const nextSVG2 = nextSVG1.replace(regEx2, "");

    // // Set the width of the boundary circle
    // const regEx4 = /\sstroke-width="3"\s/g;
    // const nextSVG4 = nextSVG3.replace(
    //   regEx4,
    //   'stroke-width="' + sphereBoundaryStrokeWidth + '"'
    // );
    // // // remove the text
    // // const regEx5 = /\B<text.*?<\/text>\B/g;
    // // const nextSVG5 = nextSVG4.replace(regEx5, "");

    // // Remove <g id="two-8" opacity="1"></g> like strings
    // const regEx6 = /\B<g id="two-\d*?" opacity="\d*?"><\/g>\B/g;
    // const nextSVG6 = nextSVG5.replace(regEx6, "");

    // // Remove the id="two-126" like strings
    // const regEx7 = /\sid="two-\d*?"(\B|\s)/g;
    // const nextSVG7 = nextSVG6.replace(regEx7, "");

    // // // Remove the hidden groups
    // // const regEx8 = /<g.+?(?=visibility="hidden").*?<\/g>/g;
    // // const nextSVG8 = nextSVG7.replace(regEx8, "");
    // console.log(nextSVG8);
  }
  /**
   * Watch the actionMode in the store. This is the two-way binding of variables in the Vuex Store.  Notice that this
   * is a vue component so we are able to Watch for changes in variables in the store. If this was not a vue component
   * we would not be able to do this (at least not directly).
   */
  @Watch("actionMode")
  switchActionMode(mode: string): void {
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
        this.store.commit.revertActionMode();
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

      case "antipodalPoint":
        this.currentTool = this.antipodalPointTool;
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
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>

<style lang="scss" scoped>
</style>
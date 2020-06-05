<template>
  <split-pane split="vertical" :min-percent="15" :max-percent="35"
    :default-percent="toolboxMinified ? 5 : 20" @resize="dividerMoved">
    <!-- Use the left page for the toolbox -->
    <template slot="paneL">
      <div>
        <v-btn icon @click="toolboxMinified = !toolboxMinified">
          <v-icon v-if="toolboxMinified">mdi-arrow-right</v-icon>
          <v-icon v-else>mdi-arrow-left</v-icon>
        </v-btn>
      </div>

      <toolbox ref="toolbox" :minified="toolboxMinified"></toolbox>
    </template>

    <!-- Use the right pane mainly for the canvas -->
    <template slot="paneR">
      <v-container fluid ref="rightPanel">
        <v-row>
          <v-col cols="12"> Rad:
            {{currentSphereRadius}} Canvas:
            {{currentCanvasSize}}/{{naturalCanvasSize}}
            {{tmpVector.toFixed(1)}}
          </v-col>
          <v-col cols="12">
            <v-row justify="center" class="pb-1">
              <v-responsive :aspect-ratio="1"
                :max-height="currentCanvasSize"
                :max-width="currentCanvasSize" ref="responsiveBox"
                id="responsiveBox" class="pa-0 yellow">
                <div ref="canvasContent" id="canvasContent"></div>
              </v-responsive>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </split-pane>
</template>

<script lang="ts">
import VueComponent from "vue";
import Two from "two.js";
import { Vue, Watch } from "vue-property-decorator";
import SplitPane from "vue-splitpane";
import Component from "vue-class-component";
import Toolbox from "@/components/ToolBox.vue";
import SETTINGS from "@/global-settings";
import { Matrix4, Vector3 } from 'three';
import { State } from 'vuex-class';
import { ToolStrategy } from '../events/ToolStrategy';
import NormalPointHandler from '../events/NormalPointHandler';
@Component({ components: { SplitPane, Toolbox } })
export default class Easel extends Vue {
  readonly RIGHT_PANE_PERCENTAGE = 80;
  private availHeight = 0; // Both split panes are sandwiched between the app bar and footer. This variable hold the number of pixels available for canvas height
  private currentCanvasSize = 0; // Result of height calculation will be passed to <v-responsive> via this variable
  private naturalCanvasSize = 0; // The canvas size at creation time

  private leftPanePercentage = 30;
  private toolboxMinified = false;

  private currentSphereRadius = 1; // The current sphere radius 

  private twoInstance: Two;
  private sphereCanvas!: Two.Group;
  private mainCircle!: Two.Circle;
  private sphereTransformMat = new Matrix4(); // Transformation from the ideal sphere to the rendered sphere/circle
  private zoomMatrix = new Matrix4(); // zoom in/out transformation
  private CSSTransformMat = new Matrix4(); // CSSMat = sphereTransform * zoomMat
  private inverseViewMat = new Matrix4();
  private tmpMatrix = new Matrix4();
  private tmpVector = new Vector3();
  private zoomCorrection = new Vector3();


  private currentTool: ToolStrategy | null = null;
  private pointTool!: NormalPointHandler;
  private magnificationFactor = 1;

  @State
  readonly editMode!: string;

  constructor() {
    super();
    this.twoInstance = new Two({
      width: SETTINGS.sphere.radius,
      height: SETTINGS.sphere.radius,
      autostart: true,
      ratio: window.devicePixelRatio
    });
    this.sphereCanvas = this.twoInstance.makeGroup();
    (this.sphereCanvas as any).scale = new Two.Vector(1, -1);
    console.info("Sphere cnavas ID", this.sphereCanvas.id);
    this.$store.commit("setSphere", this.sphereCanvas);
    this.mainCircle = new Two.Circle(0, 0, SETTINGS.sphere.radius);
    this.mainCircle.noFill();
    this.mainCircle.linewidth = SETTINGS.line.thickness;
    this.sphereCanvas.add(this.mainCircle);
    const textGroup = this.twoInstance.makeGroup();
    const R = SETTINGS.sphere.radius;
    const t1 = new Two.Text("(-0.66,0.66)", R / 2, R / 2);
    const t2 = new Two.Text(`(${R * 1.5},${R / 2})`, 1.5 * R, R / 2);
    const t3 = new Two.Text(`(${R / 2},${1.5 * R})`, R / 2, 1.5 * R);
    const t4 = new Two.Text(`(${1.5 * R},${1.5 * R})`, 1.5 * R, 1.5 * R);
    const t5 = new Two.Text(`(${R},${R})`, R, R);
    textGroup.add(t1, t2, t3, t4, t5);

    const hLine = new Two.Line(-R, 0, R, 0);
    const vLine = new Two.Line(0, -R, 0, R);
    hLine.stroke = "red";
    vLine.stroke = "green";
    this.sphereCanvas.add(
      hLine, vLine,
      new Two.Line(100, -R, 100, R),
      new Two.Line(-R, 100, R, 100),
    );
  }

  /** Apply the affine transform (m) to the entire TwoJS SVG tree! */
  // The translation element of the CSS transform matrix
  // is actually the pivot/origin of the zoom
  private set viewTransform(m: Matrix4) {
    this.CSSTransformMat.copy(m);
    const arr = m.elements;

    const el = ((this.twoInstance.renderer as any).domElement as HTMLElement);
    // CSS transformation matrix is only 2x3
    el.style.transform = `matrix(${arr[0]},${arr[1]},${arr[4]},${arr[5]},${arr[12]},${arr[13]})`;
    const orig = this.currentCanvasSize / 2;
    el.style.transformOrigin = `${orig}px ${orig}px`;
    el.style.overflow = "visible";
  }

  private get viewTransform() {
    return this.CSSTransformMat;
  }

  private adjustSize(): void {
    console.info("AdjustSize()")
    this.availHeight =
      window.innerHeight -
      this.$vuetify.application.footer -
      this.$vuetify.application.top;
    const tmp = this.$refs.responsiveBox;
    if (tmp) {
      let canvasPanel: HTMLElement;
      if (tmp instanceof VueComponent)
        canvasPanel = (tmp as VueComponent).$el as HTMLElement;
      else canvasPanel = tmp as HTMLElement;
      const rightBox = canvasPanel.getBoundingClientRect();
      this.currentCanvasSize = this.availHeight - rightBox.top;
      this.currentSphereRadius = (this.currentCanvasSize / 2) - 16;
    }
    // console.debug(
    //   `Available height ${this.availHeight.toFixed(
    //     2
    //   )} Canvas ${this.currentCanvasSize.toFixed(2)}`
    // );
  }


  /** mounted() is part of VueJS lifecycle hooks */
  mounted(): void {
    window.addEventListener("resize", this.onWindowResized);

    console.info("Mounted");
    this.adjustSize();
    this.naturalCanvasSize = this.currentCanvasSize;

    // Tell the renderer the new viewport
    (this.twoInstance.renderer as any).setSize(this.currentCanvasSize, this.currentCanvasSize);
    this.sphereCanvas.translation.set(
      this.twoInstance.width / 2,
      this.twoInstance.height / 2
    );
    const radius = (this.currentCanvasSize / 2) - 16;

    this.currentSphereRadius = radius;
    this.$store.commit("setSphereRadius", radius);
    // Draw the boundary circle in the ideal radius
    // and scale it later to fit the canvas
    // const scaleFactor = radius / SETTINGS.sphere.radius;
    // Flip Y-coordinate so positive Y-axis is up (north)
    // this.viewTransform = ;
    // ((this.twoInstance.renderer as any).domElement as HTMLElement).style.transform = `matrix(${scaleFactor},0,0,${scaleFactor},0,0)`;
    // (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);

    const el = this.$refs.canvasContent as HTMLElement;
    this.twoInstance.appendTo(el);
    this.twoInstance.play();
    this.pointTool = new NormalPointHandler(this.sphereCanvas, this.tmpMatrix);

    el.addEventListener("mousemove", this.handleMouseMoved);
    el.addEventListener("wheel", this.zoomer, { passive: true })
  }

  /** updated() is part of VueJS lifecycle hooks */

  updated(): void {
    console.info("Updated", "Circle", this.currentSphereRadius, "Canvas", this.currentCanvasSize, this.naturalCanvasSize);
    const ratio = this.currentSphereRadius / SETTINGS.sphere.radius;
    const ds = this.currentCanvasSize / 2;
    console.info("Circle ratio", ratio, "Circle translation", ds)
    this.sphereTransformMat.identity();
    this.tmpMatrix.makeScale(ratio, ratio, 1);
    this.sphereTransformMat.multiply(this.tmpMatrix);
    this.tmpMatrix.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
    this.viewTransform = this.tmpMatrix;
  }

  /** Spoit Pane resize handler
   * @param leftPercentage the percentage of the left pane width relative to the entire pane
   */
  dividerMoved(leftPercentage: number): void {

    this.adjustSize();
    // Calculate the width of the right panel
    const rightPanelWidth = (1 - leftPercentage / 100) * window.innerWidth;
    const canvasContent = this.$refs.canvasContent as HTMLElement;
    const box = canvasContent.getBoundingClientRect();
    console.debug("Pane resized: ", box.height, box.width, rightPanelWidth);
    // The canvas can't be bigger than its container height or the width
    // of the right panel
    if (box.height > rightPanelWidth) {
      this.currentCanvasSize = rightPanelWidth;
      this.currentSphereRadius = (this.currentCanvasSize / 2) - 16;
    }

    // Determine how much smaller/bigger the canvas compared to its "birth" size
    // const scaleFactor = this.currentCanvasSize / this.naturalCanvasSize;
    // Adjust the boundary circle accordingly
    (this.twoInstance.renderer as any).setSize(
      this.currentCanvasSize,
      this.currentCanvasSize
    );
    this.sphereCanvas.translation.set(
      this.currentCanvasSize / 2,
      this.currentCanvasSize / 2
    );
    // (this.sphereCanvas as any).scale = new Two.Vector(scaleFactor, -scaleFactor);
  }

  onWindowResized(): void {
    console.info("Resized");
    this.adjustSize();
    this.currentSphereRadius = (this.currentCanvasSize / 2) - 16;
    (this.twoInstance.renderer as any).setSize(
      this.currentCanvasSize,
      this.currentCanvasSize
    );
    this.sphereCanvas.translation.set(
      this.currentCanvasSize / 2,
      this.currentCanvasSize / 2
    );
  }

  handleMouseMoved(e: MouseEvent): void {
    // Using currentTarget is necessary. Otherwise, all the calculations
    // will be based on SVG elements whose bounding rectangle may splii
    // outsize of the responsive viewport and messing up our position calculations
    const target = (e.currentTarget || e.target) as HTMLDivElement;
    const boundingRect = target.getBoundingClientRect();
    // Don't rely on e.offsetX or e.offsetY, they may not be accurate
    const offsetX = e.clientX - boundingRect.left;
    const offsetY = e.clientY - boundingRect.top;
    const delta = this.currentCanvasSize / 2;
    const mx = offsetX - delta;
    const my = -(offsetY - delta);

    // The translation element of the CSS transform matrix
    // is actually the origin/pivot/center of the zoom.
    // However we have to flip the Y-coord sign


    // ZoomCorrection = inv(CSS) * ZoomOrigin
    // The last column in the matrix is the origin of the zoom coordinate frame
    // since Matrix4 stores its elements in column-major order, 
    // elems[12..14] are the 4th column
    this.zoomCorrection.set(this.CSSTransformMat.elements[12], -this.CSSTransformMat.elements[13], this.CSSTransformMat.elements[14]);
    this.zoomCorrection.applyMatrix4(this.tmpMatrix.getInverse(this.CSSTransformMat));

    // V = inv(CSS) * X
    this.tmpVector.set(mx, my, 0);
    this.tmpVector.applyMatrix4(this.tmpMatrix.getInverse(this.CSSTransformMat));
    // V = V - ZoomCorrection
    this.tmpVector.sub(this.zoomCorrection);

    // My attempt to simplify algebraically

    // V = inv(CSS) * X - inv(CSS) * Zo
    // V = inv(CSS)(X - Zo)
    console.debug(`Offset:(${offsetX},${offsetY}) => (${mx},${my}) => after correction`, this.tmpVector.toFixed(2));

    /*
    Why the following shorter computation does not work???
    */
    // const arr = this.CSSTransformMat.elements;
    // this.tmpVector.set(mx - arr[12], my + arr[13], -arr[14]);
    // this.tmpVector.applyMatrix4(this.tmpMatrix.getInverse(this.CSSTransformMat));
  }

  zoomer(e: MouseWheelEvent): void {
    if (e.metaKey) {
      e.preventDefault(); // do not propagate this event to the browser
      const scrollFraction = e.deltaY / this.currentCanvasSize;

      const scaleFactor = 1 + scrollFraction;
      // Limit zoom-out to 0.4x magnification factor
      if (scaleFactor < 1 && this.magnificationFactor < 0.4) return;

      // Limit zoom-in to 10x magnification factor
      if (scaleFactor > 1 && this.magnificationFactor > 10) return;
      this.magnificationFactor *= scaleFactor;
      const target = (e.currentTarget || e.target) as HTMLDivElement;
      const boundingRect = target.getBoundingClientRect();
      const offsetX = e.clientX - boundingRect.left;
      const offsetY = e.clientY - boundingRect.top;

      // The origin of translation is the center of the canvas
      const tx = offsetX - this.currentCanvasSize / 2;
      const ty = offsetY - this.currentCanvasSize / 2;
      console.debug("Zoom info", scrollFraction.toFixed(2), scaleFactor.toFixed(2), this.magnificationFactor.toFixed(2));
      const mag = this.magnificationFactor;

      // Update the zoom matrix
      if (mag > 1) {
        // Zoom from the current mouse position requires a composite transform
        this.zoomMatrix.identity();
        this.tmpMatrix.makeTranslation(tx, ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeScale(mag, mag, mag);
        this.zoomMatrix.multiply(this.tmpMatrix);
        this.tmpMatrix.makeTranslation(-tx, -ty, 0);
        this.zoomMatrix.multiply(this.tmpMatrix);
      } else {
        // Zoom from the origin when magnification factor is less than 1
        this.zoomMatrix.makeScale(mag, mag, mag);
      }
      // Construct the view matrix
      this.tmpMatrix.multiplyMatrices(this.sphereTransformMat, this.zoomMatrix);
      this.viewTransform = this.tmpMatrix; // Use the setter
    }
  }
  @Watch("editMode")
  switchEditMode(mode: string): void {
    this.currentTool = null;

    switch (mode) {
      case "point":
        this.currentTool = this.pointTool;
        break;
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
  }
}
</script>

<style scoped lang="scss">
#canvasContent {
  height: 100%;
  border: 2px dashed darkcyan;
  margin: 0;
  padding: 0;
  /* WARNING: when the CSS transform matrix implies scaling factor > 1, the content may spill outside the bounding box of #canvasContent,
    overflow contents must be CLIPPED (hidden)
  */
  overflow: hidden;
}

svg {
  pointer-events: none;
}
</style>

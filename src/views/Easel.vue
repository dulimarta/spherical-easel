<template>
  <div>
    <v-container fluid>
      <!--- ml-2: margin left 8 px -->
      <v-row>
        <v-col cols="12">
          Control buttons here
        </v-col>
        <!--- VUetify grid system uses 12-column layout. 
        Setting the attribute cols="12" means the v-col below
        takes 100% of the available width. Therefore programmatically we can only control the height using Vue style binding -->
        <v-col cols="12" id="contentWrapper" ref="contentWrapper">
          <!-- When the available area is too wide, we have to limit its width
          so the responsive area will not be taller than the viewport -->
          <v-responsive :aspect-ratio="1" :max-width="responsiveSize"
            :max-height="responsiveSize" id="responsive" ref="responsive"
            class="ma-2 yellow">
            <zoom-viewport :view-width="viewNaturalWidth"
              :view-height="viewNaturalHeight" :min-zoom="0.3"
              :max-zoom="4" @max-zoom-out="zoomWarning = true"
              @max-zoom-in="zoomWarning = true" class="orange">
              <div id="svgParent" ref="svgParent" class="ma-1 red"></div>
            </zoom-viewport>
          </v-responsive>
        </v-col>
      </v-row>
    </v-container>
    <!--  
      This is the left drawer component that contains that the
      tools and a list of the objects that have been created in two tabs
      
      Use the "clipped" attribute to keep the navigation drawer 
      below the app toolbar
      Use the "bottom" attribute to have this menu appear at the bottom on mobile
      
      The line ":mini-variant="leftDrawerMinified" is shorthand for 
      'v-bind:mini-variant="leftDrawerMinified"'
      this is a bond between the attribute 'mini-varient' (a Vue property of a navigation drawer)
      and the expression 'leftDrawerMinified' (a user name bolean variable)
      this means that when the expression 'leftDrawerMinified' changes the attribute 'mini-variant' 
      will update.
    -->

    <!--  Use the "clipped" attribute to keep the navigation drawer 
    below the app toolbar, width should be specified as number only (without unit) -->
    <v-navigation-drawer id="leftDrawer" ref="leftDrawer" app clipped
      color="accent" permanent :mini-variant="leftDrawerMinified" bottom
      :width="leftDrawerProperties.width">
      <v-container id="leftnav" fluid>
        <!-- These the navigation arrows TODO: I would like these to be in the same row as the
        tabs-->
        <div>
          <v-btn v-if="leftDrawerMinified" icon
            @click="setMinificationOfLeftDrawer(false)">
            <v-icon>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn v-else icon @click="setMinificationOfLeftDrawer(true)">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
        <!-- This the not minimized left drawer containing two tabs -->
        <div v-if="!leftDrawerMinified">
          <!-- Two tabs set up TODO: fix the behavior of the tabs-->
          <v-tabs v-model="activeLeftDrawerTab" centered grow>
            <v-tooltip bottom :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t("main.ToolsTabToolTip") }}</span>
            </v-tooltip>

            <v-tooltip bottom :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#objectListTab" v-on="on">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                </v-tab>
              </template>
              <span>{{ $t("main.ObjectsTabToolTip") }}</span>
            </v-tooltip>

            <v-tab-item value="toolListTab">
              <ToolButtons></ToolButtons>
            </v-tab-item>
            <v-tab-item value="objectListTab">
              <!--ObjectTree :scene="canvas">
              </ObjectTree-->
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <!-- This is the minified version of the left drawer with icon buttons for maximizing it -->
      <div id="leftnavicons" v-if="leftDrawerMinified"
        @click="setMinificationOfLeftDrawer(false)">
        <v-btn icon @click="
            setMinificationOfLeftDrawer(false);
            activeLeftDrawerTab = 'toolListTab';
          ">
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>
        <v-btn icon @click="
            leftDrawerMinified = !leftDrawerMinified;
            activeLeftDrawerTab = 'objectListTab';
          ">
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
    <!-- <event-handler :element="$refs.canvasContainer"
      @mousedown="handleMousePressed" /> -->
    <v-snackbar v-model="zoomWarning" color="warning" :timeout="2500">
      Can't zoom further
    </v-snackbar>
  </div>
</template>
<style lang="scss">
#contentWrapper {
  overflow: hidden;
  display: flex;
  flex-direction: row;
  justify-content: center;
  border: 2px dashed red; // Just for debugging so we can see the box boundary
  padding: 0;
  margin: 4px;
}

svg.se-geo {
  border: 3px solid brown;
  margin: 0;
  padding: 0;
}

#leftnav {
  display: flex;
  flex-direction: column;

  div:first-child {
    /* To force the "expand" arrow to justify right */
    align-self: flex-end;
  }
}
#leftnavicons {
  height: 80vh; // 80% of viewport height
  display: flex;
  flex-direction: column;
  justify-content: center;
}
/* Override the default behavior of Vuetify <v-btn-toggle> element */
.v-btn-toggle {
  flex-wrap: wrap;
}
</style>
<script lang="ts">
import VueComponent from "vue";
import { Vue, Watch } from "vue-property-decorator";
import Component from "vue-class-component";
// import Axes from "@/3d-objs/Axes";
// import Point from "@/3d-objs/Point";
import { ToolStrategy } from "@/events/ToolStrategy";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import CircleHandler from "@/events/CircleHandler";

import RotateHandler from "@/events/RotateHandler";
// import MoveHandler from "@/events/MoveHandler";
import SETTINGS from "@/global-settings";

/* Import the State so we can follow the command paradigm */
import { State } from "vuex-class";

/* Import the components for the contents of the navigation drawer */
import ObjectTree from "@/components/ObjectTree.vue";
import ToolButtons from "@/components/ToolButtons.vue";
import ZoomViewport from "@/components/ZoomViewport.vue";
import { setupScene } from "@/initApp";
import Two from "two.js";
// import Point from '../plotables/Point';
import { PositionVisitor } from "@/visitors/PositionVisitor";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { Visitor } from "@/visitors/Visitor";
// import Circle from '../3d-objs/Circle';
@Component({
  components: { ObjectTree, ToolButtons, ZoomViewport }
})
export default class Easel extends Vue {
  // @Prop(WebGLRenderer)
  // readonly renderer!: WebGLRenderer;

  // @Prop(HTMLCanvasElement)
  // readonly canvas!: HTMLCanvasElement;

  private scene!: Two;
  private canvas!: Two.Group;

  private leftDrawerMinified = false;
  private activeLeftDrawerTab = "toolListTab";

  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /*  Use the Strategy design pattern to enable switching of
  different tool algorithms at runtime, See the comment where these classes (modules?) are imported */
  private currentTool: ToolStrategy | null = null;
  private pointTool: NormalPointHandler | null = null;
  private lineTool: LineHandler | null = null;
  private segmentTool: SegmentHandler | null = null;
  private rotateTool: RotateHandler | null = null;
  private visitor: PositionVisitor | null = null;
  // private moveTool: MoveHandler;
  private circleTool: CircleHandler | null = null;
  // private controls: TransformControls;
  // private sphere: THREE.Mesh;
  private showSphereControl = false;
  private viewCurrentHeight = 600;
  private viewCurrentWidth = 450;
  private viewNaturalWidth = 600; // width at mounted time
  private viewNaturalHeight = 450; // height at mounted time
  private scaleFactor = new Two.Vector(1, -1);
  private zoomWarning = false;
  private leftDrawerProperties = {
    width: 300, //initial width and stores the current width (including the minified)
    borderWidth: 3, //the width for the border of the left drawer set to zero when minimfied
    minWidth: 250, //The minimum width: minWidth<=adjustedWidth is true always
    adjustedWidth: 300 // The value after the user has adjusted the width of the drawer
  };

  @State("editMode")
  private editMode!: string;

  constructor() {
    super();
    this.$store.commit("init");
    window.addEventListener("keypress", this.keyPressed);
    // RotateHandler emits a custom event "sphere-rotate"
    window.addEventListener(
      "sphere-rotate",
      this.handleSphereRotation as EventListener
    );
  }
  /**
   * Using the current browser viewport info and current box of the
   * SVG parent, determine available area (widthxheight) for our SVG drawing
   * while maintaining the aspect ratio in the global settings.
   * This function is invoked on initial mount and also during window resize
   *
   * @return {width,height} the actual dimension of the viewport
   */

  get responsiveSize(): number {
    return Math.min(this.viewCurrentHeight, this.viewCurrentWidth);
  }

  computeAvailableArea(): { width: number; height: number } {
    let parent: HTMLElement;
    const el = this.$refs.responsive;
    if (el instanceof VueComponent)
      parent = (el as VueComponent).$el as HTMLElement;
    else
      parent = el as HTMLElement
    const parentBox = parent.getBoundingClientRect();

    // Available height is the browser viewport height minus
    // the top position of the view relative to the browser top edge
    const availHeight = window.innerHeight - parentBox.top - 16; // Leave 16px gap?

    // Available width is the browser viewport width minus
    // the left position of the view relative to the browser left edge
    const availWidth = window.innerWidth - parentBox.left;
    const size = Math.min(availWidth, availHeight);
    // Compute the ideal dimension while maintaining aspect ratio
    return { width: size, height: size };
  }
  private toolTarget!: HTMLElement;

  mounted(): void {
    const { width, height } = this.computeAvailableArea();
    this.viewNaturalHeight = height;
    this.viewNaturalWidth = width;
    this.viewCurrentHeight = height;
    this.viewCurrentWidth = width;
    // const { foreground, midground, background, sphereCanvas } = setupScene();
    // this.sphereCanvas = sphereCanvas;
    // this.foreground = foreground;
    // this.midground = midground;
    // this.background = background;

    /* We have to move setupScene() call to "mounted" so we can check the actual screen space */
    const { two, canvas } = setupScene(width, height);
    this.scene = two;
    this.canvas = canvas;

    // Hack to add our own CSS class. Refer to the <style> section below
    // ((two.renderer as any).domElement as HTMLElement).classList.add("se-geo");
    this.currentTool = null;
    // this.pointTool = new NormalPointHandler(canvas);
    // this.lineTool = new LineHandler(canvas);
    // this.segmentTool = new SegmentHandler(canvas);
    // this.circleTool = new CircleHandler(canvas);
    // this.rotateTool = new RotateHandler(canvas);
    this.visitor = new PositionVisitor();
    // this.moveTool = new MoveHandler({
    //   camera: this.camera,
    //   scene: this.scene
    // });

    this.$store.commit("setSphere", this.canvas);

    // During testting scene is set to null and appendTo() will fail
    if (this.scene instanceof Two) {
      let svgParent: HTMLElement;
      const el = this.$refs.svgParent;
      if (typeof el !== "undefined") {
        // Anticipate the possibility that the tag is
        // either a VueComponent or native HTML
        if (el instanceof VueComponent)
          svgParent = (el as VueComponent).$el as HTMLElement;
        else svgParent = el as HTMLElement;

        this.scene.appendTo(svgParent);
        this.scene.play();
        // debugger; //eslint-disable-line
        svgParent.firstChild?.addEventListener(
          "mousemove",
          this.handleMouseMoved as EventListener
        );
        svgParent.firstChild?.addEventListener(
          "mousedown",
          this.handleMousePressed as EventListener
        );
        svgParent.firstChild?.addEventListener(
          "mouseup",
          this.handleMouseReleased as EventListener
        );
      }
    }
    // TODO: handle resize?
    window.addEventListener("resize", this.onWindowResized);

    this.onWindowResized();
    this.setLeftDrawerBorderEvents();
  }

  updated(): void {
    console.debug("Easel component updated")
  }
  // beforeUpdate(): void {
  //   const svgParent = this.$refs.responsive as HTMLElement;
  //   const parentBox = svgParent.getBoundingClientRect();
  //   console.debug("Parent box beforeUpdate: ", parentBox);
  //   // eslint-disable-next-line no-debugger
  //   debugger;
  // }

  beforeDestroy(): void {
    // VieJS lifecycle function
    const parent = this.$refs.responsive as HTMLElement;
    parent.firstChild?.removeEventListener(
      "mousemove",
      this.handleMouseMoved as EventListener
    );
    parent.firstChild?.removeEventListener(
      "mousedown",
      this.handleMousePressed as EventListener
    );
    parent.firstChild?.removeEventListener(
      "mouseup",
      this.handleMouseReleased as EventListener
    );
  }

  handleSphereRotation(e: CustomEvent): void {
    if (this.visitor) {
      this.visitor.setTransform(e.detail.transform);
      this.$store.state.points.forEach((p: SEPoint) => {
        p.accept(this.visitor as Visitor);
      });
      this.$store.state.lines.forEach((l: SELine) => {
        l.accept(this.visitor as Visitor);
      });
    }
  }
  handleMouseMoved(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
    e.preventDefault();
  }

  handleMousePressed(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent): void {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e);
  }

  keyPressed = (event: KeyboardEvent): void => {
    // const sphere = this.scene.getObjectByName("MainSphere");
    switch (event.code) {
      case "KeyR":
        // sphere?.rotation.set(0, 0, 0);
        break;
      default:
    }
  };

  onWindowResized(): void {
    // TODO: finish this method
    const { width, height } = this.computeAvailableArea();

    // Determine the dimension changes with respect to its dimension at creation time
    const widthChange = width / this.viewNaturalWidth;
    const heightChange = height / this.viewNaturalHeight;
    this.viewCurrentWidth = width;
    this.viewCurrentHeight = height;
    // (this.scene.renderer as any).setSize(width, height);
    // this.canvas.translation.set(width / 2, height / 2); // Place origin at the center
    const newScale = Math.max(widthChange, heightChange);
    console.debug("Resize factor", newScale)
    // const svgElem = (this.scene.renderer as any).domElement as HTMLElement;
    this.canvas.scale = newScale;
    this.canvas.translation.set(width / 2, height / 2);
    // svgElem.setAttribute("style", `transform: scale(${newScale})`);

    // TODO: apply translation and scale to other layers!
  }

  // VueJS data watcher function
  @Watch("showSphereControl")
  onSphereControlChanged(value: boolean /*, oldValue: boolean*/): void {
    if (value) {
      // this.scene.add(this.controls);
      // this.controls.attach(this.sphere);
    } else {
      // this.controls.detach();
      // this.scene.remove(this.controls);
    }
  }

  @Watch("editMode")
  switchEditMode(mode: string): void {
    // this.currentHandler?.deactivate(); // Unregister the current mouse handler
    this.currentTool = null;
    switch (mode) {
      case "rotate":
        //     // if (this.showSphereControl) this.controls.attach(this.sphere);
        //     this.controls.removeEventListener("change", this.renderIt);
        this.currentTool = this.rotateTool;
        break;
      case "move":
        // this.currentTool = this.moveTool;
        break;
      case "point":
        //     this.controls.detach();
        this.currentTool = this.pointTool;
        break;
      case "line":
        this.currentTool = this.lineTool;
        break;
      case "segment":
        this.currentTool = this.segmentTool;
        break;
      case "circle":
        this.currentTool = this.circleTool;
        break;
      default:
        this.currentTool = null;
    }
    this.currentTool?.activate();
    // this.currentHandler?.activate(); // Register the new mouse handler
  }

  /*
 This allows the user to maximumize the left drawer by clicking in the navigation drawer
'leftDrawerMinified = !leftDrawerMinified' doesn't work because when you click on the icons
 in the minified left drawer they first unMinify the drawer and
 then 'leftDrawerMinified = !leftDrawerMinified' would reminify it and nothing happens
 This also sets the border with to zero in the minified state so that you can't adjust it.
 In the minified state the border is set to its usual size
 */
  setMinificationOfLeftDrawer(value: boolean): void {
    if (value) {
      this.leftDrawerProperties.adjustedWidth = this.leftDrawerProperties.width;
      this.leftDrawerMinified = true; //minifies the left drawer
      this.setLeftDrawerBorderWidth(0); // sets the border to zero to prevent changing width of drawer
    } else {
      this.leftDrawerMinified = false; //maximizes the left drawer
      this.setLeftDrawerBorderWidth(this.leftDrawerProperties.borderWidth); //border shows to allow resize
      this.leftDrawerProperties.width = this.leftDrawerProperties.adjustedWidth;
    }
  }

  /* Set the width of the border to allow it to be adjustable or not (when minified)*/
  setLeftDrawerBorderWidth(size: number): void {
    const leftDrawerElement = (this.$refs.leftDrawer as VueComponent).$el;
    const leftDrawerBorder = leftDrawerElement.querySelector(
      ".v-navigation-drawer__border"
    ) as HTMLElement;
    leftDrawerBorder.style.width = size + "px";
    leftDrawerBorder.style.cursor = "ew-resize";
    leftDrawerBorder.style.color = "black"; //This doesn't work. Why? Does a parent override this?
  }

  setLeftDrawerBorderEvents(): void {
    const minWidth = this.leftDrawerProperties.minWidth;
    const el = (this.$refs.leftDrawer as VueComponent).$el; //I'm not sure why this an error or how to fix it.
    const leftDrawerBorder = el.querySelector(".v-navigation-drawer__border");
    const direction = el.classList.contains("v-navigation-drawer--right")
      ? "right"
      : "left";

    function resizeLeftDrawer(e: MouseEvent) {
      //change the mouse to let the user know the drawer can be resized
      document.body.style.cursor = "ew-resize";
      //correctly compute the width of the adjusted drawer from the right or left
      const newWidth =
        direction === "right"
          ? document.body.scrollWidth - e.clientX
          : e.clientX;
      //only adjust the width if it is bigger than the minimum
      if (newWidth >= minWidth) {
        (el as HTMLElement).style.width = newWidth + "px";
      }
    }

    //On mouse down add a listener to track the changes in the position of the mouse.
    leftDrawerBorder?.addEventListener(
      "mousedown",
      ((e: MouseEvent) => {
        if (e.offsetX <= this.leftDrawerProperties.borderWidth) {
          (el as HTMLElement).style.transition = "initial";
          //add a listener to activley resize the left drawer as the mouse is moved
          document.addEventListener("mousemove", resizeLeftDrawer, false);
        }
      }) as EventListener,
      false
    );

    document.addEventListener(
      "mouseup",
      () => {
        (el as HTMLElement).style.transition = "";
        // this.leftDrawerProperties.width = (el as HTMLElement).style.width;
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", resizeLeftDrawer, false);
        this.onWindowResized(); //I need a command so that the window is repainted so the sphere grows/shrinks
        /*  console.log(this.leftDrawerProperties.width); */
      },
      false
    );
  }
  unMinifyLeftDrawer(): void {
    if (this.leftDrawerMinified) {
      this.leftDrawerMinified = false;
    }
  }
}
</script>
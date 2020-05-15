<template>
  <div>
    <v-container fluid>
      <!--- ml-2: margin left 8 px -->
      <v-row>
        <!---
      VUetify grid system uses 12-column layout.
      In the following setup, 
      (1) the editHint text will occupy 75% of the panel width
      (2) the toggle switch will occupy 25% of the panel width
      (3) the canvas will will in the entire width
        --->
        <v-col cols="9">
          <!-- <span class="body-1 ml-2">{{ editHint }}</span> -->
        </v-col>
        <v-col cols="3">
          <v-switch
            v-show="editMode === 'rotate'"
            class="mr-4"
            v-model="showSphereControl"
            label="Sphere Control"
          ></v-switch>
        </v-col>
        <v-col cols="12" ref="content" id="content" class="pa-2">
          <!--- HTML canvas will go here --->
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
    below the app toolbar, width should be specified as number only (without unit)-->
    <v-navigation-drawer
      id="leftDrawer"
      ref="leftDrawer"
      app
      clipped
      color="accent"
      permanent
      :mini-variant="leftDrawerMinified"
      bottom
      :width="leftDrawerProperties.width"
    >
      <v-container id="leftnav" fluid>
        <!-- These the navigation arrows TODO: I would like these to be in the same row as the
        tabs-->
        <div>
          <v-btn v-if="leftDrawerMinified" icon @click="setMinificationOfLeftDrawer(false)">
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
            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('main.ToolsTabToolTip') }}</span>
            </v-tooltip>

            <v-tooltip bottom :open-delay="toolTipOpenDelay" :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#objectListTab" v-on="on">
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('main.ObjectsTabToolTip') }}</span>
            </v-tooltip>

            <v-tab-item value="toolListTab">
              <ToolButtons></ToolButtons>
            </v-tab-item>
            <v-tab-item value="objectListTab">
              <ObjectTree :scene="sphere"></ObjectTree>
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <!-- This is the minified version of the left drawer with icon buttons for maximizing it -->
      <div id="leftnavicons" v-if="leftDrawerMinified" @click="setMinificationOfLeftDrawer(false)">
        <v-btn icon @click="setMinificationOfLeftDrawer(false); activeLeftDrawerTab='toolListTab'">
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>
        <v-btn
          icon
          @click="setMinificationOfLeftDrawer(false); activeLeftDrawerTab='objectListTab'"
        >
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
/* This is Vue app and we need the Watch and Prop methods(?) for the class style declarations in 
Typescript*/
import { Vue, Watch, Prop } from "vue-property-decorator";

/* Import the package threeJS and various modules for rendering the sphere and objects */
import * as THREE from "three";
import { WebGLRenderer } from "three";
import { setupScene } from "@/initApp";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import Axes from "@/3d-objs/Axes";
// import Point from "@/3d-objs/Point";

/* ToolStrategy is an interface that lists the methods (that will be overridden with handlers) 
that are need to interpret the event (mouse pressed, mouse release, moused moved etc.) depending 
on the current mode. For example, if the current mode is "point", the current tools is set to
NormalPoint Handler, and the mouse pressed event creates a point at the point of mouse press 
and ignores the mouse release and move events.   */
import { ToolStrategy } from "@/events/ToolStrategy";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import CircleHandler from "@/events/CircleHandler";
import MoveHandler from "@/events/MoveHandler";

/* Import the global settings */
import SETTINGS from "@/global-settings";

/* Import the State so we can follow the command paradigm */
import { State } from "vuex-class";

/* Import the components for the contents of the navigation drawer */
import Component from "vue-class-component";
import ObjectTree from "@/components/ObjectTree.vue";
import ToolButtons from "@/components/ToolButtons.vue";

@Component({ components: { ObjectTree, ToolButtons } })
export default class Easel extends Vue {
  /* Declaring renderer (of WebGLRenderer type) as a property allows the parent of this view
  to bind a variable in the parent (called renderer?!?) with this child variable called renderer */
  @Prop(WebGLRenderer)
  readonly renderer!: WebGLRenderer;

  /* Declaring canvas (of HTMLCanvasElement type) as a property allows the parent of this view
  to bind a variable in the parent (called canvas?!?) with this child variable called canvas */
  @Prop(HTMLCanvasElement)
  readonly canvas!: HTMLCanvasElement;

  /* Variable for controling the threeJS scene */
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sphere: THREE.Mesh;
  private showSphereControl = false; /* Controls the display of the sliders for sphere rotation */

  /* These store the current width and height of the availble space for displaying the view.
   These are automatically updated when the window is resized. They are used to find the largest 
   square to display the view in */
  private width = 0;
  private height = 0;

  /* Controls the behavior of the left drawer and which tab is active */
  private leftDrawerMinified = false; // intial the drawer is displayed
  private activeLeftDrawerTab = "toolListTab";

  /* Copy global setting to local variable */
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  /*  Use the Strategy design pattern to enable switching of
  different tool algorithms at runtime, See the comment where these classes (modules?) are imported */
  private currentTool: ToolStrategy | null;
  private pointTool: NormalPointHandler;
  private lineTool: LineHandler;
  private segmentTool: SegmentHandler;
  private moveTool: MoveHandler;
  private circleTool: CircleHandler;
  private controls: TransformControls;

  /* Variable to control the width and border size of the left drawer */
  private leftDrawerProperties = {
    width: 300, //intital width and stores the current width (including the minified)
    borderWidth: 3, //the width for the border of the left drawer set to zero when minimfied
    minWidth: 250, //The minimum width: minWidth<=adjustedWidth is true always
    adjustedWidth: 300 // The value after the user has adjusted the width of the drawer
  };

  @State("editMode")
  private editMode!: string;

  constructor() {
    super();

    const { scene, sphere } = setupScene();
    this.scene = scene;
    this.sphere = sphere;
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.currentTool = null;
    this.pointTool = new NormalPointHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.lineTool = new LineHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.segmentTool = new SegmentHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.circleTool = new CircleHandler({
      camera: this.camera,
      scene: this.scene
    });
    this.moveTool = new MoveHandler({
      camera: this.camera,
      scene: this.scene
    });

    this.$store.commit("setSphere", this.sphere);

    this.camera.position.set(1.25, 1.25, 2);
    this.camera.lookAt(0, 0, 0);
    // const axesHelper = new THREE.AxesHelper(SETTINGS.sphere.radius * 1.25);
    // axesHelper.layers.disableAll(); // exclude axeshelper from being searched by Raycaster
    // this.scene.add(axesHelper);
    this.controls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.setMode("rotate");
    this.controls.setSpace("global"); // select between "global" or "local"
    this.controls.setSize(3);

    // Add a circle silhouette to mark sphere boundary
    const circleBorder = new THREE.Mesh(
      new THREE.TorusBufferGeometry(SETTINGS.sphere.radius * 1.08, 0.01, 6, 60),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    const q = new THREE.Quaternion();

    // Transform the circle so it stays parallel to the camera view plane.
    this.camera.getWorldQuaternion(q);
    circleBorder.applyQuaternion(q);
    this.scene.add(circleBorder);

    window.addEventListener("resize", this.onWindowResized);
    window.addEventListener("keypress", this.keyPressed);
  }

  handleMouseMoved(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent) {
    // When currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e);
  }

  mounted() {
    // VueJS lifecycle function

    // During testting canvas is set to null and appendChild() will fail
    if (this.canvas instanceof HTMLCanvasElement) {
      const el = this.$refs.content as HTMLBaseElement;

      el.appendChild(this.canvas);
      this.canvas.addEventListener("mousemove", this.handleMouseMoved);
      this.canvas.addEventListener("mousedown", this.handleMousePressed);
      this.canvas.addEventListener("mouseup", this.handleMouseReleased);
    }

    this.onWindowResized();
    requestAnimationFrame(this.renderIt);

    /* Methods to set up a border on the left drawer 
     and allow it to be adjustable while respecting the minification*/
    this.setLeftDrawerBorderWidth(this.leftDrawerProperties.borderWidth);
    this.setLeftDrawerBorderEvents();
  }

  beforeDestroy() {
    // VueJS lifecycle function
    this.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.canvas.removeEventListener("mouseup", this.handleMouseReleased);
  }

  keyPressed = (event: KeyboardEvent) => {
    const sphere = this.scene.getObjectByName("MainSphere");
    switch (event.code) {
      case "KeyR":
        sphere?.rotation.set(0, 0, 0);
        break;
      default:
    }
  };

  renderIt() {
    this.renderer && this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.renderIt);
  }

  onWindowResized = () => {
    const el = this.$refs.content as HTMLBaseElement;
    if (el) {
      this.height = el.clientHeight;
      this.width = el.clientWidth;
      const availHeight = window.innerHeight - el.offsetTop;
      // console.debug(`Height ${el.clientHeight},
      //  Offset top ${el.offsetTop}, Viewport height:
      // ${window.innerHeight}`);
      const size = Math.min(el.clientWidth, availHeight);
      this.camera.aspect = 1;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(size, size);
    }
  };

  // VueJS data watcher function
  @Watch("showSphereControl")
  onSphereControlChanged(value: boolean /*, oldValue: boolean*/) {
    if (value) {
      this.scene.add(this.controls);
      this.controls.attach(this.sphere);
    } else {
      this.controls.detach();
      this.scene.remove(this.controls);
    }
  }

  @Watch("editMode")
  switchEditMode(mode: string) {
    // this.currentHandler?.deactivate(); // Unregister the current mouse handler
    switch (mode) {
      case "rotate":
        //     // if (this.showSphereControl) this.controls.attach(this.sphere);
        //     this.controls.removeEventListener("change", this.renderIt);
        this.currentTool = null;
        break;
      case "move":
        this.currentTool = this.moveTool;
        break;
      case "point":
        //     this.controls.detach();
        //     this.currentHandler = this.normalTracker;
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
      //     this.currentHandler = null;
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
  setMinificationOfLeftDrawer(value: boolean) {
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
  setLeftDrawerBorderWidth(size: number) {
    const leftDrawerBorder = this.$refs.leftDrawer.$el.querySelector(
      ".v-navigation-drawer__border"
    );
    leftDrawerBorder.style.width = size + "px";
    leftDrawerBorder.style.cursor = "ew-resize";
    leftDrawerBorder.style.color = "black"; //This doesn't work. Why? Does a parent override this?
  }

  setLeftDrawerBorderEvents() {
    const minWidth = this.leftDrawerProperties.minWidth;
    const el = this.$refs.leftDrawer.$el; //I'm not sure why this an error or how to fix it.
    const leftDrawerBorder = el.querySelector(".v-navigation-drawer__border");
    const direction = el.classList.contains("v-navigation-drawer--right")
      ? "right"
      : "left";

    function resizeLeftDrawer(e) {
      //change the mouse to let the user know the drawer can be resized
      document.body.style.cursor = "ew-resize";
      //correctly compute the width of the adjusted drawer from the right or left
      const newWidth =
        direction === "right"
          ? document.body.scrollWidth - e.clientX
          : e.clientX;
      //only adjust the width if it is bigger than the minimum
      if (newWidth >= minWidth) {
        el.style.width = newWidth + "px";
      }
    }

    //On mouse down add a listener to track the changes in the position of the mouse.
    leftDrawerBorder.addEventListener(
      "mousedown",
      e => {
        if (e.offsetX <= this.leftDrawerProperties.borderWidth) {
          el.style.transition = "initial";
          //add a listener to activley resize the left drawer as the mouse is moved
          document.addEventListener("mousemove", resizeLeftDrawer, false);
        }
      },
      false
    );

    document.addEventListener(
      "mouseup",
      () => {
        el.style.transition = "";
        this.leftDrawerProperties.width = el.style.width;
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", resizeLeftDrawer, false);
        this.onWindowResized(); //I need a command so that the window is repainted so the sphere grows/shrinks
        /*  console.log(this.leftDrawerProperties.width); */
      },
      false
    );
  }
}
</script>

<style lang="scss" scoped>
#content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  border: 1px solid black;
  margin: 4px;
}
#leftnav {
  display: flex;
  flex-direction: column;

  div:first-child {
    align-self: flex-end;
  }
}
#leftnavicons {
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
/* Override the default behavior of Vuetify <v-btn-toggle> elementv-btn-toggle> */
.v-btn-toggle {
  flex-wrap: wrap;
}
</style>
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
    below the app toolbar, width should be specified as number only (without unit) -->
    <v-navigation-drawer id="leftDrawer" app clipped color="accent"
      permanent :mini-variant="leftDrawerMinified" width="300">
      <v-container id="leftnav" fluid>
        <div>
          <v-btn icon @click="leftDrawerMinified = !leftDrawerMinified;">
            <v-icon v-if="leftDrawerMinified">mdi-arrow-right</v-icon>
            <v-icon v-else>mdi-arrow-left</v-icon>
          </v-btn>
        </div>
        <div v-if="!leftDrawerMinified">
          <v-tabs v-model="activeLeftDrawerTab" grow centered>
            <v-tooltip bottom :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay">
              <template v-slot:activator="{ on }">
                <v-tab class="mt-3" href="#toolListTab" v-on="on">
                  <v-icon left>mdi-calculator</v-icon>
                </v-tab>
              </template>
              <span>{{ $t('main.ToolsTabToolTip') }}</span>
            </v-tooltip>

            <v-tooltip bottom :open-delay="toolTipOpenDelay"
              :close-delay="toolTipCloseDelay">
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
              <!-- <ObjectTree :scene="sphere"></ObjectTree> -->
            </v-tab-item>
          </v-tabs>
        </div>
      </v-container>
      <div id="leftnavicons" v-if="leftDrawerMinified"
        @click="unMinifyLeftDrawer">
        <v-btn icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='toolListTab'">
          <v-icon class="ml-3 my-2">mdi-calculator</v-icon>
        </v-btn>
        <v-btn icon
          @click="leftDrawerMinified = !leftDrawerMinified; activeLeftDrawerTab='objectListTab'">
          <v-icon class="ml-3 my-2">mdi-format-list-bulleted</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script lang="ts">
import { Vue, Watch, Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
// import Axes from "@/3d-objs/Axes";
// import Point from "@/3d-objs/Point";
import { ToolStrategy } from "@/events/ToolStrategy";
import NormalPointHandler from "@/events/NormalPointHandler";
// import LineHandler from "@/events/LineHandler";
// import SegmentHandler from "@/events/SegmentHandler";
// import CircleHandler from "@/events/CircleHandler";
// import MoveHandler from "@/events/MoveHandler";
import SETTINGS from "@/global-settings";
import { State } from "vuex-class";
import ObjectTree from "@/components/ObjectTree.vue";
import ToolButtons from "@/components/ToolButtons.vue";

import { WebGLRenderer } from "three";
import { setupScene } from "@/initApp";
import Two from "two.js";
// import Circle from '../3d-objs/Circle';
@Component({ components: { ObjectTree, ToolButtons } })
export default class Easel extends Vue {
  @Prop(WebGLRenderer)
  readonly renderer!: WebGLRenderer;

  @Prop(HTMLCanvasElement)
  readonly canvas!: HTMLCanvasElement;

  private scene: Two;
  private camera: THREE.PerspectiveCamera;

  private leftDrawerMinified = false;
  private activeLeftDrawerTab = "toolListTab";
  private toolTipOpenDelay = SETTINGS.toolTip.openDelay;
  private toolTipCloseDelay = SETTINGS.toolTip.closeDelay;

  // Use the Strategy design pattern to enable switching of
  // different tool algorithms at runtime
  private currentTool: ToolStrategy | null;
  private pointTool: NormalPointHandler;
  // private lineTool: LineHandler;
  // private segmentTool: SegmentHandler;
  // private moveTool: MoveHandler;
  // private circleTool: CircleHandler;
  private controls: TransformControls;
  // private sphere: THREE.Mesh;
  private showSphereControl = false;
  private width = 0;
  private height = 0;

  @State("editMode")
  private editMode!: string;

  constructor() {
    super();


    // this.TWO.scene.scale = 50;

    // const rect = this.TWO.makeCircle(0, 0, 128);

    // rect.fill = 'rgb(255, 100,100)';
    // rect.noStroke();
    // const scene = setupScene();
    this.scene = setupScene();
    // this.sphere = sphere;
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.currentTool = null;
    this.pointTool = new NormalPointHandler(this.scene);
    // this.lineTool = new LineHandler({
    //   camera: this.camera,
    //   scene: this.scene
    // });
    // this.segmentTool = new SegmentHandler({
    //   canvas: this.renderer.domElement,
    //   camera: this.camera,
    //   scene: this.scene
    // });
    // this.circleTool = new CircleHandler({
    //   camera: this.camera,
    //   scene: this.scene
    // });
    // this.moveTool = new MoveHandler({
    //   camera: this.camera,
    //   scene: this.scene
    // });

    // this.$store.commit("setSphere", this.sphere);

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
    // const circleBorder = new Circle();


    const q = new THREE.Quaternion();

    // Transform the circle so it stays parallel to the camera view plane.
    this.camera.getWorldQuaternion(q);
    // circleBorder.applyQuaternion(q);
    // this.scene.add(circleBorder);
    // this.TWO.add(circleBorder);

    window.addEventListener("resize", this.onWindowResized);
    window.addEventListener("keypress", this.keyPressed);
  }

  handleMouseMoved(e: MouseEvent) {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent) {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mousePressed(e);
  }

  handleMouseReleased(e: MouseEvent) {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e);
  }

  mounted() {
    const parent = this.$refs.content as HTMLElement;
    this.scene.appendTo(parent);
    this.scene.play();
    // debugger; //eslint-disable-line
    parent.firstChild?.addEventListener("mousemove", this.handleMouseMoved as EventListener);
  }

  mountedUnused() {
    // VieJS lifecycle function

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
  }

  beforeDestroy() {
    // VieJS lifecycle function
    this.canvas.removeEventListener("mousemove", this.handleMouseMoved);
    this.canvas.removeEventListener("mousedown", this.handleMousePressed);
    this.canvas.removeEventListener("mouseup", this.handleMouseReleased);
  }

  keyPressed = (event: KeyboardEvent) => {
    // const sphere = this.scene.getObjectByName("MainSphere");
    switch (event.code) {
      case "KeyR":
        // sphere?.rotation.set(0, 0, 0);
        break;
      default:
    }
  };

  renderIt() {
    // this.renderer && this.renderer.render(this.scene, this.camera);
    // requestAnimationFrame(this.renderIt);
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
      // this.scene.add(this.controls);
      // this.controls.attach(this.sphere);
    } else {
      this.controls.detach();
      // this.scene.remove(this.controls);
    }
  }

  @Watch("editMode")
  switchEditMode(mode: string) {
    debugger; //eslint-disable-line
    // this.currentHandler?.deactivate(); // Unregister the current mouse handler
    this.currentTool = null;
    switch (mode) {
      case "rotate":
        //     // if (this.showSphereControl) this.controls.attach(this.sphere);
        //     this.controls.removeEventListener("change", this.renderIt);
        this.currentTool = null;
        break;
      case "move":
        // this.currentTool = this.moveTool;
        break;
      case "point":
        //     this.controls.detach();
        //     this.currentHandler = this.normalTracker;
        this.currentTool = this.pointTool;
        break;
      case "line":
        // this.currentTool = this.lineTool;
        break;
      case "segment":
        // this.currentTool = this.segmentTool;
        break;
      case "circle":
        // this.currentTool = this.circleTool;
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
 */
  unMinifyLeftDrawer() {
    if (this.leftDrawerMinified) {
      this.leftDrawerMinified = false;
    }
  }

}
</script>
<style lang="scss" scoped>
#content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  background-color: beige;
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

/* The following style rule can be replaced with Vuetify class "mt-3" 
 (margin-top: 3 x 4px) */
// .tabs-margin-padding {
//   padding: 0px 0px 0px 0px;
//   margin: 12px 0px 0px 0px;
// }
</style>

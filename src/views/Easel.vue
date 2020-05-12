<template>
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
        <span class="body-1 ml-2">{{ editHint }}</span>
      </v-col>
      <v-col cols="3">
        <v-switch v-show="editMode === 'none'" class="mr-4"
          v-model="showSphereControl" label="Sphere Control">
        </v-switch>
      </v-col>
      <v-col cols="12" ref="content" id="content" class="pa-2">
        <!--- HTML canvas will go here --->
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">

import { Vue, Watch, Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
// import Axes from "@/3d-objs/Axes";
// import Vertex from "@/3d-objs/Vertex";
import { ToolStrategy } from "@/events/ToolStrategy";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import RingHandler from "@/events/RingHandler";
import MoveHandler from "@/events/MoveHandler";
import SETTINGS from "@/global-settings";
import { State } from "vuex-class";
import ObjectTree from "@/components/ObjectTree.vue";
import { WebGLRenderer } from 'three';
import { setupScene } from "@/initApp"

@Component({ components: { ObjectTree } })
export default class Easel extends Vue {

  @Prop(WebGLRenderer)
  readonly renderer!: WebGLRenderer;

  @Prop(HTMLCanvasElement)
  readonly canvas!: HTMLCanvasElement;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Use the Strategy design pattern to enable switching of
  // different tool algorithms at runtime
  private currentTool: ToolStrategy | null;
  private pointTool: NormalPointHandler;
  private lineTool: LineHandler;
  private segmentTool: SegmentHandler;
  private moveTool: MoveHandler;
  private ringTool: RingHandler;
  private controls: TransformControls;
  private sphere: THREE.Mesh;
  private editHint = "Select mode...";
  private showSphereControl = false;
  private width = 0;
  private height = 0

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
    this.ringTool = new RingHandler({
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
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseMoved(e);
  }

  handleMousePressed(e: MouseEvent) {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mousePressed(e)
  }

  handleMouseReleased(e: MouseEvent) {
    // WHen currentTool is NULL, the following line does nothing
    this.currentTool?.mouseReleased(e)
  }

  mounted() {
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
      case "none":
        //     // if (this.showSphereControl) this.controls.attach(this.sphere);
        //     this.controls.removeEventListener("change", this.renderIt);
        this.currentTool = null;
        this.editHint = "Select mode...";
        break;
      case "move":
        this.currentTool = this.moveTool;
        this.editHint = "Drag object to move it";
        break;
      case "point":
        //     this.controls.detach();
        //     this.currentHandler = this.normalTracker;
        this.currentTool = this.pointTool;
        this.editHint = "Left click to add a new point";
        break;
      case "line":
        this.currentTool = this.lineTool;
        this.editHint = "Drag the mouse to add a geodesic circle";
        break;
      case "segment":
        this.currentTool = this.segmentTool;
        this.editHint = "Drag the mouse to add a geodesic segment";
        break;
      case "circle":
        this.currentTool = this.ringTool;
        this.editHint =
          "Start with the circle center and drag to create a ring";
        break;
      default:
      //     this.currentHandler = null;
    }
    this.currentTool?.activate();
    // this.currentHandler?.activate(); // Register the new mouse handler
  }
}
</script>
<style scoped>
#content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  border: 1px solid black;
  margin: 4px;
}
</style>

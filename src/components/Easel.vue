<template>
  <div>
    <v-container>
      <v-row align="center">
        <span class="body-1 ml-2">{{ editHint }}</span>
        <v-spacer />
        <v-switch
          v-show="editMode === 'none'"
          v-model="showSphereControl"
          label="Sphere Control"
        >
        </v-switch>
      </v-row>
      <v-row justify="center" ref="content" id="content"> </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-debugger */
import { Component, Vue, Watch } from "vue-property-decorator";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import Axes from "../3d-objs/Axes";
import CursorHandler from "@/events/CursorHandler";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import RingHandler from "@/events/RingHandler";
import SETTINGS from "@/global-settings";
import { AppState } from "../store";

@Component
export default class Easel extends Vue {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private currentHandler: CursorHandler | null = null;
  private normalTracker: NormalPointHandler;
  private lineTracker: LineHandler;
  private segmentTracker: SegmentHandler;
  private ringTracker: RingHandler;
  private controls: TransformControls;
  private sphere: THREE.Mesh;
  private editHint = "Select mode...";
  private editMode = "none";
  private showSphereControl = false;
  private storeWatcher: (() => void) | null = null;

  constructor() {
    super();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    console.debug("Camera layers", this.camera.layers);
    this.normalTracker = new NormalPointHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.lineTracker = new LineHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.segmentTracker = new SegmentHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.ringTracker = new RingHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    this.controls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(SETTINGS.sphere.radius, 24, 28),
      new THREE.MeshPhongMaterial({
        color: SETTINGS.sphere.color,
        transparent: true,
        opacity: SETTINGS.sphere.opacity
      })
    );
    this.sphere.layers.enable(SETTINGS.INTERSECTION_LAYER);
    this.$store.commit("setSphere", this.sphere);
    this.sphere.add(new Axes(1.5));
    this.scene.add(this.sphere);
    console.debug("Constructor");
    this.camera.position.set(1.5, 1.5, 3);
    this.camera.lookAt(0, 0, 0);
    const axesHelper = new THREE.AxesHelper(SETTINGS.sphere.radius * 1.25);
    axesHelper.layers.disableAll(); // exclude axeshelper from being searched by Raycaster
    this.scene.add(axesHelper);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 10);
    this.scene.add(pointLight);
    this.controls.setMode("rotate");
    this.controls.setSpace("global");
    this.controls.setSize(2);
    this.scene.add(this.controls);
    window.addEventListener("resize", this.onWindowResized);
  }

  created() {
    this.storeWatcher = this.$store.watch(
      (state: AppState) => state.editMode,
      this.switchEditMode
    );
  }

  destroyed() {
    this.storeWatcher && this.storeWatcher();
  }

  mounted() {
    console.debug("Mounted");
    // debugger; // eslint-disable-line
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
    const el = this.$refs.content as HTMLBaseElement;
    el.appendChild(this.renderer.domElement);
    // this.controls.attach(this.sphere);
    this.onWindowResized();
    requestAnimationFrame(() => this.renderIt());
  }

  renderIt() {
    this.renderer && this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.renderIt());
  }

  onWindowResized = () => {
    const el = this.$refs.content as HTMLBaseElement;
    if (!el) return;
    if (el) {
      const size = Math.min(el.clientWidth, 640);
      console.log(`Window resize ${el.clientWidth}x${el.clientHeight}`);
      // this.renderer.domElement.width = size;
      // this.renderer.domElement.height = size;
      this.camera.aspect = 1;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(size, size);
    }
  };

  @Watch("showSphereControl")
  onSphereControlChanged(value: boolean /*, oldValue: boolean*/) {
    if (value) {
      this.controls.attach(this.sphere);
    } else {
      this.controls.detach();
    }
  }

  switchEditMode(mode: string) {
    this.editMode = mode;
    this.currentHandler?.deactivate();
    switch (mode) {
      case "none":
        if (this.showSphereControl) this.controls.attach(this.sphere);
        this.controls.removeEventListener("change", this.renderIt);
        this.currentHandler = null;
        this.editHint = "Select mode...";
        break;
      case "point":
        this.controls.detach();
        this.currentHandler = this.normalTracker;
        this.editHint = "Left click to add a new point";
        break;
      case "line":
        this.controls.detach();
        this.currentHandler = this.lineTracker;
        this.editHint = "Drag the mouse to add a geodesic circle";
        break;
      case "segment":
        this.controls.detach();
        this.currentHandler = this.segmentTracker;
        this.editHint = "Drag the mouse to add a geodesic segment";
        break;
      case "circle":
        this.controls.detach();
        this.currentHandler = this.ringTracker;
        this.editHint = "Start with the center and drag to create a ring";
        break;
      default:
        this.currentHandler = null;
    }
    this.currentHandler?.activate();
  }
}
</script>
<style scoped></style>

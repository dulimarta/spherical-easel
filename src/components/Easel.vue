<template>
  <div>
    <v-container>
      <v-row align="center">
        <v-btn-toggle v-model="editMode" @change="switchEditMode">
          <v-btn value="none">
            <v-icon>mdi-cursor-pointer</v-icon>
          </v-btn>
          <v-btn value="point">
            <v-icon>mdi-vector-point</v-icon>
          </v-btn>
          <v-btn value="line">
            <v-icon>mdi-vector-line</v-icon>
          </v-btn>
          <v-btn value="segment">
            <v-icon>mdi-vector-radius</v-icon>
          </v-btn>
          <v-btn value="circle">
            <v-icon>mdi-vector-circle-variant</v-icon>
          </v-btn>
        </v-btn-toggle>
        <span class="body-1 ml-2">{{editHint}}</span>
        <v-spacer />
        <v-switch v-show='editMode==="none"' v-model="showSphereControl"
          label="Sphere Control">
        </v-switch>
      </v-row>
    </v-container>
    <div ref="content" id="content"></div>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-debugger */
import { Component, Vue, Watch } from "vue-property-decorator";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls"
import Axes from "../3d-objs/Axes";
import CursorHandler from "@/events/CursorHandler";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import RingHandler from "@/events/RingHandler"

@Component
export default class Easel extends Vue {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private editMode = "none";
  private currentHandler: CursorHandler | null = null;
  private normalTracker: NormalPointHandler;
  private lineTracker: LineHandler;
  private segmentTracker: SegmentHandler;
  private ringTracker: RingHandler;
  private controls: TransformControls;
  private sphere: THREE.Mesh;
  private editHint = "Select mode...";
  private showSphereControl = false;

  constructor() {
    super();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.normalTracker = new NormalPointHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene    });
    this.lineTracker = new LineHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene    });
    this.segmentTracker = new SegmentHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene    });
    this.ringTracker = new RingHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene    });
    this.controls = new TransformControls(this.camera, this.renderer.domElement);
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 28),
      new THREE.MeshLambertMaterial({ color: 0xffdd00 })
    );
    this.sphere.add(new Axes(2));
    this.scene.add(this.sphere);
    console.debug("Constructor");
  }

  mounted() {
    console.debug("Mounted");
    // debugger; // eslint-disable-line
    this.camera.position.set(3, 3, 5);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.AxesHelper(2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 10);
    this.scene.add(pointLight);
    const el = this.$refs.content as HTMLBaseElement;
    el.appendChild(this.renderer.domElement);
    // this.controls.attach(this.sphere);
    this.controls.setMode('rotate');
    this.controls.setSize(2);
    this.scene.add(this.controls);
    requestAnimationFrame(() => this.renderIt());
  }

  renderIt() {
    this.renderer && this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.renderIt());
  }

  @Watch('showSphereControl')
  onSphereControlChanged(value: boolean, oldValue: boolean) {
    if (value) {
      this.controls.attach(this.sphere);
    } else {
      this.controls.detach();
    }

  }
  switchEditMode() {
    // console.debug("Edit mode ", this.editMode);
    // debugger; // eslint-disable-line
    this.currentHandler?.deactivate();
    switch (this.editMode) {
      case "none":
        this.controls.attach(this.sphere);

        this.controls.removeEventListener('change', this.renderIt);
        this.currentHandler = null;
        this.editHint = "Select mode...";
        break;
      case "point":
        this.controls.detach();
        this.currentHandler = this.normalTracker;
        this.editHint = "Left click to add a new point"
        break;
      case "line":
        this.controls.detach();
        this.currentHandler = this.lineTracker;
        this.editHint = "Drag the mouse to add a geodesic circle"
        break;
      case "segment":
        this.controls.detach();
        this.currentHandler = this.segmentTracker;
        this.editHint = "Drag the mouse to add a geodesic segment"
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
<style scoped>
</style>

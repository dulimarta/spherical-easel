<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="8">
          <!--- ml-2: margin left 8 px -->
          <v-row>
            <span class="body-1 ml-2">{{ editHint }}</span>
            <v-spacer />
            <v-switch v-show="editMode === 'none'" class="mr-4"
              v-model="showSphereControl" label="Sphere Control">
            </v-switch>
          </v-row>
          <div justify="center" ref="content" id="content"></div>
        </v-col>
        <v-col cols="4" class="accent">
          <ObjectTree v-bind:scene="scene"></ObjectTree>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">

import { Vue, Watch } from "vue-property-decorator";
import Component from "vue-class-component";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
// import Axes from "@/3d-objs/Axes";
import Vertex from "@/3d-objs/Vertex";
import CursorHandler from "@/events/CursorHandler";
import NormalPointHandler from "@/events/NormalPointHandler";
import LineHandler from "@/events/LineHandler";
import SegmentHandler from "@/events/SegmentHandler";
import RingHandler from "@/events/RingHandler";
import MoveHandler from "@/events/MoveHandler";
import SETTINGS from "@/global-settings";
import { State } from "vuex-class";
import ObjectTree from "./ObjectTree.vue";
import { AddVertexCommand } from '../commands/AddVertexCommand';

@Component({ components: { ObjectTree } })
export default class Easel extends Vue {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private currentHandler: CursorHandler | null = null;
  private normalTracker: NormalPointHandler;
  private lineTracker: LineHandler;
  private segmentTracker: SegmentHandler;
  private moveTracker: MoveHandler;
  private ringTracker: RingHandler;
  private controls: TransformControls;
  private sphere: THREE.Mesh;
  private editHint = "Select mode...";
  private showSphereControl = false;
  private sphericalObjects = [];

  // Declarations linked to Vuex store
  @State("editMode")
  private editMode!: string;

  // @Mutation
  // private addVertex!: (v: Vertex) => void;

  constructor() {
    super();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xffffff);
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
    this.moveTracker = new MoveHandler({
      canvas: this.renderer.domElement,
      camera: this.camera,
      scene: this.scene
    });
    const sphereGeometry = new THREE.SphereGeometry(
      SETTINGS.sphere.radius,
      30,
      60
    );

    this.sphere = new THREE.Mesh(
      sphereGeometry,
      new THREE.MeshBasicMaterial({
        color: SETTINGS.sphere.color,
        transparent: true,
        opacity: SETTINGS.sphere.opacity
      })
    );

    this.sphere.name = "MainSphere";
    this.sphere.layers.enable(SETTINGS.layers.sphere);
    this.$store.commit("setSphere", this.sphere);

    this.scene.add(this.sphere);
    console.debug("Constructor: sphere ID", this.sphere.id);
    this.camera.position.set(1.25, 1.25, 2);
    this.camera.lookAt(0, 0, 0);
    // const axesHelper = new THREE.AxesHelper(SETTINGS.sphere.radius * 1.25);
    // axesHelper.layers.disableAll(); // exclude axeshelper from being searched by Raycaster
    // this.scene.add(axesHelper);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 10);
    this.scene.add(pointLight);
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
    // Add random vertices (for development only)
    if (process.env.NODE_ENV === "development") {
      // this.sphere.add(new Axes(1.5, 0.05));

      for (let k = 0; k < 3; k++) {
        const v = new Vertex(SETTINGS.vertex.size);
        v.position.set(Math.random(), Math.random(), Math.random());
        v.position.normalize();
        v.position.multiplyScalar(SETTINGS.sphere.radius);
        new AddVertexCommand(v).execute();
      }
    }

    window.addEventListener("resize", this.onWindowResized);
    window.addEventListener("keypress", this.keyPressed);
  }

  mounted() {
    // VieJS lifecycle function
    console.debug("Mounted");
    // this.renderer.setSize(window.innerWidth, window.innerHeight);
    const el = this.$refs.content as HTMLBaseElement;
    el.appendChild(this.renderer.domElement);
    this.onWindowResized();
    requestAnimationFrame(this.renderIt);
  }

  keyPressed = (event: KeyboardEvent) => {
    console.debug("Key press is ", event.keyCode, event);
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
    if (!el) return;
    if (el) {
      const size = Math.min(el.clientWidth, 640);
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
    this.currentHandler?.deactivate(); // Unregister the current mouse handler
    switch (mode) {
      case "none":
        // if (this.showSphereControl) this.controls.attach(this.sphere);
        this.controls.removeEventListener("change", this.renderIt);
        this.currentHandler = null;
        this.editHint = "Select mode...";
        break;
      case "move":
        this.controls.detach();
        this.currentHandler = this.moveTracker;
        this.editHint = "Drag object to move it";
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
        this.editHint =
          "Start with the circle center and drag to create a ring";
        break;
      default:
        this.currentHandler = null;
    }
    this.currentHandler?.activate(); // Register the new mouse handler
  }
}
</script>
<style scoped>
#content {
  border: 1px solid black;
  margin: 4px;
}
</style>

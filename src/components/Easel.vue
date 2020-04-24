<template>
  <div>
    <h2>Easel main</h2>
    <div>
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
        <v-btn value="circle">
          <v-icon>mdi-vector-circle-variant</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
    <div ref="content" id="content"></div>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-debugger */
import { Component, Vue } from "vue-property-decorator";
import * as THREE from "three";
import CursorHandler from "../events/CursorHandler";
import NormalPointHandler from "../events/NormalPointHandler";

@Component
export default class Easel extends Vue {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private editMode = "none";
  private currentHandler: CursorHandler | null = null;
  private normalTracker: NormalPointHandler;
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
    this.normalTracker = new NormalPointHandler({ canvas: this.renderer.domElement, camera: this.camera, scene: this.scene });
  }

  mounted() {
    debugger; // eslint-disable-line
    this.camera.position.set(0, 0, 5);
    this.scene.add(new THREE.AxesHelper(2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 10);
    this.scene.add(pointLight);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 28),
      new THREE.MeshLambertMaterial({ color: 0xffdd00 })
    );
    this.scene.add(sphere);
    const el = this.$refs.content as HTMLBaseElement;
    el.appendChild(this.renderer.domElement);
    requestAnimationFrame(() => this.renderIt());
  }

  renderIt() {
    this.renderer && this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.renderIt());
  }

  switchEditMode() {
    console.debug("Edit mode ", this.editMode);
    this.currentHandler?.deactivate();
    switch (this.editMode) {
      case "none":
        this.currentHandler = null;
        break;
      case "point":
        this.currentHandler = this.normalTracker;
        break;
    }
    this.currentHandler?.activate();
  }
}
</script>
<style scoped>
#content {
  border: 2px solid red;
}
</style>

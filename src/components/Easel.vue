<template>
  <div>
    <h2>Easel main</h2>
    <div ref="content"></div>
  </div>
</template>

<script lang="ts">
/* eslint-disable no-debugger */
import { Component, Vue } from "vue-property-decorator";
import * as THREE from "three";
@Component
export default class Easel extends Vue {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
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
  }
  mounted() {
    // debugger;
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
}
</script>

<style scoped></style>

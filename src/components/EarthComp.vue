<template>
    <canvas id="earth"></canvas>
</template>
<style>
 #earth{
    position:absolute;
 }
</style>
<script setup lang="ts">
import * as THREE from 'three';

import { onMounted } from 'vue';
const prop = defineProps<{
    canvasSize : number
}>();
onMounted(()=>{
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('earth') as HTMLCanvasElement
    });
    renderer.setSize(prop.canvasSize, prop.canvasSize);
    renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.SphereGeometry(5, 50, 50);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("../../public/earth/earth.jpg"),
        bumpMap: new THREE.TextureLoader().load("../../public/earth/elevate.jpg"),
        bumpScale: 0.5,
    });
    const earth = new THREE.Mesh(geometry, material);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(50, 50, 50);

    scene.add(earth);
    scene.add(ambientLight);
    scene.add(light);
    function animate() {
        requestAnimationFrame(animate);
        earth.rotation.y += 0.001;
        renderer.render(scene, camera);
    }
    animate();
})
</script>
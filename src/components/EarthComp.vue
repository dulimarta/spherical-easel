<template>
    <canvas id="earth" width="100" height="100"></canvas>
</template>
<style>
 #earth{
 border: 5px solid #a46e6e;
    position:absolute;
    margin: auto;

    /* width:100px;
    height:100px; */
 }
</style>
<script setup lang="ts">
// se store magnification factor * 240 over orthographic camera
import SETTINGS from "@/global-settings";
import * as THREE from 'three';
import { watch } from 'vue';
import { onMounted } from 'vue';
import { useSEStore } from "@/stores/se";
import { storeToRefs } from "pinia";
const prop = defineProps({
    canvasSize: {
        type: Number,
        default: 240
    }
})
const store = useSEStore();
const {zoomMagnificationFactor,zoomTranslation} = storeToRefs(store);
onMounted(()=>{
    const scene = new THREE.Scene();
    const num = 240 * zoomMagnificationFactor.value;
    const camera = new THREE.OrthographicCamera(-num,num,num,-num,0.1,1000);
    // const camera = new THREE.OrthographicCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 430;
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('earth') as HTMLCanvasElement
    });

    if(prop.canvasSize != 0){
        renderer.setSize(prop.canvasSize, prop.canvasSize);
    }else{
        renderer.setSize(240, 240);
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    const geometry = new THREE.SphereGeometry(SETTINGS.boundaryCircle.radius,100,100);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("/earth/earth.jpg"),
        bumpMap: new THREE.TextureLoader().load("/earth/elevate.jpg"),
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
    // watch change of prop.canvasSize
    watch(() => (prop.canvasSize), () => {
        renderer.setSize(prop.canvasSize, prop.canvasSize);
    })
    watch(()=>(zoomMagnificationFactor.value),()=>{
        const num = prop.canvasSize / (zoomMagnificationFactor.value*2);
        camera.left = -num;
        camera.right = num;
        camera.top = num;
        camera.bottom = -num;
        camera.updateProjectionMatrix();
    })
    watch(()=>(zoomTranslation.value),()=>{
        console.log(zoomTranslation.value);
        const x = -zoomTranslation.value[0]
        const y = -zoomTranslation.value[1]
        camera.setViewOffset(prop.canvasSize,prop.canvasSize,x,y,prop.canvasSize,prop.canvasSize);
    },{deep:true})

})
</script>
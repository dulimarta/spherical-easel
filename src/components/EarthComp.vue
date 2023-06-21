<template>
    <canvas id="earth"></canvas>
</template>
<style>
 #earth{
 /* border: 5px solid #a46e6e; */
    position:absolute;

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
const {zoomMagnificationFactor,zoomTranslation, inverseTotalRotationMatrix} = storeToRefs(store);
onMounted(()=>{
    const scene = new THREE.Scene();
    const num = prop.canvasSize / (zoomMagnificationFactor.value*2.010);
    const camera = new THREE.OrthographicCamera(-num,num,num,-num,0.1,1000);
    //  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = prop.canvasSize / (zoomMagnificationFactor.value*2) +10;
    const x = -zoomTranslation.value[0]
    const y = -zoomTranslation.value[1]
    camera.setViewOffset(prop.canvasSize,prop.canvasSize,x,y,prop.canvasSize,prop.canvasSize);
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

    const geometry = new THREE.SphereGeometry(SETTINGS.boundaryCircle.radius,250,250);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load("/earth/earth.jpg"),
        bumpMap: new THREE.TextureLoader().load("/earth/elevate.jpg"),
        bumpScale: 10,
    });
    const earth = new THREE.Mesh(geometry, material);
    earth.rotation.x = Math.PI/2;
    const matrixMulti = new THREE.Matrix4().makeRotationX(Math.PI/2)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(num, num, num);

    scene.add(earth);
    scene.add(ambientLight);
    scene.add(light);
    scene.background = new THREE.TextureLoader().load("/earth/starfield.jpg");
    function animate() {
        requestAnimationFrame(animate);
        // earth.rotation.y += 0.0001;
        renderer.render(scene, camera);
    }
    animate();
    // watch change of prop.canvasSize

    watch( [()=>(prop.canvasSize),()=>(zoomMagnificationFactor.value)], ([canvasSize,zoomMagnificationFactor]) => {
        renderer.setSize(canvasSize,canvasSize);
        const num = canvasSize / (zoomMagnificationFactor*2.010);
        camera.left = -num;
        camera.right = num;
        camera.top = num;
        camera.bottom = -num;
        camera.updateProjectionMatrix();
        // camera.setViewOffset(prop.canvasSize,prop.canvasSize,0,0,prop.canvasSize,prop.canvasSize);
    })

    // watch(()=>(zoomMagnificationFactor.value),()=>{
    //     const num = prop.canvasSize / (zoomMagnificationFactor.value*2);
    //     camera.left = -num;
    //     camera.right = num;
    //     camera.top = num;
    //     camera.bottom = -num;
    //     camera.updateProjectionMatrix();
    // })
    // zoom translate
    watch(()=>(zoomTranslation.value),()=>{
        // console.log(zoomTranslation.value);
        const x = -zoomTranslation.value[0]
        const y = -zoomTranslation.value[1]
        camera.setViewOffset(prop.canvasSize,prop.canvasSize,x,y,prop.canvasSize,prop.canvasSize);
    },{deep:true})

    watch(()=>(inverseTotalRotationMatrix.value.elements),()=>{
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
        rotationMatrix.multiply(matrixMulti);
        earth.setRotationFromMatrix(rotationMatrix);
    },{deep:true})

})
</script>
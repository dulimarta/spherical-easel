<template>
<div class="inputAddress">
    <input type="text" id="autocomplete" placeholder="Enter your address" />
<h2>Lat : {{ lat }} Lng: {{ lng }}</h2>
<h2>X: {{ xcor }} Y: {{ ycor }} Z: {{ zcor }}</h2>
</div>

</template>
<style>
    #autocomplete {
        width: 100%;
        height: 40px;
        padding: 0 10px;
        font-size: 16px;
        border: 1px solid #ddd;
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .inputAddress {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
<script setup lang="ts">
import { onMounted,ref } from 'vue';
import axios from 'axios';
import { onUnmounted } from 'vue';
import { SEPoint } from '@/models/SEPoint';
import Point from '@/plottables/Point';
import { Vector } from 'two.js';
import * as THREE from 'three';
import { SELabel } from '@/models/SELabel';
import Label from '@/plottables/Label';
import { CommandGroup } from '@/commands/CommandGroup';
import { AddPointCommand } from '@/commands/AddPointCommand';
import globalSettings from '@/global-settings';
import { useSEStore } from '@/stores/se';
import { storeToRefs } from "pinia";
import { LabelDisplayMode } from '@/types';
import { StyleEditPanels } from '@/types/Styles';

const store = useSEStore();
const { inverseTotalRotationMatrix} = storeToRefs(store);

    const lat = ref(0)
    const lng = ref(0)
    const xcor = ref(0)
    const ycor = ref(0)
    const zcor = ref(0)
    declare global {
    interface Window {
        initMap: () => void;
    }
    const google: any; // add this line to define the google object
    }
    window.initMap = ()=>{
        const input = document.getElementById("autocomplete");
        const autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        lat.value = place.geometry.location.lat();
        lng.value = place.geometry.location.lng();
        console.log(place)
        const latRad = lat.value * Math.PI / 180;
        const lngRad = lng.value * Math.PI / 180;
        const radius = 1;
        xcor.value = radius*Math.cos(latRad) * Math.cos(lngRad)
        ycor.value = radius*Math.cos(latRad) * Math.sin(lngRad)
        zcor.value = radius*Math.sin(latRad)
        const newPoint = new Point();

        // caption
        const vtx = new SEPoint(newPoint);
        const pointVector = new THREE.Vector3(xcor.value, ycor.value, zcor.value);
        pointVector.normalize();
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
        pointVector.applyMatrix4(rotationMatrix);
        vtx.locationVector = pointVector;

        // const matrixMulti = new THREE.Matrix4().makeRotationX(Math.PI/2)
        // rotationMatrix.multiply(matrixMulti)
        // vtx.locationVector.applyMatrix4(rotationMatrix);

        //caption change here
        const pointLabel = new Label("point");
        pointLabel.caption = "...";
        const newSELabel = new SELabel(pointLabel,vtx);
        const pointCommandGroup = new CommandGroup();
        pointCommandGroup.addCommand(new AddPointCommand(vtx,newSELabel));
        pointCommandGroup.execute();
        pointLabel.initialLabelDisplayMode = LabelDisplayMode.NameAndCaption;

        });
    };
    onMounted(()=>{
            let script = document.createElement('script');
            script.async = true;
            const apikey = import.meta.env.VITE_APP_GOOGLE_MAP_API_KEY
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apikey}&libraries=places&callback=initMap`
            document.head.appendChild(script);
    })
    onUnmounted(()=>{
        const apikey = import.meta.env.VITE_APP_GOOGLE_MAP_API_KEY
        let script = document.querySelector(`script[src="https://maps.googleapis.com/maps/api/js?key=${apikey}&libraries=places&callback=initMap"]`)
        document.head.removeChild(script!);
    })
</script>
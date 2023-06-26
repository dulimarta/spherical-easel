<template>
<div class="inputAddress">
    <input type="text" id="autocomplete" placeholder="Enter your address" />
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
import { onMounted } from 'vue';
import * as THREE from 'three';
import { SELabel } from '@/models/SELabel';
import Label from '@/plottables/Label';
import { CommandGroup } from '@/commands/CommandGroup';
import { AddPointCommand } from '@/commands/AddPointCommand';
import globalSettings from '@/global-settings';
import { useSEStore } from '@/stores/se';
import { storeToRefs } from "pinia";
import { LabelDisplayMode } from '@/types';
import { SEEarthPoint } from '@/models/SEEarthPoint';
import NonFreePoint from '@/plottables/NonFreePoint';
import { Loader } from "@googlemaps/js-api-loader"
const store = useSEStore();
const { inverseTotalRotationMatrix} = storeToRefs(store);

    onMounted(()=>{
        const api = import.meta.env.VITE_APP_GOOGLE_MAP_API_KEY
        const loader = new Loader({
            apiKey: api,
            version: "weekly",})
        loader.load().then(async () => {
            const {Autocomplete} = await google.maps.importLibrary("places");
            const input = document.getElementById("autocomplete");
            const autocomplete = new Autocomplete(input);
            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                console.log(place)
                const latRad = place.geometry.location.lat() * Math.PI / 180;
                const lngRad = place.geometry.location.lng() * Math.PI / 180;
                const radius = 1;
                const xcor = radius*Math.cos(latRad) * Math.cos(lngRad)
                const ycor = radius*Math.cos(latRad) * Math.sin(lngRad)
                const zcor = radius*Math.sin(latRad)
                const newPoint = new NonFreePoint();

                // caption
                const vtx = new SEEarthPoint(newPoint,lngRad,latRad);
                const pointVector = new THREE.Vector3(xcor, ycor, zcor);
                pointVector.normalize();
                const rotationMatrix = new THREE.Matrix4();
                rotationMatrix.copy(inverseTotalRotationMatrix.value).invert();
                pointVector.applyMatrix4(rotationMatrix);
                vtx.locationVector = pointVector;
                let placeCaption = place.formatted_address;

                //caption change here
                const pointLabel = new Label("point");
                pointLabel.caption = placeCaption;
                const newSELabel = new SELabel(pointLabel,vtx);
                const pointCommandGroup = new CommandGroup();
                pointCommandGroup.addCommand(new AddPointCommand(vtx,newSELabel));
                pointCommandGroup.execute();
                pointLabel.initialLabelDisplayMode = LabelDisplayMode.NameAndCaption;
                newSELabel.update();
            });
        })
    })

</script>
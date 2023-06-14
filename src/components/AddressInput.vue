<template>
<div class="inputAddress"><input type="text" id="autocomplete" placeholder="Enter your address" />
<h2>Lat : {{ lat }} Lng: {{ lng }}</h2>
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
    const lat = ref(0)
    const lng = ref(0)
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
        });
    };
    onMounted(()=>{
        let script = document.createElement('script');
        script.async = true;
        const apikey = import.meta.env.VITE_GOOGLE_MAP_API
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apikey}&libraries=places&callback=initMap`
        document.head.appendChild(script);
    })
</script>
<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ macShift?: boolean,
 pcShift?: boolean,
 macCmd?: boolean,
 pcCtrl?: boolean,
 macOpt?: boolean,
 pcAlt?: boolean,
 macLetter?: string,
 pcLetter?: string
 }>();
//import SE from "@/store/se-module";

//import { Prop, Component, Vue } from "vue-property-decorator";

//@Component({})
//export default class KeyShortcuts extends Vue {
  // @Prop() readonly macShift?: boolean;
  // @Prop() readonly pcShift?: boolean;
  // @Prop() readonly macCmd?: boolean;
  // @Prop() readonly pcCtrl?: boolean;
  // @Prop() readonly macOpt?: boolean;
  // @Prop() readonly pcAlt?: boolean;
  // @Prop() readonly macLetter?: string;
  // @Prop() readonly pcLetter?: string;

  var macOperatingSystem = ref(false);
  var displayString = ref("");

  // mounted() {
  //   if (navigator.userAgent.indexOf("Mac OS X") !== -1) {
  //     // console.log("macShift", this.macShift);
  //     this.macOperatingSystem = true;
  //     if (this.macShift !== undefined) {
  //       this.displayString +=
  //         '<kbd>Shift(<span style="font-size:18pt; vertical-align: inherit;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.64em;" >&#8679;</span></span>)</kbd>';
  //     }
  //     if (this.macCmd !== undefined) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString +=
  //         '<kbd>Cmd(<span <span style="font-size:18pt; vertical-align: middle;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.64em;" >&#8984;</span></span>)</kbd>';
  //     }
  //     if (this.macOpt !== undefined) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString +=
  //         '<kbd>Opt(<span <span style="font-size:20pt; vertical-align: inherit;display: inline-block;  position: relative;  width: 0.537em;  height: 0.5em;"> <span style="position: absolute;  left: -0.059em;  top: -0.64em;" >&#8997;</span></span>)</kbd>';
  //     }
  //     if (this.macLetter) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString += "<kbd>" + this.macLetter + "</kbd>";
  //     }
  //   } else {
  //     this.macOperatingSystem = false;
  //     if (this.pcShift) {
  //       this.displayString += "<kbd>Shift</kbd>";
  //     }
  //     if (this.pcCtrl) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString += "<kbd>Ctrl</kbd>";
  //     }
  //     if (this.pcAlt) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString += "<kbd>Alt</kbd>";
  //     }
  //     if (this.pcLetter) {
  //       if (this.displayString !== "") {
  //         this.displayString += " + ";
  //       }
  //       this.displayString += "<kbd>" + this.pcLetter + "</kbd>";
  //     }
  //   }
  // }

</script>

<template>
  <span v-if="macOperatingSystem"
    v-html="displayString">
  </span>
  <span v-else
    v-html="displayString">
  </span>
</template>


<style scoped>
.unicode-id {
  color: blue;
}
</style>

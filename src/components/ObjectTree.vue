<template>
  <div class="pa-0" id="objectTreeContainer">
    <v-sheet rounded :elevation="4" class="my-2">
      <SENoduleTree label="Points" :children="points" :depth="0"
        show-children="true">
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded :elevation="4" class="my-2">
      <SENoduleTree label="Lines" :children="lines" :depth="0"
        show-children>
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded :elevation="4" class="my-2">
      <SENoduleTree label="Segments" :children="segments" :depth="0"
        show-children>
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded :elevation="4" class="my-2">
      <SENoduleTree label="Circles" :children="circles" :depth="0"
        show-children>
      </SENoduleTree>
    </v-sheet>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { State } from "vuex-class";

// import { Mesh, MeshPhongMaterial } from "three";
import Two from "two.js";
import SENoduleTree from "@/components/SENoduleTree.vue"
import { SEPoint } from "@/models/SEPoint";
import { SENodule } from "@/models/SENodule";

@Component({ components: { SENoduleTree } })
export default class ObjectTree extends Vue {
  private selectedPoint: SEPoint | null = null;
  private selectedObject: SENodule | null = null;
  private selection = [];

  @State
  readonly points!: SENodule[];

  @State
  readonly lines!: SENodule[];

  @State
  readonly segments!: SENodule[];

  @State
  readonly circles!: SENodule[];


  private oldFillColor: Two.Color | undefined = undefined;

  // TODO: the getter function seems to be sluggish?



  updateActive(args: number[]): void {
    console.debug("Updating point selection(s)", args);
    if (this.selectedObject) {
      (this.selectedObject as any).ref.normalStyle();
    }
    this.selectedObject = null;
    if (args.length > 0) {
      // const pos = this.allObjects.findIndex(v => v.id === args[0]);
      // if (pos >= 0) {
      //   this.selectedObject = this.allObjects[pos];
      //   (this.selectedObject as any).ref.glowStyle();
      // this.selectedPoint.children.forEach((n: SENodule) => {
      //   if (n instanceof SELine) {
      //     n.ref.glowStyle();
      //   } else if (n instanceof SESegment) {
      //     n.ref.glowStyle();
      //   } else if (n instanceof SECircle) {
      //     n.ref.glowStyle();
      //   }
      // })
    }
  }
}

</script>

<style lang="scss">
#objectTreeContainer {
  padding: 0;
  width: 100%;
  overflow: scroll;
}
</style>

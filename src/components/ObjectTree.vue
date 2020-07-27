<template>
  <div class="pa-0" id="objectTreeContainer">
    <v-sheet rounded color="accent" :elevation="4" class="my-3"
      v-show="points.length > 0">
      <SENoduleTree label="Points" :children="points" :depth="0"
        show-children="true">
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded color="accent" :elevation="4" class="my-3"
      v-show="lines.length > 0">
      <SENoduleTree label="Lines" :children="lines" :depth="0"
        show-children="true">
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded color="accent" :elevation="4" class="my-3"
      v-show="segments.length > 0">
      <SENoduleTree label="Line Segments" :children="segments" :depth="0"
        show-children="true">
      </SENoduleTree>
    </v-sheet>
    <v-sheet rounded color="accent" :elevation="4" class="my-3"
      v-show="circles.length > 0">
      <SENoduleTree label="Circles" :children="circles" :depth="0"
        show-children="true">
      </SENoduleTree>
    </v-sheet>
    <span class="text-body-2 ma-2" v-show="zeroObjects">No objects in
      database</span>
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

  @State
  readonly nodules!: SENodule[]


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

  get zeroObjects(): boolean {
    return this.nodules.filter(n => n.exists).length === 0;
  }
}

</script>

<style lang="scss">
#objectTreeContainer {
  padding: 0;
  width: 100%;
  max-height: 80vh;
  overflow: scroll;
}
.nodeGroup {
  border: 2px solid red;
}
</style>

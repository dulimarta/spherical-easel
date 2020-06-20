<template>
  <div class="pa-1" id="objectTreeContainer">
    <h4>{{ $t("objects.points") }}</h4>
    <v-treeview dense hoverable activatable selectable
      active-class="warning" :items="iPoints" v-model="selection"
      @update:active="updateActive"></v-treeview>
    <h4>{{ $t("objects.lines") }}</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iLines" @update:active="updateActive"></v-treeview>
    <h4>{{ $t("objects.circles") }}</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iCircles" @update:active="updateActive"></v-treeview>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { State } from "vuex-class";

import { Prop } from "vue-property-decorator";
// import { Mesh, MeshPhongMaterial } from "three";
import Two from "two.js";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SENodule } from '@/models/SENodule';
import { SESegment } from '../models/SESegment';
// import Point from "@/plotables/Point";

@Component
export default class ObjectTree extends Vue {
  private selectedPoint: SEPoint | null = null;
  private selectedObject: SENodule | null = null;
  private selection = [];

  @State
  private points!: SEPoint[];

  @State
  private lines!: SELine[];

  @State
  private circles!: SECircle[];

  @State("plottables")
  private allObjects!: SENodule[];

  private oldFillColor: Two.Color | undefined = undefined;

  // TODO: the getter function seems to be sluggish?
  get iPoints() {
    return this.points.map((z: SEPoint) => ({
      id: z.id,
      name: z.name,
      children: [
        {
          id: 0,
          name: "Connected Lines",
          children: z.children
            .filter((n: SENodule) => n instanceof SELine).map((x: SENodule) => ({
              id: x.id,
              name: x.name
            }))
        },
        {
          id: 1,
          name: "Connected Segments",
          children: z.children
            .filter((n: SENodule) => n instanceof SESegment).map((x: SENodule) => ({
              id: x.id,
              name: x.name
            }))
        }, {
          id: 2,
          name: "Connected Circles",
          children: z.children
            .filter((n: SENodule) => n instanceof SECircle).map((x: SENodule) => ({
              id: x.id,
              name: x.name
            }))
        }


      ] /* remove node with empty children*/
        .filter(c => c.children.length > 0)
    }));
  }

  get iLines() {
    return this.lines.map((z: SELine) => ({
      id: z.id,
      name: z.name,
      children: [
        // { id: z.start?.ref.id, name: "Start:" + z.start?.ref.name },
        // { id: z.end?.ref.id, name: "End:" + z.end?.ref.name }
      ]
    }));
  }

  get iCircles(): any[] {
    return this.circles.map(r => ({
      id: r.id,
      name: r.name,
      // children: [
      //   { id: r.center.id, name: "Center:" + r.center.name },
      //   { id: r.point.id, name: "Point:" + r.point.name }
      // ]
    }));
  }

  updateActive(args: number[]): void {
    console.debug("Updating point selection(s)", args);
    if (this.selectedObject) {
      (this.selectedObject as any).ref.normalStyle();
    }
    this.selectedObject = null;
    if (args.length > 0) {
      const pos = this.allObjects.findIndex(v => v.id === args[0]);
      if (pos >= 0) {
        this.selectedObject = this.allObjects[pos];
        (this.selectedObject as any).ref.glowStyle();
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

}
</script>

<style lang="scss">
#objectTreeContainer {
  padding: 0.5em;
  overflow: scroll;
}
</style>

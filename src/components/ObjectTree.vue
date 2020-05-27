<template>
  <div class="pa-1" id="objectTreeContainer">
    <h4>{{ $t("objects.points") }}</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iPoints" @update:active="updateActive"></v-treeview>
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
import { SELine, SECircle } from "@/types";

import { Prop } from "vue-property-decorator";
// import { Mesh, MeshPhongMaterial } from "three";
import Two from "two.js";
import { SEPoint } from '@/models/SEPoint';
// import Point from "@/plotables/Point";

@Component
export default class ObjectTree extends Vue {
  private selectedObject: Two.Object | null = null;

  @Prop(Two.Group)
  readonly scene!: Two.Group;

  @State
  private points!: SEPoint[];

  @State
  private lines!: SELine[];

  @State
  private circles!: SECircle[];
  private oldFillColor: Two.Color | undefined = undefined;

  // TODO: the getter function seems to be sluggish?
  get iPoints() {
    return this.points.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: [
        {
          id: 0,
          name: "Start of",
          children: z.startOf.map((x: SELine) => ({
            id: x.ref.id,
            name: x.ref.name
          }))
        },
        {
          id: 1,
          name: "End of",
          children: z.endOf.map((x: SELine) => ({
            id: x.ref.id,
            name: x.ref.name
          }))
        },
        {
          id: 2,
          name: "Center of",
          children: z.centerOf.map((x: SECircle) => ({
            id: x.ref.id
            // name: x.ref.name
          }))
        },
        {
          id: 3,
          name: "Circumpoint of",
          children: z.circumOf.map((x: SECircle) => ({
            id: x.ref.id
            // name: x.ref.name
          }))
        }
      ] /* remove node with empty children*/
        .filter(c => c.children.length > 0)
    }));
  }

  get iLines() {
    return this.lines.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: [
        { id: z.start.ref.id, name: "Start:" + z.start.ref.name },
        { id: z.end.ref.id, name: "End:" + z.end.ref.name }
      ]
    }));
  }

  get iCircles() {
    return this.circles.map(r => ({
      id: r.ref.id,
      // name: r.ref.name,
      children: [
        { id: r.center.ref.id, name: "Center:" + r.center.ref.name },
        { id: r.point.ref.id, name: "Point:" + r.point.ref.name }
      ]
    }));
  }

  updateActive(args: number[]) {
    // debugger; //eslint-disable-line

    // Unfortunately, we can't test instanceof an interface in TypeScript
    if (this.selectedObject && (this.selectedObject as any).noGlow) {
      (this.selectedObject as any).noGlow();
    }
    if (args.length > 0) {
      // Turn off highlight on the currently selected object

      // Highlight the current selection in red (0xff0000)
      this.selectedObject = (this.scene.children as any).ids[args[0]];
      // this.selectedObject = this.sphere.getObjectById(args[0]) as Mesh;
      if ((this.selectedObject as any).glow) {
        (this.selectedObject as any).glow()
      }
    }
  }
}
</script>

<style lang="scss">
#topContainer {
  padding: 0.5em;
}
</style>

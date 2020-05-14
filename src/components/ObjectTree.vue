<template>
  <div class="pa-1 accent" id="objectTreeContainer">
    <h4>{{ $t('message.objects.points') }}</h4>
    <v-treeview
      dense
      hoverable
      activatable
      active-class="warning"
      :items="iVertices"
      @update:active="updateActive"
    ></v-treeview>
    <h4>{{ $t('message.objects.lines') }}</h4>
    <v-treeview
      dense
      hoverable
      activatable
      active-class="warning"
      :items="iLines"
      @update:active="updateActive"
    ></v-treeview>
    <h4>{{ $t('message.objects.circles') }}</h4>
    <v-treeview
      dense
      hoverable
      activatable
      active-class="warning"
      :items="iCircles"
      @update:active="updateActive"
    ></v-treeview>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { State } from "vuex-class";
import { SEPoint, SELine, SECircle } from "@/types";
import { Mesh, MeshPhongMaterial } from "three";

@Component
export default class ObjectTree extends Vue {
  private selectedObject: Mesh | null = null;

  @State
  readonly sphere!: Mesh;

  @State
  private vertices!: SEPoint[];

  @State
  private lines!: SELine[];

  @State
  private circles!: SECircle[];

  // TODO: the getter function seems to be sluggish?
  get iVertices() {
    return this.vertices.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: [
        {
          id: 0,
          name: "Start of",
          children: z.startOf.map(x => ({
            id: x.ref.id,
            name: x.ref.name
          }))
        },
        {
          id: 1,
          name: "End of",
          children: z.endOf.map(x => ({
            id: x.ref.id,
            name: x.ref.name
          }))
        },
        {
          id: 2,
          name: "Center of",
          children: z.centerOf.map(x => ({
            id: x.ref.id,
            name: x.ref.name
          }))
        },
        {
          id: 3,
          name: "Circumpoint of",
          children: z.circumOf.map(x => ({
            id: x.ref.id,
            name: x.ref.name
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
      name: r.ref.name,
      children: [
        { id: r.center.ref.id, name: "Center:" + r.center.ref.name },
        { id: r.point.ref.id, name: "Point:" + r.point.ref.name }
      ]
    }));
  }

  updateActive(args: number[]) {
    if (args.length > 0) {
      // Turn off highlight on the currently selected object
      if (this.selectedObject) {
        (this.selectedObject.material as MeshPhongMaterial).emissive.set(0);
      }

      // Highlight the current selection in red (0xff0000)
      this.selectedObject = this.sphere.getObjectById(args[0]) as Mesh;
      if (this.selectedObject)
        (this.selectedObject.material as MeshPhongMaterial).emissive.set(
          0xff0000
        );
    }
  }
}
</script>

<style lang="scss">
#topContainer {
  padding: 0.5em;
}
</style>

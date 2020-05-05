<template>
  <div id="topContainer">
    <h3>Object Tree</h3>
    <h4>Vertices</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iVertices" @update:active="updateActive"></v-treeview>
    <h4>Lines</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iLines"></v-treeview>
    <h4>Circles</h4>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iCircles"></v-treeview>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Vertex from "@/3d-objs/Vertex";
import { State } from "vuex-class";
import { SEVertex, SELine, SERing } from "@/types";
import { MeshLambertMaterial, Mesh, MeshPhongMaterial } from 'three';
import { Prop } from 'vue-property-decorator';

@Component
export default class ObjectTree extends Vue {

  private selectedObject: Mesh | null = null;

  @State
  readonly sphere!: Mesh;

  @State
  private vertices!: SEVertex[]

  @State
  private lines!: SELine[];

  @State
  private rings!: SERing[];

  // TODO: the getter function seems to be sluggish?
  get iVertices() {
    return this.vertices.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: [
        {
          id: 0,
          name: "Start of",
          children: z.startOf.map(x => (
            {
              id: x.ref.id, name: x.ref.name
            }))
        },
        {
          id: 1,
          name: "End of",
          children: z.endOf.map(x => (
            {
              id: x.ref.id, name: x.ref.name
            }))
        },
        {
          id: 2,
          name: "Center of",
          children: z.centerOf.map(x => (
            {
              id: x.ref.id, name: x.ref.name
            }))
        },
        {
          id: 3,
          name: "Circumpoint of",
          children: z.circumOf.map(x => (
            {
              id: x.ref.id, name: x.ref.name
            }))
        }
      ]/* remove node with empty children*/
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
    }))
  }

  get iCircles() {
    return this.rings.map(r => ({
      id: r.ref.id,
      name: r.ref.name,
      children: [
        { id: r.center.ref.id, name: "Center:" + r.center.ref.name },
        { id: r.point.ref.id, name: "Point:" + r.point.ref.name }
      ]
    }))
  }

  updateActive(args: number[]) {

    if (args.length > 0) {
      if (this.selectedObject) {
        (this.selectedObject.material as MeshPhongMaterial).emissive.set(0);
      }


      this.selectedObject = this.sphere.getObjectById(args[0]) as Mesh;

      if (this.selectedObject)
        (this.selectedObject.material as MeshPhongMaterial).emissive
          .set(0xff0000);
    }
  }
}
</script>

<style lang="scss">
#topContainer {
  padding: 0.5em;
}
</style>

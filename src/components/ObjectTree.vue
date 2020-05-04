<template>
  <div>
    <h2>Object Tree</h2>
    <h3>Vertices</h3>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iVertices" @update:active="updateActive"></v-treeview>
    <h3>Lines</h3>
    <v-treeview dense hoverable activatable active-class="warning"
      :items="iLines"></v-treeview>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import Vertex from "@/3d-objs/Vertex";
import { State } from "vuex-class";
import { SEVertex, SELine } from "@/types";
import { Scene, MeshLambertMaterial } from 'three';
// import { VertexInfo } from "@/store";

@Component
export default class ObjectTree extends Vue {

  private selectedVertex: Vertex | null = null;

  @Prop(Scene)
  readonly scene!: Scene;

  @State
  private vertices!: SEVertex[]

  @State
  private lines!: SELine[];

  // TODO: the getter function seems to be sluggish?
  get iVertices() {
    return this.vertices.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: z.incidentLines.map(x => ({
        id: x.ref.id, name: x.ref.name
      }))
    }));
  }

  get iLines() {
    return this.lines.map(z => ({
      id: z.ref.id,
      name: z.ref.name,
      children: [
        { id: z.start.ref.id, name: "Start " + z.start.ref.name },
        { id: z.end.ref.id, name: "End at" + z.end.ref.name }
      ]
    }))
  }
  updateActive(args: number[]) {
    // console.debug("Active", what);
    if (args.length > 0) {
      if (this.selectedVertex) {
        (this.selectedVertex.material as MeshLambertMaterial).emissive.set(0);
      }
      this.selectedVertex = this.scene.getObjectById(args[0]) as Vertex;

      (this.selectedVertex.material as MeshLambertMaterial).emissive.set(0xff0000);
    }
  }
}
</script>

<style lang="sass">
// background:
</style>

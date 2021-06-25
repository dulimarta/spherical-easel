<template>
  <div @mouseenter="onListEnter"
    @mouseleave="onListLeave">
    <!-- the class "nodata" is used for testing. Do not remove it -->
    <span v-if="items.length === 0"
      class="_test_nodata">No data</span>
    <v-list three-line>
      <template v-for="(r,pos) in items">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <!-- the class "listitem" is used for testing. Do not remove it -->
          <v-list-item class="_test_constructionItem"
            @mouseover.capture="onItemHover(r)"
            @mouseleave="onItemLeave">
            <v-list-item-avatar size="64">
              <img :src="previewOrDefault(r.previewData)"
                alt="preview">
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="text-truncate">
                {{r.description || "N/A"}}
              </v-list-item-title>
              <v-list-item-subtitle><code>{{r.id.substring(0,5)}}</code>
                <span class="text-truncate">
                  {{r.objectCount}} objects,
                  {{r.dateCreated.substring(0,10)}}
                  {{r.author}}</span>
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay absolute
              class="_test_constructionOverlay"
              opacity="0.3"
              :value="hover">
              <v-row align="center">
                <v-col>
                  <v-btn rounded
                    id="_test_loadfab"
                    fab
                    small
                    color="secondary">
                    <v-icon
                      @click="$emit('load-requested', {docId: r.id})">
                      mdi-download</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="allowSharing">
                  <v-btn rounded
                    id="_test_sharefab"
                    fab
                    small
                    color="secondary"
                    @click="$emit('share-requested', {docId: r.id})">
                    <v-icon>mdi-share-variant</v-icon>
                  </v-btn>
                </v-col>
                <!-- show delete button only for its owner -->
                <v-col v-if="r.author === userEmail">
                  <v-btn rounded
                    id="_test_deletefab"
                    fab
                    small
                    color="red"
                    @click="$emit('delete-requested', {docId: r.id})">
                    <v-icon>mdi-trash-can</v-icon>
                  </v-btn>
                </v-col>

              </v-row>
            </v-overlay>
          </v-list-item>
        </v-hover>
      </template>
    </v-list>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { AppState, SphericalConstruction } from "@/types";
import { FirebaseAuth } from "node_modules/@firebase/auth-types";
import { Matrix4 } from "three";
import axios, { AxiosResponse } from "axios";
import { namespace } from "vuex-class";
import { SEStore } from "@/store";
const SE = namespace("se");

@Component
export default class extends Vue {
  @Prop()
  readonly items!: Array<SphericalConstruction>;

  @Prop({ type: Boolean })
  readonly allowSharing!: boolean;

  @SE.State((s: AppState) => s.svgCanvas)
  readonly svgCanvas!: HTMLDivElement | null;

  @SE.State((s: AppState) => s.inverseTotalRotationMatrix)
  readonly inverseTotalRotationMatrix!: Matrix4;

  readonly $appAuth!: FirebaseAuth;

  svgParent: HTMLDivElement | null = null;
  svgRoot!: SVGElement;
  // svgRootClone: SVGElement | null = null;
  originalSphereMatrix!: Matrix4;
  domParser!: DOMParser;
  lastDocId: string | null = null;

  created(): void {
    this.domParser = new DOMParser();
    this.originalSphereMatrix = new Matrix4();
  }
  get userEmail(): string {
    return this.$appAuth.currentUser?.email ?? "";
  }

  mounted(): void {
    // To use `innerHTML` we have to get a reference to the parent of
    // the <svg> tree
    this.svgParent = this.svgCanvas as HTMLDivElement;
    this.svgRoot = this.svgCanvas?.querySelector("svg") as SVGElement;
  }

  previewOrDefault(dataUrl: string | undefined): string {
    return dataUrl ? dataUrl : require("@/assets/SphericalEaselLogo.gif");
  }

  onListEnter(/*ev:MouseEvent*/): void {
    this.originalSphereMatrix.copy(this.inverseTotalRotationMatrix);
  }

  onItemHover(s: SphericalConstruction): void {
    if (this.lastDocId === s.id) return; // Prevent double hovers?
    this.lastDocId = s.id;
    axios
      .get(s.previewData)
      .then((r: AxiosResponse) => r.data)
      .then((svgString: string) => {
        const newSvg = this.domParser.parseFromString(
          svgString,
          "image/svg+xml"
        );
        // We assume the SVG tree is always the first child
        this.svgParent?.replaceChild(
          newSvg.activeElement as SVGElement,
          this.svgParent.firstChild as SVGElement
        );
      });
  }

  onItemLeave(/*_ev: MouseEvent*/): void {
    this.lastDocId = null;
  }

  onListLeave(/*_ev: MouseEvent*/): void {
    // Restore the canvas
    this.svgParent?.replaceChild(
      this.svgRoot,
      this.svgParent.firstChild as SVGElement
    );
    // Restore the rotation matrix
    SEStore.setInverseRotationMatrix(this.originalSphereMatrix);
  }
}
</script>

<style scoped>
</style>
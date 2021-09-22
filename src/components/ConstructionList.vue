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
            @mouseover.capture="onItemHover(r)">
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
                    <v-icon @click="loadPreview(r.id)">
                      mdi-download</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="
                      allowSharing">
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
  previewSVG: SVGElement | null = null;
  selectedSVG: SVGElement | null = null;
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
    this.svgRoot = this.svgParent.querySelector("svg") as SVGElement;
  }

  previewOrDefault(dataUrl: string | undefined): string {
    return dataUrl ? dataUrl : require("@/assets/SphericalEaselLogo.gif");
  }

  onListEnter(/*ev:MouseEvent*/): void {
    this.previewSVG = null;
    this.originalSphereMatrix.copy(this.inverseTotalRotationMatrix);
  }

  // TODO: the onXXXX functions below are not bug-free yet
  // There is a potential race-condition when the mouse moves too fast
  // or when the mouse moves while a new construction is being loaded
  async onItemHover(s: SphericalConstruction): Promise<void> {
    if (this.lastDocId === s.id) return; // Prevent double hovers?
    this.lastDocId = s.id;
    const newSvg = await axios
      .get(s.previewData)
      .then((r: AxiosResponse) => r.data)
      .then((svgString: string) => {
        const newDoc = this.domParser.parseFromString(
          svgString,
          "image/svg+xml"
        );
        return newDoc.querySelector("svg") as SVGElement;
      });

    // If we are previewing a construction replace that with the new one
    // Otherwise replace the current top-level SVG with the new one
    if (this.previewSVG !== null) this.previewSVG.replaceWith(newSvg);
    else this.svgRoot.replaceWith(newSvg);
    // console.debug("onItemHover:", this.previewSVG);
    this.previewSVG = newSvg;
  }

  onListLeave(/*_ev: MouseEvent*/): void {
    // Restore the canvas ** THIS CAUSES PROBLEMS WITH THE *styling (i.e. anything other than the default)* DISPLAY OF THE LABELS
    this.svgParent?.replaceChild(
      this.svgRoot,
      this.svgParent.firstChild as SVGElement
    );
    // Restore the rotation matrix
    SEStore.setInverseRotationMatrix(this.originalSphereMatrix);
    /// HANS I KNOW THIS IS A TERIBLE WAY TO TRY A SOLVE THIS PROBLEM BUT THIS DOESN'T WORK
    //    SO THE ISSUE IS IN THE CSS MAYBE? OR THE DOM? OR UPDATING TWO.JS?
    // setTimeout(() => {
    //   console.log("list leave");
    //   SEStore.updateDisplay();
    // }, 1000);
  }

  loadPreview(docId: string): void {
    this.selectedSVG = this.previewSVG;
    this.$emit("load-requested", { docId });
  }
}
</script>

<style scoped>
</style>
<template>
  <div @mouseenter="onListEnter"
    @mouseleave="onListLeave">
    <v-list three-line>
      <template v-for="(r,pos) in items">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item @mouseover.capture="onItemHover(r)"
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
              opacity="0.3"
              :value="hover">
              <v-row align="center">
                <v-col>
                  <v-btn rounded
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
import { SphericalConstruction } from "@/types";
import { FirebaseAuth } from "node_modules/@firebase/auth-types";
import { Matrix4 } from "three";

@Component
export default class extends Vue {
  readonly $appAuth!: FirebaseAuth;
  @Prop()
  items!: Array<SphericalConstruction>;

  @Prop({ default: false })
  allowSharing!: boolean;

  svgParent!: HTMLDivElement;
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
    this.svgParent = this.$store.direct.state.svgCanvas as HTMLDivElement;
    this.svgRoot = this.$store.direct.state.svgCanvas?.querySelector(
      "svg"
    ) as SVGElement;
  }

  previewOrDefault(dataUrl: string | undefined): string {
    return dataUrl ? dataUrl : require("@/assets/SphericalEaselLogo.gif");
  }

  onListEnter(/*ev:MouseEvent*/): void {
    this.originalSphereMatrix.copy(
      this.$store.direct.state.inverseTotalRotationMatrix
    );
  }

  onItemHover(s: SphericalConstruction): void {
    if (this.lastDocId === s.id) return; // Prevent double hovers?
    this.lastDocId = s.id;
    fetch(s.previewData)
      .then((r: Response) => r.blob())
      .then((b: Blob) => b.text())
      .then((svgString: string) => {
        const newSvg = this.domParser.parseFromString(
          svgString,
          "image/svg+xml"
        );
        // this.$store.direct.commit.rotateSphere(s.sphereRotationMatrix);
        // We assume the SVG tree is always the first child
        this.svgParent.replaceChild(
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
    this.svgParent.replaceChild(
      this.svgRoot,
      this.svgParent.firstChild as SVGElement
    );

    // Restore the rotation matrix
    this.$store.direct.state.inverseTotalRotationMatrix.copy(
      this.originalSphereMatrix
    );
  }
}
</script>

<style scoped>
</style>
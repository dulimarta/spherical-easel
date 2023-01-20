<template>
  <div @mouseenter="onListEnter" @mouseleave="onListLeave">
    <!-- the class "nodata" is used for testing. Do not remove it -->
    <span v-if="items.length === 0" class="_test_nodata">No data</span>
    <v-list three-line>
      <template v-for="(r, pos) in items" :key="pos">
        <v-hover v-slot:default="{ hover }">
          <!-- the class "listitem" is used for testing. Do not remove it -->
          <v-list-item
            class="_test_constructionItem"
            @mouseover.capture="onItemHover(r)">
            <v-list-item-avatar size="64">
              <img :src="previewOrDefault(r.previewData)" alt="preview" />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="text-truncate">
                {{ r.description || "N/A" }}
              </v-list-item-title>
              <v-list-item-subtitle
                ><code>{{ r.id.substring(0, 5) }}</code>
                <span class="text-truncate">
                  {{ r.objectCount }} objects,
                  {{ r.dateCreated.substring(0, 10) }}
                  {{ r.author }}</span
                >
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay
              absolute
              class="_test_constructionOverlay"
              opacity="0.3"
              :value="hover">
              <v-row align="center">
                <v-col>
                  <v-btn rounded id="_test_loadfab" fab small color="secondary">
                    <v-icon @click="loadPreview(r.id)">
                      $downloadConstruction</v-icon
                    >
                  </v-btn>
                </v-col>
                <v-col v-if="allowSharing">
                  <v-btn
                    rounded
                    id="_test_sharefab"
                    fab
                    small
                    color="secondary"
                    @click="$emit('share-requested', { docId: r.id })">
                    <v-icon>$shareConstruction</v-icon>
                  </v-btn>
                </v-col>
                <!-- show delete button only for its owner -->
                <v-col v-if="r.author === userEmail">
                  <v-btn
                    rounded
                    id="_test_deletefab"
                    fab
                    small
                    color="red"
                    @click="$emit('delete-requested', { docId: r.id })">
                    <v-icon>$deleteConstruction</v-icon>
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

<script lang="ts" setup>
import { SphericalConstruction } from "@/types";
import { Matrix4 } from "three";
import axios, { AxiosResponse } from "axios";
import { useSEStore } from "@/stores/se";
import { computed, onBeforeMount, onMounted } from "vue";
import { appAuth } from "@/firebase-config";
import { storeToRefs } from "pinia";
const props = defineProps<{
  items: Array<SphericalConstruction>;
  allowSharing?: boolean;
}>();
const emit = defineEmits(["load-requested"])

const seStore = useSEStore();
const { svgCanvas } =  storeToRefs(seStore);
let { inverseTotalRotationMatrix } = storeToRefs(seStore);

let svgParent: HTMLDivElement | null = null;
let svgRoot!: SVGElement;
let previewSVG: SVGElement | null = null;
let selectedSVG: SVGElement | null = null;
// svgRootClone: SVGElement | null = null;
let originalSphereMatrix!: Matrix4;
let domParser!: DOMParser;
let lastDocId: string | null = null;

onBeforeMount((): void => {
  domParser = new DOMParser();
  originalSphereMatrix = new Matrix4();
});
const userEmail = computed((): string => {
  return appAuth.currentUser?.email ?? "";
});

onMounted((): void => {
  // To use `innerHTML` we have to get a reference to the parent of
  // the <svg> tree
  svgParent = svgCanvas.value as HTMLDivElement;
  svgRoot = svgParent.querySelector("svg") as SVGElement;
});

function previewOrDefault(dataUrl: string | undefined): string {
  return dataUrl ? dataUrl : require("@/assets/SphericalEaselLogo.gif");
}

function onListEnter(/*ev:MouseEvent*/): void {
  previewSVG = null;
  originalSphereMatrix.copy(inverseTotalRotationMatrix.value);
}

// TODO: the onXXXX functions below are not bug-free yet
// There is a potential race-condition when the mouse moves too fast
// or when the mouse moves while a new construction is being loaded
async function onItemHover(s: SphericalConstruction): Promise<void> {
  if (lastDocId === s.id) return; // Prevent double hovers?

  lastDocId = s.id;
  let aDoc: Document | undefined = undefined;

  if (s.previewData.startsWith("data:")) {
    const regex = /^data:.+\/(.+);base64,(.*)$/;
    const parts = s.previewData.match(regex);
    if (parts) {
      const buff = Buffer.from(parts[2], "base64");
      aDoc = domParser.parseFromString(buff.toString(), "image/svg+xml");
    }
  } else {
    aDoc = await axios
      .get(s.previewData, { responseType: "text" })
      .then((r: AxiosResponse) => r.data)
      .then((svgString: string) => {
        const newDoc = domParser.parseFromString(svgString, "image/svg+xml");
        return newDoc; // .querySelector("svg") as SVGElement;
      });
  }
  if (aDoc) {
    const newSvg = aDoc.querySelector("svg") as SVGElement;

    // If we are previewing a construction replace that with the new one
    // Otherwise replace the current top-level SVG with the new one

    if (previewSVG !== null) previewSVG.replaceWith(newSvg);
    else svgRoot.replaceWith(newSvg);
    // console.debug("onItemHover:", previewSVG);
    previewSVG = newSvg;
  }
}

function onListLeave(/*_ev: MouseEvent*/): void {
  // Restore the canvas ** THIS CAUSES PROBLEMS WITH THE *styling (i.e. anything other than the default)* DISPLAY OF THE LABELS
  svgParent?.replaceChild(svgRoot, svgParent.firstChild as SVGElement);
  // Restore the rotation matrix
  inverseTotalRotationMatrix.value = originalSphereMatrix;
  /// HANS I KNOW THIS IS A TERIBLE WAY TO TRY A SOLVE THIS PROBLEM BUT THIS DOESN'T WORK
  //    SO THE ISSUE IS IN THE CSS MAYBE? OR THE DOM? OR UPDATING TWO.JS?
  // setTimeout(() => {
  //   console.log("list leave");
  //   SEStore.updateDisplay();
  // }, 1000);
}

function loadPreview(docId: string): void {
  selectedSVG = previewSVG;
  emit("load-requested", { docId });
}
// }
</script>

<style scoped></style>

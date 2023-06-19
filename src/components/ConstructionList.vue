<template>
  <div @mouseleave="onListLeave">
    <!-- the class "nodata" is used for testing. Do not remove it -->
    <span v-if="items.length === 0" class="_test_nodata">No data</span>
    <v-list lines="three">
      <template v-for="(r, pos) in items" :key="pos">
        <v-hover>
          <template v-slot:default="{ isHovering, props }">
            <!-- the class "constructionItem" is used for testing. Do not remove it -->
            <v-list-item
              v-bind="props"
              class="_test_constructionItem"
              @mouseover.capture="onItemHover(r)">
              <template #prepend>
                <img
                  :src="previewOrDefault(r.previewData)"
                  class="mr-1"
                  alt="preview"
                  width="64" />
              </template>
              <v-list-item-title class="text-truncate">
                {{ r.description || "N/A" }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <code>{{ r.id.substring(0, 5) }}</code>
                <span class="text-truncate">
                  {{ r.objectCount }} objects,
                  {{ r.dateCreated.substring(0, 10) }}
                  {{ r.author }}
                </span>
              </v-list-item-subtitle>
              <v-divider />
              <!--- show a Load button as an overlay when the mouse hovers -->
              <v-overlay
                contained
                :model-value="isHovering"
                class="_test_constructionOverlay align-center justify-center"
                scrim="#00007F">
                <div class="constructionItem">
                  <v-btn
                    id="_test_loadfab"
                    class="mx-1"
                    size="small"
                    color="secondary"
                    icon="$downloadConstruction"
                    @click="loadPreview(r.id)"></v-btn>
                  <v-btn
                    v-if="allowSharing"
                    id="_test_sharefab"
                    class="mx-1"
                    size="small"
                    color="secondary"
                    icon="$shareConstruction"
                    @click="$emit('share-requested', { docId: r.id })"></v-btn>
                  <!-- show delete button only for its owner -->
                  <v-btn
                    v-if="r.author === userEmail"
                    id="_test_deletefab"
                    class="mx-1"
                    size="small"
                    icon="$deleteConstruction"
                    color="red"
                    @click="$emit('delete-requested', { docId: r.id })">
                  </v-btn>
                </div>
              </v-overlay>
            </v-list-item>
          </template>
        </v-hover>
      </template>
    </v-list>
  </div>
</template>

<script lang="ts" setup>
import { SphericalConstruction } from "@/types";
import { useSEStore } from "@/stores/se";
import { getAuth } from "firebase/auth";
import { computed, onBeforeMount, onMounted } from "vue";
import { storeToRefs } from "pinia";
import EventBus from "@/eventHandlers/EventBus";
const props = defineProps<{
  items: Array<SphericalConstruction>;
  allowSharing?: boolean;
}>();
const emit = defineEmits(["load-requested"]);

const seStore = useSEStore();
const appAuth = getAuth();

let lastDocId: string | null = null;
const userEmail = computed((): string => {
  return appAuth.currentUser?.email ?? "";
});

function previewOrDefault(dataUrl: string | undefined): string {
  return dataUrl ? dataUrl : "/logo.png";
}


// TODO: the onXXXX functions below are not bug-free yet
// There is a potential race-condition when the mouse moves too fast
// or when the mouse moves while a new construction is being loaded
async function onItemHover(s: SphericalConstruction): Promise<void> {
  if (lastDocId === s.id) return; // Prevent double hovers?
  lastDocId = s.id;
  EventBus.fire("preview-construction", s)
}

function onListLeave(/*_ev: MouseEvent*/): void {
  EventBus.fire("preview-construction", null)
  lastDocId = "";


  /// HANS I KNOW THIS IS A TERIBLE WAY TO TRY A SOLVE THIS PROBLEM BUT THIS DOESN'T WORK
  //    SO THE ISSUE IS IN THE CSS MAYBE? OR THE DOM? OR UPDATING TWO.JS?
  // setTimeout(() => {
  //   console.log("list leave");
  //   SEStore.updateDisplay();
  // }, 1000);
}

function loadPreview(docId: string): void {
  emit("load-requested", { docId });
}
</script>

<style scoped>
.constructionItem {
  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  /* width: 100%; */
  /* background-color: red; */
}
</style>

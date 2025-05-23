<template>
  <v-tabs v-model="tab">
    <v-tab value="SVG">SVG Files</v-tab>
    <v-tab value="Script">Script Files</v-tab>
  </v-tabs>
  <v-tabs-window v-model="tab">
    <v-tabs-window-item value="SVG" class="mx-3">
      <h2>SVG Files</h2>
      <v-data-table
        :items="svgFiles"
        :headers="tableHeaders"
        density="compact"
        hover
        class="pa-4">
        <template v-slot:item.actions="{ item }">
          <v-icon
            v-if="!item.used"
            @click="deleteFromStorage(item.path, 'construction-svg', svgFiles)">
            mdi-delete
          </v-icon>
          <span v-else>N/A</span>
        </template>
      </v-data-table>
    </v-tabs-window-item>
    <v-tabs-window-item value="Script" class="mx-3">
      <h2>Script Files</h2>
      <v-data-table
        :items="scriptFiles"
        :headers="tableHeaders"
        density="compact"
        hover
        class="pa-4">
        <template v-slot:item.actions="{ item }">
          <v-icon
            v-if="!item.used"
            @click="deleteFromStorage(item.path, 'scripts', scriptFiles)">
            mdi-delete
          </v-icon>
          <span v-else>N/A</span>
        </template>
      </v-data-table>
    </v-tabs-window-item>
    <!-- <v-data-table :items="constructionDetails" /> -->
  </v-tabs-window>
</template>
<script setup lang="ts">
import { onMounted, Ref, ref } from "vue";
import {
  getStorage,
  ref as storageRef,
  FirebaseStorage,
  listAll,
  ListResult,
  StorageReference,
  getMetadata,
  FullMetadata,
  deleteObject
} from "firebase/storage";
import {
  collection,
  DocumentSnapshot,
  Firestore,
  getDocs,
  getFirestore,
  QuerySnapshot
} from "firebase/firestore";
import { SphericalConstruction } from "@/types";
let appStorage: FirebaseStorage;
let appDB: Firestore;

const tableHeaders = [
  {
    title: "Filename",
    key: "path"
  },
  {
    title: "Size (bytes)",
    key: "size"
  },
  {
    title: "Used",
    key: "used"
  },
  {
    title: "Actions",
    key: "actions"
  }
];
type CloudFile = {
  path: string;
  size: number;
  used: boolean;
};
type Construction = {
  user: string;
  docId: string;
  preview: string;
  script: string;
};

const svgFiles: Ref<CloudFile[]> = ref([]);
const scriptFiles: Ref<CloudFile[]> = ref([]);
const tab = ref("SVG");

const constructionDetails: Ref<Construction[]> = ref([]);

onMounted(async () => {
  appStorage = getStorage();
  appDB = getFirestore();

  const qsUsers = await getDocs(collection(appDB, "users"));
  const task = qsUsers.docs.map((qdUser: DocumentSnapshot) => {
    const uCons = collection(qdUser.ref, "constructions");
    return getDocs(uCons);
  });
  const svgSet: Set<string> = new Set();
  const scriptSet: Set<string> = new Set();
  const zzzz = (await Promise.all(task))
    .map(uColl => uColl.docs)
    .filter(docs => docs.length > 0)
    .flatMap(docs => docs)
    .map(qds => {
      const details = qds.data();
      let preview = "N/A";
      let script = "N/A";
      if (details.preview.startsWith("https://")) {
        const p1 = details.preview.indexOf("%2F");
        const p2 = details.preview.indexOf("?");
        preview = details.preview.substring(p1 + 3, p2);
        svgSet.add(preview);
      }
      if (details.script.startsWith("https://")) {
        const s1 = details.script.indexOf("%2F");
        const s2 = details.script.indexOf("?");
        script = details.script.substring(s1 + 3, s2);
        scriptSet.add(script);
      }
      return {
        docId: qds.id,
        preview,
        script
      } as Construction;
    })
    .filter((c: Construction) => c.preview !== "N/A" || c.script !== "N/A");
  // console.debug("What is", zzzz);
  console.debug("SVG set", svgSet);
  console.debug("Script set", scriptSet);
  const svgRef = storageRef(appStorage, "construction-svg");
  const svgResult = await listAll(svgRef);
  const z = await svgResult.items.map(async (aFile: StorageReference) => {
    const metadata = await getMetadata(aFile);
    return {
      path: aFile.name,
      size: metadata.size,
      used: svgSet.has(aFile.name)
    } as CloudFile;
  });
  svgFiles.value = await Promise.all(z);
  const scriptRef = storageRef(appStorage, "scripts");
  const scriptResult = await listAll(scriptRef);
  const zz = await scriptResult.items.map(async (aFile: StorageReference) => {
    const metadata = await getMetadata(aFile);
    return {
      path: aFile.name,
      size: metadata.size,
      used: scriptSet.has(aFile.name)
    } as CloudFile;
  });
  scriptFiles.value = await Promise.all(zz);
});

function deleteFromStorage(
  fileName: string,
  parentDir: string,
  arr: Array<CloudFile>
) {
  const pos = arr.findIndex(s => s.path === fileName);
  if (pos >= 0) {
    arr.splice(pos, 1);
    const aFile = storageRef(appStorage, `${parentDir}/${fileName}`);
    deleteObject(aFile);
  }
}
</script>

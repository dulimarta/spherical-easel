<template>
  <v-tabs v-model="tab">
    <v-tab value="SVG">SVG Files</v-tab>
    <v-tab value="Script">Script Files</v-tab>
    <v-tab value="User">Users</v-tab>
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
    <v-tabs-window-item value="User" class="mx-3">
      <h2>User Created Constructions</h2>
      {{ ownedConstruction.length }} {{ userProfiles.size }}
      <v-data-table
        :items="ownedConstruction"
        :headers="userTableHeaders"
        item-value="owner"
        density="compact"
        hover show-expand>
        <template #item.owner="{ value }">
          <div class="text-h6">
          {{ userProfiles.get(value)?.displayName ?? "<NONAME>" }} / {{ userProfiles.get(value)?.role }} </div>
            <div>
               (ID {{ value }})
            {{ userProfiles.get(value)?.location }}        
            </div>
        </template>
        <template #item.constructions="{ value }">
          {{ value.length }} files
        </template>
        <template #item.data-table-expand="{ internalItem, isExpanded, toggleExpand}">
          <template v-if="internalItem.columns.constructions.length > 0">
          <v-icon v-if="isExpanded(internalItem)" @click="toggleExpand(internalItem)">mdi-chevron-up</v-icon>
          <v-icon v-else @click="toggleExpand(internalItem)">mdi-chevron-down</v-icon>
          </template>
        </template>
        <template #expanded-row="{columns, item}">
          <!-- <table border="1">
            <tr><th>PubID</th><th>Author</th><th>Description</th><th>Created</th><th>Star Count</th></tr>
            <tr v-for="c in item.constructions">
              <td>{{ c.publicDocId }}</td>
              <td>{{ c.author }}</td>
              <td>{{ c.description }}</td>
              <td>{{ c.dateCreated }}</td>
              <td>{{ c.starCount }}</td>
            </tr>
          </table> -->
          <v-data-table :items="item.constructions" :headers="constructionHeaders" item-value="description"
          density="compact"></v-data-table>
        </template>
        <!--template #item.actions="{item}">
          <v-icon >mdi-delete</v-icon>
        </!--template> -->
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
  // ListResult,
  StorageReference,
  getMetadata,
  // FullMetadata,
  deleteObject
} from "firebase/storage";
import {
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  Firestore,
  getDocs,
  getFirestore,
  QuerySnapshot
} from "firebase/firestore";
import { UserProfile } from "@/types";
import { ConstructionInFirestore } from "@/types/ConstructionTypes";
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
const userTableHeaders = [
  {
    title: "Owner",
    key: "owner"
  },
  {
    title: "Constructions Count",
    key: "constructions"
  },
  // {
  //   title: "Actions",
  //   key: "actions"
  // }
];

const constructionHeaders = [
  {title: "Description", key: "description"},
  { title: "Created", key: "dateCreated" },
  {title: "Public", key: "publicDocId"}
]
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
type OwnDocs = {
  owner: string;
  constructions: ConstructionInFirestore[];
};
const svgFiles: Ref<CloudFile[]> = ref([]);
const scriptFiles: Ref<CloudFile[]> = ref([]);
// const queryOwner: Ref<OwnDocs[]> = ref([]);
// const userToConstructionMap: Map<string, ConstructionInFirestore[]> = new Map();
const ownedConstruction: Ref<OwnDocs[]> = ref([]);
const userProfiles: Ref<Map<string, UserProfile>> = ref(new Map());
const tab = ref("SVG");

const constructionDetails: Ref<Construction[]> = ref([]);

onMounted(async () => {
  appStorage = getStorage();
  appDB = getFirestore();

  const qsUsers = await getDocs(collection(appDB, "users"));
  // const promiseOwner: Map<string, Promise<QuerySnapshot>> = new Map();
  qsUsers.docs.forEach(async (qdUser: DocumentSnapshot) => {
    const uDetails = qdUser.data() as UserProfile;
    console.debug(`Profile of ${qdUser.id}`, uDetails);
    userProfiles.value.set(qdUser.id, uDetails);
    const uColl = collection(qdUser.ref, "constructions");
    console.debug("Pulling constructions from ", uColl.path);
    const uDocs = await getDocs(uColl);
    const ddd = await uDocs.docs.map(d => d.data() as ConstructionInFirestore);
    console.debug(`Constructions of ${qdUser.id}`, ddd);
    ownedConstruction.value.push({ owner: qdUser.id, constructions: ddd });
    // userToConstructionMap.set(qdUser.id,ddd)
  });
  // console.debug("After docs.forEach")
  // ownedConstruction.value = Array.from(userToConstructionMap).map(([owner, val]) =>({owner, constructions: val}))
  const svgSet: Set<string> = new Set();
  const scriptSet: Set<string> = new Set();
  // await Promise.all(task);
  // await promiseOwner.forEach(async (pDocs, owner) => {
  //   queryOwner.value.push({ owner, query: await pDocs });
  // });

  // queryOwner.value
  //   .filter(z => z.query.docs.length > 0)
  //   .flatMap(z => z.query.docs)
  //   .map(qds => {
  //     const details = qds.data();
  //     let preview = "N/A";
  //     let script = "N/A";
  //     if (details.preview.startsWith("https://")) {
  //       const p1 = details.preview.indexOf("%2F");
  //       const p2 = details.preview.indexOf("?");
  //       preview = details.preview.substring(p1 + 3, p2);
  //       svgSet.add(preview);
  //     }
  //     if (details.script.startsWith("https://")) {
  //       const s1 = details.script.indexOf("%2F");
  //       const s2 = details.script.indexOf("?");
  //       script = details.script.substring(s1 + 3, s2);
  //       scriptSet.add(script);
  //     }
  //     return {
  //       docId: qds.id,
  //       preview,
  //       script
  //     } as Construction;
  //   })
  //   .filter((c: Construction) => c.preview !== "N/A" || c.script !== "N/A");
  // console.debug("SVG set", svgSet);
  // console.debug("Script set", scriptSet);
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

function deleteUserCollection(uid: string) {
  const uDoc = doc(appDB, "users", uid);
  console.debug(`Removing user ${uid}`);
  deleteDoc(uDoc).then(() => {
    userProfiles.value.delete(uid);
    // const pos = queryOwner.value.findIndex(x => x.owner == uid)
    // if (pos >= 0) {
    //   queryOwner.value.splice(pos, 1)
    // }
  });
}
</script>

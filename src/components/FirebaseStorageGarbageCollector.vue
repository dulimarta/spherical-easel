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
      <v-data-table
        :items="ownedConstruction"
        :headers="userTableHeaders"
        item-value="owner"
        density="compact"
        hover
        show-expand>
        <template #item.owner="{ value }">
          <span v-html="showOwnerDetail(value)"></span>
        </template>
        <template #item.constructions="{ value }">
          {{ value.length }} files
        </template>
        <template
          #item.data-table-expand="{ internalItem, isExpanded, toggleExpand }">
          <template v-if="internalItem.columns.constructions.length > 0">
            <v-icon
              v-if="isExpanded(internalItem)"
              @click="toggleExpand(internalItem)">
              mdi-chevron-up
            </v-icon>
            <v-icon v-else @click="toggleExpand(internalItem)">
              mdi-chevron-down
            </v-icon>
          </template>
        </template>
        <template #expanded-row="{ columns, item }">
          <v-data-table
            :items="item.constructions"
            :headers="constructionHeaders"
            item-value="docId"
            density="compact">
            <template #item.script="{ value }">
              <span v-if="value.length > 0">{{ value.substring(0, 40) }}</span>
              <span v-else>NONE</span>
            </template>
            <template #item.dateCreated="{ value }">
              {{ dateFormatter.format(new Date(value)) }}
            </template>

            <template #item.actions="childItem">
              <span>
                <v-icon
                  v-if="childItem.item.script.length === 0"
                  @click="
                    deleteDocumentFromFirestore(
                      item.owner,
                      childItem.item.docId
                    )
                  ">
                  mdi-delete
                </v-icon>
                <v-icon
                  v-if="!isPublicRefValid(childItem.item.publicDocId)"
                  @click="unpublish(item.owner, childItem.item.docId)">
                  mdi-publish-off
                </v-icon>
              </span>
            </template>
          </v-data-table>
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
  deleteField,
  doc,
  DocumentSnapshot,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  QuerySnapshot,
  updateDoc
} from "firebase/firestore";
import { UserProfile } from "@/types";
import { ConstructionInFirestore } from "@/types/ConstructionTypes";
let appStorage: FirebaseStorage;
let appDB: Firestore;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium"
});
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
  }
  // {
  //   title: "Actions",
  //   key: "actions"
  // }
];

const constructionHeaders = [
  { title: "Doc ID", key: "docId" },
  { title: "Description", key: "description" },
  { title: "Created", key: "dateCreated" },
  { title: "Published", key: "publicDocId" },
  { title: "Command Script", key: "script" },
  { title: "Action", key: "actions" }
];
type CloudFile = {
  path: string;
  size: number;
  used: boolean;
};
interface CIF extends ConstructionInFirestore {
  docId: string;
}
type OwnDocs = {
  owner: string;
  constructions: CIF[];
};
const svgFiles: Ref<CloudFile[]> = ref([]);
const scriptFiles: Ref<CloudFile[]> = ref([]);
// const queryOwner: Ref<OwnDocs[]> = ref([]);
// const userToConstructionMap: Map<string, ConstructionInFirestore[]> = new Map();
const ownedConstruction: Ref<OwnDocs[]> = ref([]);
const userProfiles: Ref<Map<string, UserProfile>> = ref(new Map());
const knownPublicDocRef: Ref<Set<string>> = ref(new Set());
const tab = ref("SVG");

onMounted(async () => {
  appStorage = getStorage();
  appDB = getFirestore();

  const qsUsers = await getDocs(collection(appDB, "users"));
  // const promiseOwner: Map<string, Promise<QuerySnapshot>> = new Map();
  qsUsers.docs.forEach(async (qdUser: DocumentSnapshot) => {
    const uDetails = qdUser.data() as UserProfile;
    // console.debug(`Profile of ${qdUser.id}`, uDetails);
    userProfiles.value.set(qdUser.id, uDetails);
    const uColl = collection(qdUser.ref, "constructions");
    // console.debug("Pulling constructions from ", uColl.path);
    const uDocs = await getDocs(uColl);
    const ddd = await uDocs.docs.map(d => {
      const cDoc = d.data() as ConstructionInFirestore;
      if (cDoc.script.startsWith("https://")) {
        const s1 = cDoc.script.indexOf("%2F");
        const s2 = cDoc.script.indexOf("?");
        const scriptFileName = cDoc.script.substring(s1 + 3, s2);
        scriptSet.add(scriptFileName);
        console.debug(scriptFileName);
      }
      if (cDoc.preview.startsWith("https://")) {
        const p1 = cDoc.preview.indexOf("%2F");
        const p2 = cDoc.preview.indexOf("?");
        const previewFileName = cDoc.preview.substring(p1 + 3, p2);
        svgSet.add(previewFileName);
      }

      return {
        ...cDoc,
        docId: d.id
      };
    });
    // console.debug(`Constructions of ${qdUser.id}`, ddd);
    ownedConstruction.value.push({ owner: qdUser.id, constructions: ddd });
    // userToConstructionMap.set(qdUser.id,ddd)
  });
  // console.debug("After docs.forEach")
  // ownedConstruction.value = Array.from(userToConstructionMap).map(([owner, val]) =>({owner, constructions: val}))
  const svgSet: Set<string> = new Set();
  const scriptSet: Set<string> = new Set();

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

function deleteDocumentFromFirestore(UID: string, docId: string) {
  const path = `users/${UID}/constructions/${docId}`;
  console.debug(`About to delete ${path}`);
  const uIdx = ownedConstruction.value.findIndex(z => z.owner === UID);
  if (uIdx >= 0) {
    const pIdx = ownedConstruction.value[uIdx].constructions.findIndex(
      c => c.docId === docId
    );
    if (pIdx >= 0) {
      ownedConstruction.value[uIdx].constructions.splice(pIdx, 1);
      const victimDoc = doc(appDB, path);
      deleteDoc(victimDoc);
    }
  }
}

function isPublicRefValid(docId: string | undefined): boolean {
  if (!docId) return true; // Undefined public doc id is considered valid
  // First check if this public docId has been checked earlier
  let registered = knownPublicDocRef.value.has(docId);
  if (!registered) {
    setTimeout(async () => {
      const d1 = await getDoc(doc(appDB, `constructions/${docId}`));
      const found = await d1.exists();
      // Record in the cache if the document reference is valid
      if (found) knownPublicDocRef.value.add(docId);
    }, 100);
  }
  return registered;
}

async function unpublish(uid: string, docId: string | undefined) {
  const uIdx = ownedConstruction.value.findIndex(z => z.owner === uid);
  if (uIdx >= 0) {
    const cIdx = ownedConstruction.value[uIdx].constructions.findIndex(
      c => c.docId === docId
    );
    if (cIdx >= 0) {
      console.debug("here");
      ownedConstruction.value[uIdx].constructions[cIdx].publicDocId = undefined;
      const docRef = doc(appDB, `users/${uid}/constructions/${docId}`);
      await updateDoc(docRef, {
        publicDocId: deleteField()
      });
    }
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

function showOwnerDetail(uid: string) {
  const name = userProfiles.value.get(uid)?.displayName ?? "<NONAME>";
  const role = userProfiles.value.get(uid)?.role;
  const location = userProfiles.value.get(uid)?.location;
  return `<span class='text-body-1'>${name} (UID ${uid})</span><br/> <span class='text-body-2'>${role}</span>`;
}
</script>

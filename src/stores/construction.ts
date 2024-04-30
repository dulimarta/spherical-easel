import {
  ConstructionInFirestore,
  SphericalConstruction,
  ConstructionScript,
  PublicConstructionInFirestore
} from "@/types";
import { defineStore } from "pinia";
import { Auth, User, getAuth } from "firebase/auth";
import { onMounted } from "vue";
import { ref, Ref } from "vue";
import {
  FirebaseStorage,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef
} from "firebase/storage";
import {
  CollectionReference,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  collection,
  QuerySnapshot,
  QueryDocumentSnapshot,
  getFirestore,
  Unsubscribe,
  onSnapshot,
  Firestore,
  deleteDoc,
  DocumentChange,
  FieldValue,
  deleteField,
  addDoc,
  DocumentReference
} from "firebase/firestore";
import "@/extensions/array-extensions";
import axios, { AxiosResponse } from "axios";
import { Matrix4, Sphere } from "three";
import EventBus from "@/eventHandlers/EventBus";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { watch } from "vue";
let appAuth: Auth;
let appStorage: FirebaseStorage;
let appDB: Firestore;
let snapShotUnsubscribe: Unsubscribe | null = null;

async function parseDocument(
  id: string,
  remoteDoc: ConstructionInFirestore
): Promise<SphericalConstruction> {
  let parsedScript: ConstructionScript | undefined = undefined;
  const trimmedScript = remoteDoc.script.trim();
  if (trimmedScript.startsWith("https")) {
    // Fetch the actual script from Firebase Storage
    const scriptText = await getDownloadURL(
      storageRef(appStorage, trimmedScript)
    )
      .then((url: string) => axios.get(url))
      .then((r: AxiosResponse) => r.data);

    parsedScript = scriptText as ConstructionScript;
  } else {
    // Parse the script directly from the Firestore document
    parsedScript = JSON.parse(trimmedScript) as ConstructionScript;
  }
  const sphereRotationMatrix = new Matrix4();
  // we care only for non-empty script
  let svgData: string | undefined;
  if (remoteDoc.preview?.startsWith("https:")) {
    svgData = await getDownloadURL(storageRef(appStorage, remoteDoc.preview))
      .then((url: string) => axios.get(url))
      .then((r: AxiosResponse) => r.data);
    // console.debug(
    //   "SVG preview from Firebase Storage ",
    //   svgData?.substring(0, 70)
    // );
  } else {
    svgData = remoteDoc.preview;
    // console.debug("SVG preview from Firestore ", svgData?.substring(0, 70));
  }
  const objectCount = parsedScript
    // A simple command contributes 1 object
    // A CommandGroup contributes N objects (as many elements in its subcommands)
    .map((z: string | Array<string>) => (typeof z === "string" ? 1 : z.length))
    .reduce((prev: number, curr: number) => prev + curr);

  if (remoteDoc.rotationMatrix) {
    const matrixData = JSON.parse(remoteDoc.rotationMatrix);
    sphereRotationMatrix.fromArray(matrixData);
  }
  return Promise.resolve({
    version: remoteDoc.version,
    id,
    script: trimmedScript,
    parsedScript,
    objectCount,
    author: remoteDoc.author, //static value assigned for new UI starred count
    dateCreated: remoteDoc.dateCreated,
    description: remoteDoc.description,
    aspectRatio: remoteDoc.aspectRatio ?? 1,
    sphereRotationMatrix,
    preview: svgData ?? "",
    publicDocId: remoteDoc.publicDocId,
    tools: remoteDoc.tools ?? undefined,
    starCount: remoteDoc.starCount
  } as SphericalConstruction);
}

function sortConstructionArray(arr: Array<SphericalConstruction>) {
  arr.sort((a, b) => a.id.localeCompare(b.id));
}

export const useConstructionStore = defineStore("construction", () => {
  const publicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  // Public constructions is never null
  const starredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  const currentConstructionPreview: Ref<string | null> = ref(null);
  const starredConstructionIDs: Array<string> = [];
  const acctStore = useAccountStore();
  const { firebaseUid, userEmail } = storeToRefs(acctStore);

  watch(firebaseUid, async (uid, oldUid) => {
    if (uid) {
      // When an authenticated user logs in
      // (1) Build the private array
      const privateColl = collection(appDB, "users", uid, "constructions");
      await parsePrivateCollection(privateColl, privateConstructions.value);
      starredConstructionIDs.push(
        ...(await acctStore.fetchStarredConstructions(uid))
      );
      const [starred, unstarred] = publicConstructions.value.partition(z =>
        starredConstructionIDs.some(s => s === z.publicDocId)
      );
      starredConstructions.value.clear();
      publicConstructions.value.clear();
      starredConstructions.value.push(...starred);
      publicConstructions.value.push(...unstarred);
      const myPublicDocIDs: string[] = privateConstructions.value
        .filter((s: SphericalConstruction) => s.publicDocId)
        .map(s => s.publicDocId!!);
      myPublicDocIDs.forEach((docId: string) => {
        // Remove my own public constructions from the public list
        const pos = publicConstructions.value.findLastIndex(
          (s: SphericalConstruction) => s.publicDocId === docId
        );
        if (pos >= 0) {
          publicConstructions.value.splice(pos, 1);
        }
      });
    } else {
      const myPublicDocs = privateConstructions.value.filter(
        (s: SphericalConstruction) => !s.publicDocId
      );
      privateConstructions.value.splice(0);
      publicConstructions.value.push(...myPublicDocs);
    }
    sortConstructionArray(privateConstructions.value);
    sortConstructionArray(starredConstructions.value);
    sortConstructionArray(publicConstructions.value);
  });

  async function parsePublicCollection(
    constructionCollection: CollectionReference,
    targetArr: Array<SphericalConstruction>
  ): Promise<void> {
    targetArr.splice(0);

    const erroneousDocs: Array<string> = [];
    const qs: QuerySnapshot = await getDocs(constructionCollection);

    const parseTasks: Array<Promise<SphericalConstruction>> = qs.docs.map(
      async (qd: QueryDocumentSnapshot) => {
        const remoteData = qd.data();
        let out: SphericalConstruction | null = null;
        // In a new format defined by Capstone group Fall 2022
        // public constructions are simply a reference to
        // constructions owned by a particular user
        const constructionRef = remoteData as PublicConstructionInFirestore;
        // publicMap.set(qd.id, constructionRef)
        const ownedDocRef = doc(
          appDB,
          "users",
          constructionRef.author,
          "constructions",
          constructionRef.constructionDocId
        );
        const ownedDoc = await getDoc(ownedDocRef);
        return parseDocument(
          constructionRef.constructionDocId,
          ownedDoc.data() as ConstructionInFirestore
        );
        // if (out.parsedScript.length > 0) targetArr.push(out);
        // else {
        //   console.warn(
        //     `Construction ${constructionCollection.path}.${qd.id} contains no script`
        //   );
        //   erroneousDocs.push(qd.id);
        // }
      }
    );

    const constructionArr: Array<SphericalConstruction> =
      await Promise.all(parseTasks);
    targetArr.push(
      ...constructionArr.filter(
        (c: SphericalConstruction) => c.parsedScript.length > 0
      )
    );
    // Sort by creation date
    // targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
    //   a.dateCreated.localeCompare(b.dateCreated)
    // );
    // if (erroneousDocs.length > 0) {
    //   EventBus.fire("show-alert", {
    //     key: "Missing scripts in documents: " + erroneousDocs.join(","),
    //     type: "error"
    //   });
    // }

    // return Promise.resolve()
  }

  async function parsePrivateCollection(
    constructionCollection: CollectionReference,
    targetArr: Array<SphericalConstruction>
  ): Promise<void> {
    targetArr.splice(0);

    // const erroneousDocs: Array<string> = [];
    const qs: QuerySnapshot = await getDocs(constructionCollection);

    const parseTask: Array<Promise<SphericalConstruction>> = qs.docs.map(
      async (qd: QueryDocumentSnapshot) => {
        const remoteData = qd.data();
        return parseDocument(qd.id, remoteData as ConstructionInFirestore);
        // if (out.parsedScript.length > 0) targetArr.push(out);
        // else {
        //   console.warn(
        //     `Construction ${constructionCollection.path}.${qd.id} contains no script`
        //   );
        //   erroneousDocs.push(qd.id);
        // }
      }
    );

    const constructionArray: Array<SphericalConstruction> =
      await Promise.all(parseTask);
    targetArr.push(
      ...constructionArray.filter(
        (s: SphericalConstruction) => s.parsedScript.length > 0
      )
    );

    // Sort by creation date
    // targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
    //   a.dateCreated.localeCompare(b.dateCreated)
    // );
    // if (erroneousDocs.length > 0) {
    //   EventBus.fire("show-alert", {
    //     key: "Missing scripts in documents: " + erroneousDocs.join(","),
    //     type: "error"
    //   });
    // }
  }

  async function initialize() {
    // This function is invoked from App.vue
    appAuth = getAuth();
    appDB = getFirestore();
    appStorage = getStorage();

    const publicColl = collection(appDB, "constructions");
    await parsePublicCollection(publicColl, publicConstructions.value);
    sortConstructionArray(publicConstructions.value);
    // console.debug(`Public constructions ${publicConstructions.value.length}`);
  }

  async function deleteConstruction(
    uid: string,
    docId: string
  ): Promise<boolean> {
    // if (privateConstructions.value === null) return Promise.resolve(false);
    // const pos = privateConstructions.value.findIndex(
    //   (c: SphericalConstruction) => c.id === docId
    // );
    // if (pos < 0) return Promise.resolve(false);
    // try {
    //   const victimDetails = privateConstructions.value[pos];
    //   // Delete script and preview if they are stored
    //   // on the Firebase Storage
    //   if (victimDetails.publicDocId) {
    //     await deleteDoc(doc(appDB, "constructions", victimDetails.publicDocId));
    //   }
    //   if (victimDetails.script.startsWith("https://")) {
    //     await deleteObject(storageRef(appStorage, `/scripts/${docId}`));
    //   }
    //   if (victimDetails.preview.startsWith("https://"))
    //     await deleteObject(storageRef(appStorage, `/construction-svg/${docId}`));
    //   await deleteDoc(doc(appDB, "users", uid, "constructions", docId));
    //   return Promise.resolve(true);
    // } catch (err: any) {
    //   return Promise.resolve(false);
    // }
    return Promise.resolve(false);
  }

  async function makePrivate(docId: string): Promise<boolean> {
    const pos = privateConstructions.value.findIndex(s => s.id === docId);
    if (pos >= 0) {
      const ownedDocRef = doc(
        appDB,
        "users",
        firebaseUid.value!!,
        "constructions",
        docId
      );
      const publicDoc = privateConstructions.value[pos].publicDocId!!;
      const publicDocRef = doc(appDB, "constructions", publicDoc);
      await updateDoc(ownedDocRef, { publicDocId: deleteField() });
      await deleteDoc(publicDocRef);
      privateConstructions.value[pos].publicDocId = undefined
      return true;
    } else {
      return false;
    }
  }

  async function makePublic(docId: string): Promise<boolean> {
    const pos = privateConstructions.value.findIndex(s => s.id === docId);
    if (pos >= 0) {
      const pubConstruction = collection(appDB, "constructions")
      const publicDoc: PublicConstructionInFirestore = {
        author: firebaseUid.value!!,
        constructionDocId: docId
      }
      const q: DocumentReference = await addDoc(pubConstruction, publicDoc)
      const ownedDocRef = doc(
        appDB,
        "users",
        firebaseUid.value!!,
        "constructions",
        docId
      );

      await updateDoc(ownedDocRef, { publicDocId: q.id })
      privateConstructions.value[pos].publicDocId = q.id
      return true
    } else
    return false;
  }
  async function updateStarredArrayInFirebase(
    arr: Array<string>
  ): Promise<void> {
    if (firebaseUid.value) {
      const userDocRef = doc(appDB, "users", firebaseUid.value);
      await updateDoc(userDocRef, {
        userStarredConstructions: arr
      });
    }
  }

  // Move a public construction to the starred list
  function starConstruction(pubConstructionId: string) {
    const pos = publicConstructions.value.findIndex(
      (z: SphericalConstruction) => z.publicDocId == pubConstructionId
    );
    if (pos >= 0) {
      const inPublic = publicConstructions.value.splice(pos, 1);
      starredConstructions.value.push(...inPublic);
      starredConstructionIDs.push(pubConstructionId);
      updateStarredArrayInFirebase(starredConstructionIDs);
    }
  }

  function unstarConstruction(pubConstructionId: string) {
    const pos = starredConstructions.value.findIndex(
      (z: SphericalConstruction) => z.publicDocId == pubConstructionId
    );
    if (pos >= 0) {
      const inStarred = starredConstructions.value.splice(pos, 1);

      publicConstructions.value.push(...inStarred);
    }
    const pos2 = starredConstructionIDs.findIndex(x => x === pubConstructionId);
    if (pos2 >= 0) {
      starredConstructionIDs.splice(pos2, 1);
      updateStarredArrayInFirebase(starredConstructionIDs);
    }
  }

  return {
    publicConstructions,
    privateConstructions,
    starredConstructions,
    initialize,
    currentConstructionPreview,
    deleteConstruction,
    makePrivate,
    makePublic,
    starConstruction,
    unstarConstruction
  };
});

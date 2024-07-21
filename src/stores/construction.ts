import {
  ConstructionInFirestore,
  SphericalConstruction,
  ConstructionScript,
  PublicConstructionInFirestore
} from "@/types";
import { Command } from "@/commands/Command";
import { defineStore } from "pinia";
import { Auth, getAuth } from "firebase/auth";
import { ref, Ref } from "vue";
import {
  FirebaseStorage,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadString
} from "firebase/storage";
import {
  getDocs,
  getDoc,
  updateDoc,
  doc,
  collection,
  QuerySnapshot,
  QueryDocumentSnapshot,
  getFirestore,
  Firestore,
  deleteDoc,
  deleteField,
  addDoc,
  DocumentReference,
  DocumentSnapshot,
  increment
} from "firebase/firestore";
import "@/extensions/array-extensions";
import axios, { AxiosResponse } from "axios";
import { Matrix4 } from "three";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { useSEStore } from "./se";
import { watch } from "vue";
import { mergeIntoImageUrl } from "@/utils/helpingfunctions";
import { watchDebounced, watchPausable } from "@vueuse/core";
import EventBus from "@/eventHandlers/EventBus";
let appStorage: FirebaseStorage;
let appDB: Firestore;
let appAuth: Auth;

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
  const allPublicConstructions: Array<SphericalConstruction> = [];
  const publicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  // Public constructions is never null
  const starredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  const currentConstructionPreview: Ref<string | null> = ref(null);
  const acctStore = useAccountStore();
  const seStore = useSEStore();
  const {
    svgCanvas,
    inverseTotalRotationMatrix,
    isEarthMode,
    canvasWidth,
    canvasHeight
  } = storeToRefs(seStore);
  const {
    firebaseUid,
    starredConstructionIDs,
    userEmail,
    includedTools
  } = storeToRefs(acctStore);
  let currentUID: string | undefined = undefined;

  watchDebounced(firebaseUid, async uid => {
    console.debug("Firebase UID watcher", uid);
    if (uid) {
      await parsePrivateCollection(uid, privateConstructions.value);
      // Identify published owned constructions
      const myPublicSet: Set<string> = new Set();
      privateConstructions.value.forEach(s => {
        if (s.publicDocId) myPublicSet.add(s.publicDocId);
      });

      // Partition private list into mine and theirs
      const [theirs, _mine] = allPublicConstructions.partition(s => {
        const myOwnPublic = myPublicSet.has(s.publicDocId!);
        const inMyStarList = starredConstructionIDs.value.some(
          star => star === s.publicDocId
        );
        return !myOwnPublic && !inMyStarList;
      });
      publicConstructions.value = theirs;
    } else {
      privateConstructions.value.splice(0);
      publicConstructions.value = allPublicConstructions.slice(0);
    }
  }, {debounce: 500 /* milliseconds */});

  watch(
    () => starredConstructionIDs.value,
    async favorites => {
      console.debug("Starred watcher", favorites)
      if (favorites.length > 0) {
        console.debug("List of favorite items", favorites);
        const [star, unstar] = allPublicConstructions.partition(s => {
          const isStar = favorites.some(favId => favId === s.publicDocId);
          return isStar;
        });
        starredConstructions.value = star;
        publicConstructions.value = unstar;
        if (star.length !== favorites.length) {
          EventBus.fire('show-alert', {
            type: 'info',
            key: 'Some of your starred constructions are not available anymore'
          })
          const cleanStarred = favorites.filter(fav => {
            const pos = allPublicConstructions.findIndex(z => fav === z.publicDocId);
            return pos >= 0
          });
          await updateStarredArrayInFirebase(cleanStarred)
        }
      } else {
        publicConstructions.value = allPublicConstructions;
      }
    },
    { deep: true }
  );

  //   watch(sta.value, (stars) => {
  //       console.debug(`Starred Constructions`, stars)
  //       if (starredIds.length > 0) {
  //         console.debug(`Looking for starred item in ${publicConstructions.value.length}`)
  //         const [starred, unstarred] = publicConstructions.value.partition(z => {
  //           return starredIds.some(s => s === z.publicDocId)
  //         });
  //         console.debug(`Construction Store: starred=${starred.length}, unstarred=${unstarred.length}`)
  //         starredConstructions.value = starred;
  //         publicConstructions.value = unstarred;
  //         }
  // })

  // constructionDocId !== null implies overwrite existing construction
  // constructionDocId === null implies create a new construction
  async function saveConstruction(
    constructionDocId: null | string,
    constructionDescription: string,
    saveAsPublic: boolean
  ): Promise<string> {
    // By the time doSave() is called, svgCanvas must have been set
    // to it is safe to non-null assert svgCanvas.value
    const svgRoot = svgCanvas.value!.querySelector("svg") as SVGElement;

    /* TODO: move the following constant to global-settings? */
    const FIELD_SIZE_LIMIT = 50 * 1024; /* in bytes */
    // A local function to convert a blob to base64 representation
    const toBase64 = (inputBlob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(inputBlob);
      });

    /* dump the command history */
    const scriptOut = Command.dumpOpcode();

    // TODO: should we decouple the zoomFactor from the rotation matrix when
    // saving a construction?. Possible issue: the construction
    // was saved by a user working on a larger screen (large zoomFactor),
    // but loaded by a user working on a smaller screen (small zoomFactor)

    const rotationMat = inverseTotalRotationMatrix.value;
    const userUid = appAuth.currentUser!.uid;
    // All constructions, regardless of private/public, are saved under the each user
    // subcollection. If a construction is made available to public, another document under
    // the top-level construction will be created
    const collectionPath = `users/${userUid}/constructions`;

    // Make a duplicate of the SVG tree
    const svgElement = svgRoot.cloneNode(true) as SVGElement;
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Remove the top-level transformation matrix
    // We have to save the preview in its "natural" pose
    svgElement.style.removeProperty("transform");

    const svgBlob = new Blob([svgElement.outerHTML], {
      type: "image/svg+xml;charset=utf-8"
    });
    const svgDataUrl = await toBase64(svgBlob);
    let previewData: string;

    if (isEarthMode.value) {
      // In earth mode, the preview has to capture both the
      // the earth ThreeJS and the unit sphere TwoJS layers
      // Our trick below is to draw both layers (in the correct order)
      // into an offline canvas and then convert to a data image
      const earthCanvas = document.getElementById("earth") as HTMLCanvasElement;
      previewData = await mergeIntoImageUrl(
        // Must be specified in the correct order, the first item
        // in the array will be drawn to the offline canvas first
        [earthCanvas.toDataURL(), svgDataUrl],
        canvasWidth.value,
        canvasHeight.value,
        "png"
      );
      // FileSaver.saveAs(previewData, "hans.png");
    } else {
      previewData = svgDataUrl;
    }

    /* Create a pipeline of Firebase tasks
         Task 1: Upload construction to Firestore
         Task 2: Upload the script to Firebase Storage (for large script)
         Task 3: Upload the SVG preview to Firebase Storage (for large SVG)
      */
    let saveTask: Promise<DocumentReference>;
    const constructionDetails: ConstructionInFirestore = {
      version: "1",
      dateCreated: new Date().toISOString(),
      author: userEmail.value!,
      description: constructionDescription,
      rotationMatrix: JSON.stringify(rotationMat.elements),
      tools: includedTools.value,
      aspectRatio: canvasWidth.value / canvasHeight.value,
      // Use an empty string (for type checking only)
      // the actual script will be determine below
      script: "",
      preview: "",
      // TODO: check this may have to be grabbed from the existing doc in #1a
      starCount: 0
    };

    // Task #1
    if (constructionDocId !== null) {
      const targetDoc = doc(
        appDB,
        collectionPath.concat("/" + constructionDocId)
      );
      // Task #1a: update the existing construction
      getDoc(targetDoc).then(ds => {
        if (ds.exists()) {
          constructionDetails.starCount = ds.data().starCount;
        }
      });
      saveTask = updateDoc(targetDoc, constructionDetails as any).then(
        () => targetDoc
      );
    } else {
      // Task #1b: save as a new construction
      saveTask = addDoc(collection(appDB, collectionPath), constructionDetails);
    }

    // try {
    return await saveTask
      .then((constructionDoc: DocumentReference) => {
        acctStore.constructionDocId = constructionDoc.id;
        /* Task #2 */
        const scriptPromise: Promise<string> =
          scriptOut.length < FIELD_SIZE_LIMIT
            ? Promise.resolve(scriptOut)
            : uploadString(
                storageRef(appStorage, `scripts/${constructionDoc.id}`),
                scriptOut
              ).then(t => getDownloadURL(t.ref));

        /* Task #3 */
        const svgPromise: Promise<string> =
          previewData.length < FIELD_SIZE_LIMIT
            ? Promise.resolve(previewData)
            : uploadString(
                storageRef(
                  appStorage,
                  `construction-svg/${constructionDoc.id}`
                ),
                previewData
              ).then(t => getDownloadURL(t.ref));

        /* Wrap the result from the three tasks as a new Promise */
        return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
      })
      .then(async ([docId, scriptData, svgData]) => {
        const constructionDoc = doc(appDB, collectionPath, docId);
        // Pass on the document ID to be included in the alert message
        if (saveAsPublic) {
          const publicConstructionDoc = await addDoc(
            collection(appDB, "/constructions/"),
            {
              author: userUid,
              constructionDocId: docId // construction document under the user sub-collection
            }
          );
          await updateDoc(constructionDoc, {
            script: scriptData,
            preview: svgData,
            publicDocId: publicConstructionDoc.id
          });
        } else {
          await updateDoc(constructionDoc, {
            script: scriptData,
            preview: svgData
          });
        }
        return docId;
      });
    // } catch (err) {
    //   return err as Error
    // }
  }

  async function loadPublicConstruction(
    docId: string
  ): Promise<ConstructionScript | null> {
    return await getDoc(doc(appDB, "constructions", docId))
      .then((ds: DocumentSnapshot) => {
        const { author, constructionDocId } =
          ds.data() as PublicConstructionInFirestore;
        return getDoc(
          doc(appDB, "users", author, "constructions", constructionDocId)
        );
      })
      .then(async (ds: DocumentSnapshot) => {
        if (ds.exists()) {
          const { script } = ds.data() as ConstructionInFirestore;
          // Check whether the script is inline or stored in Firebase storage
          if (script.startsWith("https:")) {
            // The script must be fetched from Firebase storage
            const constructionStorage = storageRef(appStorage, script);
            const scriptText = await getDownloadURL(constructionStorage)
              .then((url: string) => axios.get(url))
              .then((r: AxiosResponse) => r.data);
            return JSON.parse(scriptText) as ConstructionScript;
          } else {
            // The script is inline
            return JSON.parse(script) as ConstructionScript;
          }
        } else {
          return null;
        }
      });
  }

  async function parsePublicCollection(
    targetArr: Array<SphericalConstruction>
  ): Promise<void> {
    targetArr.splice(0);
    const erroneousDocs: Array<string> = [];
    const qs: QuerySnapshot = await getDocs(collection(appDB, "constructions"));

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

    const constructionArr: Array<SphericalConstruction> = await Promise.all(
      parseTasks
    );
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
    owner: string,
    targetArr: Array<SphericalConstruction>
  ): Promise<void> {
    const qs: QuerySnapshot = await getDocs(
      collection(appDB, "users", owner, "constructions")
    );

    const parseTask: Array<Promise<SphericalConstruction>> = qs.docs.map(
      (qd: QueryDocumentSnapshot) => {
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

    const constructionArray: Array<SphericalConstruction> = await Promise.all(
      parseTask
    );
    targetArr.splice(0);
    targetArr.push(
      ...constructionArray.filter(
        (s: SphericalConstruction) => s.parsedScript.length > 0
      )
    );
  }

  async function initialize() {
    // This function is invoked from App.vue
    appDB = getFirestore();
    appStorage = getStorage();
    appAuth = getAuth();

    await parsePublicCollection(allPublicConstructions);
    sortConstructionArray(allPublicConstructions);
    publicConstructions.value = allPublicConstructions.slice(0);
    // console.debug(`Public constructions ${publicConstructions.value.length}`);
  }

  async function deleteConstruction(
    uid: string,
    docId: string
  ): Promise<boolean> {
    const pos = privateConstructions.value.findIndex(
      (c: SphericalConstruction) => c.id === docId
    );
    if (pos < 0) return false;
    const victimDetails = privateConstructions.value[pos];
    // Delete script and preview if they are stored
    // on the Firebase Storage
    if (victimDetails.publicDocId) {
      await deleteDoc(doc(appDB, "constructions", victimDetails.publicDocId));
    }
    if (victimDetails.script.startsWith("https://")) {
      await deleteObject(storageRef(appStorage, `/scripts/${docId}`));
    }
    if (victimDetails.preview.startsWith("https://"))
      await deleteObject(storageRef(appStorage, `/construction-svg/${docId}`));
    await deleteDoc(doc(appDB, "users", uid, "constructions", docId));
    privateConstructions.value.splice(pos, 1);
    return true;
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
      privateConstructions.value[pos].publicDocId = undefined;
      return true;
    } else {
      return false;
    }
  }

  async function makePublic(docId: string): Promise<boolean> {
    const pos = privateConstructions.value.findIndex(s => s.id === docId);
    if (pos >= 0) {
      const pubConstruction = collection(appDB, "constructions");
      const publicDoc: PublicConstructionInFirestore = {
        author: firebaseUid.value!!,
        constructionDocId: docId
      };
      const q: DocumentReference = await addDoc(pubConstruction, publicDoc);
      const ownedDocRef = doc(
        appDB,
        "users",
        firebaseUid.value!!,
        "constructions",
        docId
      );

      await updateDoc(ownedDocRef, { publicDocId: q.id });
      privateConstructions.value[pos].publicDocId = q.id;
      return true;
    } else return false;
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

  async function updateStarCountInFirebase(
    pubConstructionId: string,
    byValue: number
  ) {
    const publicDocRef = doc(appDB, "constructions", pubConstructionId);
    const publicDS: DocumentSnapshot = await getDoc(publicDocRef);
    if (publicDS.exists()) {
      const publicDoc = publicDS.data() as PublicConstructionInFirestore;
      const ownedDocRef = doc(
        appDB,
        "users",
        publicDoc.author,
        "constructions",
        publicDoc.constructionDocId
      );
      const ownedDS: DocumentSnapshot = await getDoc(ownedDocRef);
      if (ownedDS.exists()) {
        const ownedDoc = ownedDS.data() as SphericalConstruction;
        if (ownedDoc.starCount + byValue >= 0) {
          // Avoid negative count (at least during development)
          await updateDoc(ownedDocRef, { starCount: increment(byValue) });
        } else {
          await updateDoc(ownedDocRef, { starCount: 0 });
        }
      }
    }
  }

  // Move a public construction to the starred list
  function starConstruction(pubConstructionId: string) {
    const pos = publicConstructions.value.findIndex(
      (z: SphericalConstruction) => z.publicDocId == pubConstructionId
    );
    if (pos >= 0) {
      publicConstructions.value[pos].starCount++;
      const inPublic = publicConstructions.value.splice(pos, 1);
      starredConstructions.value.push(...inPublic);
      starredConstructionIDs.value.push(...inPublic.map(z => z.publicDocId!))
      updateStarredArrayInFirebase(starredConstructionIDs.value);
      updateStarCountInFirebase(pubConstructionId, +1);
    }
  }

  function unstarConstruction(pubConstructionId: string) {
    const pos = starredConstructions.value.findIndex(
      (z: SphericalConstruction) => z.id == pubConstructionId
    );
    if (pos >= 0) {
      const target = starredConstructions.value[pos];
      if (target.starCount > 0) {
        starredConstructions.value[pos].starCount--;
      }
      const inStarred = starredConstructions.value.splice(pos, 1);
      publicConstructions.value.push(...inStarred);
    }
    const pos2 = starredConstructionIDs.value.findIndex(
      x => x === pubConstructionId
    );
    if (pos2 >= 0) {
      starredConstructionIDs.value.splice(pos2, 1);

      updateStarredArrayInFirebase(starredConstructionIDs.value);
      updateStarCountInFirebase(pubConstructionId, -1);
    }
  }

  return {
    /* state */
    currentConstructionPreview,
    privateConstructions,
    publicConstructions,
    starredConstructions,

    /* functions */
    deleteConstruction,
    initialize,
    loadPublicConstruction,
    makePrivate,
    makePublic,
    saveConstruction,
    starConstruction,
    unstarConstruction
  };
});

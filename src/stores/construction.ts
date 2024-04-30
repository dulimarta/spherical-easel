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
  DocumentChange
} from "firebase/firestore";
import axios, { AxiosResponse } from "axios";
import { Matrix4 } from "three";
import EventBus from "@/eventHandlers/EventBus";
// import { storeToRefs } from "pinia";
// import { useAccountStore } from "@/stores/account";
import { computed } from "vue";
// import { ComputedRef } from "vue";
// import { useAccountStore } from "@/stor  es/account";
// import { storeToRefs } from "pinia";
// const acctStore = useAccountStore();
// const userEmail = computed((): string => {
//   return appAuth.currentUser?.email ?? "";
// });
let appAuth: Auth
let appStorage: FirebaseStorage
let appDB: Firestore
let snapShotUnsubscribe: Unsubscribe | null = null;
// Private constructions is set to null when no authenticated user is active

function isPublicConstruction(docId: string): boolean {
  // const pos = publicConstructions.value.findIndex(
  //   (c: SphericalConstruction) => c.id === docId
  // );
  // return pos >= 0;
  return false;
}

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

function parseCollection(
  constructionCollection: CollectionReference,
  targetArr: Array<SphericalConstruction>
): void {
  targetArr.splice(0);

  const erroneousDocs: Array<string> = [];
  getDocs(constructionCollection)
    .then((qs: QuerySnapshot) => {
      qs.forEach(async (qd: QueryDocumentSnapshot) => {
        const remoteData = qd.data();
        let out: SphericalConstruction | null = null;
        // In a new format defined by Capstone group Fall 2022
        // public constructions are simply a reference to
        // constructions owned by a particular user
        const constructionRef = remoteData as PublicConstructionInFirestore;
        const ownedDocRef = doc(
          appDB,
          "users",
          constructionRef.author,
          "constructions",
          constructionRef.constructionDocId
        );
        const ownedDoc = await getDoc(ownedDocRef);
        out = await parseDocument(
          constructionRef.constructionDocId,
          ownedDoc.data() as ConstructionInFirestore
        );
        if (out.parsedScript.length > 0) targetArr.push(out);
        else {
          console.warn(
            `Construction ${constructionCollection.path}.${qd.id} contains no script`
          );
          erroneousDocs.push(qd.id);
        }
      });
    })
    .finally(() => {
      // Sort by creation date
      targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
        a.dateCreated.localeCompare(b.dateCreated)
      );
      if (erroneousDocs.length > 0) {
        EventBus.fire("show-alert", {
          key: "Missing scripts in documents: " + erroneousDocs.join(","),
          type: "error"
        });
      }
    });
}

// async function updateStarred(constructionId: string): Promise<boolean> {
//   if (!appAuth.currentUser || !appAuth.currentUser.uid) {
//     throw new Error("User is not authenticated or UID is missing");
//   }

//   const uid = appAuth.currentUser.uid;

//   try {
//     const userDocRef = doc(appDB, "users", uid); //user's document
//     const userDoc = await getDoc(userDocRef);

//     if (userDoc.exists()) {
//       const userData = userDoc.data();
//       let userStarredConstructions: Array<string> = userData.userStarredConstructions ? userData.userStarredConstructions : [];

//       // Fetch the construction document
//       const constructionDocRef = doc(appDB, "constructions", constructionId);
//       const constructionDocSnap = await getDoc(constructionDocRef);

//       if (constructionDocSnap.exists()) {
//         const constructionData = constructionDocSnap.data();
//         const constructionDocId = constructionData.constructionDocId;

//         const index = userStarredConstructions.indexOf(constructionDocId);
//         if (index !== -1) {
//           // If construction is already starred, unstar it
//           userStarredConstructions.splice(index, 1);
//         } else {
//           // If construction is not starred, star it
//           userStarredConstructions.push(constructionDocId);
//         }

//         // Update the userStarredConstructions in Firestore
//         await updateDoc(userDocRef, {
//           userStarredConstructions: userStarredConstructions
//         });

//         return true; // Return true for successful update
//       } else {
//         console.log("Construction document does not exist.");
//         return false; // Return false if construction document does not exist
//       }
//     } else {
//       console.log("User document does not exist.");
//       return false; // Return false if user document does not exist
//     }
//   } catch (error) {
//     console.error("Error updating starred status:", error);
//     return false; // Return false for any errors
//   }
// }

// Function to star a construction

// Function to unstar a construction

function useConstruction() {
  onMounted(() => {

    appAuth.onAuthStateChanged((u: User | null) => {
      // Unregister previous snapshot listener (if exists)
      if (snapShotUnsubscribe !== null) snapShotUnsubscribe();
      // if (u !== null) {
      //   const privateColl = collection(appDB, "users", u.uid, "constructions");
      //   if (privateConstructions.value === null)
      //     privateConstructions.value = []; // Create a new empty array
      //   snapShotUnsubscribe = onSnapshot(
      //     privateColl,
      //     (snapshot: QuerySnapshot) => {
      //       snapshot.docChanges().forEach(async (chg: DocumentChange) => {
      //         const aDoc = chg.doc.data() as ConstructionInFirestore;
      //         switch (chg.type) {
      //           case "added":
      //             const sph = await parseDocument(chg.doc.id, aDoc);
      //             privateConstructions.value?.push(sph);
      //             break;
      //           case "removed":
      //             if (privateConstructions.value) {
      //               const pos = privateConstructions.value?.findIndex(
      //                 (c: SphericalConstruction) => c.id === chg.doc.id
      //               );
      //               if (pos >= 0) privateConstructions.value?.splice(pos, 1);
      //             }
      //             break;
      //           case "modified":
      //             if (privateConstructions.value) {
      //               const pos = privateConstructions.value?.findIndex(
      //                 (c: SphericalConstruction) => c.id === chg.doc.id
      //               );
      //               const sph = await parseDocument(chg.doc.id, aDoc);
      //               if (pos >= 0)
      //                 privateConstructions.value?.splice(pos, 1, sph);
      //             }
      //             break;
      //         }
      //       });
      //     }
      //   );
      // } else {
      //   privateConstructions.value = null;
      // }
    });
    // TODO: finish public construction listener
    /**
    const publicSnapshot = onSnapshot(
      publicColl,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach(async (chg: DocumentChange) => {
          const aDoc = chg.doc.data() as ConstructionInFirestore;
          switch (chg.type) {
            case "added":
              const sph = await parseDocument(chg.doc.id, aDoc);
              publicConstructions.value?.push(sph);
              break;
            case "removed":
              if (publicConstructions.value) {
                const pos = publicConstructions.value?.findIndex(
                  (c: SphericalConstruction) => c.id === aDoc.publicDocId
                );
                if (pos >= 0) publicConstructions.value?.splice(pos, 1);
              }
              break;
            case "modified":
              if (publicConstructions.value) {
                const pos = publicConstructions.value?.findIndex(
                  (c: SphericalConstruction) => c.id === chg.doc.id
                );
                const sph = await parseDocument(chg.doc.id, aDoc);
                if (pos >= 0)
                  publicConstructions.value?.splice(pos, 1, sph);
              }
              break;
          }
        });
      }
    );
     */
  });
  // const acctStore = useAccountStore();
  // const { constructionDocId } = storeToRefs(acctStore);
  // const currentConstructionPreview: ComputedRef<string | null> = computed(
  //   () => {
  //     let pos = -1;
  //     if (privateConstructions.value !== null) {
  //       pos = privateConstructions.value.findIndex(
  //         (sc: SphericalConstruction) => sc.id === constructionDocId.value
  //       );
  //       if (pos >= 0) {
  //         return privateConstructions.value[pos].preview;
  //       }
  //     }
  //     if (publicConstructions.value !== null) {
  //       pos = publicConstructions.value.findIndex(
  //         (sc: SphericalConstruction) => sc.id === constructionDocId.value
  //       );
  //       if (pos >= 0) {
  //         return publicConstructions.value[pos].preview;
  //       }
  //     }
  //     return null;
  //   }
  // );
  return {
    // publicConstructions,
    // privateConstructions,
    // starredConstructions,
    // deleteConstruction,
    // starConstruction,
    // unstarConstruction,
    // makePrivate,
    // currentConstructionPreview,
    isPublicConstruction
  };
}

export const useConstructionStore = defineStore("construction", () => {
  const publicConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  const privateConstructions: Ref<Array<SphericalConstruction>> = ref([]);
  // Public constructions is never null
  const starredConstructions: Ref<Array<SphericalConstruction>> = ref([]);
const currentConstructionPreview: Ref<string|null> = ref(null)
  function initialize() {
    appAuth = getAuth();
    appDB = getFirestore();
    appStorage = getStorage();

    const publicColl = collection(appDB, "constructions");
    parseCollection(publicColl, publicConstructions.value);
    console.debug(`Public constructions ${publicConstructions.value.length}`)
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
    try {
      const user = appAuth.currentUser;

      if (!user) {
        console.error("User is not logged in.");
        return false; // User is not authenticated
      }

      const docRef = doc(appDB, "constructions", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await deleteDoc(docRef);
        return true; // Deletion successful
      } else {
        // Document with given docId not found
        return false;
      }
    } catch (error) {
      console.error("Error deleting construction:", error);
      return false; // Deletion failed
    }
  }

  async function starConstruction(constructionId: string): Promise<boolean> {
    if (!appAuth.currentUser || !appAuth.currentUser.uid) {
      throw new Error("User is not authenticated or UID is missing");
    }

    const uid = appAuth.currentUser.uid;

    try {
      const userDocRef = doc(appDB, "users", uid); // User's document
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        let userStarredConstructions: Array<string> =
          userData.userStarredConstructions
            ? userData.userStarredConstructions
            : [];

        // Fetch the construction document
        const constructionDocRef = doc(appDB, "constructions", constructionId);
        const constructionDocSnap = await getDoc(constructionDocRef);

        if (constructionDocSnap.exists()) {
          const constructionData = constructionDocSnap.data();
          const constructionDocId = constructionData.constructionDocId;

          if (!userStarredConstructions.includes(constructionDocId)) {
            // Add constructionDocId to the list of starred constructions
            userStarredConstructions.push(constructionDocId);

            // Update the userStarredConstructions in Firestore
            await updateDoc(userDocRef, {
              userStarredConstructions: userStarredConstructions
            });

            return true; // Return true for successful update
          } else {
            console.log("Construction is already starred.");
            return false; // Return false if construction is already starred
          }
        } else {
          console.log("Construction document does not exist.");
          return false; // Return false if construction document does not exist
        }
      } else {
        console.log("User document does not exist.");
        return false; // Return false if user document does not exist
      }
    } catch (error) {
      console.error("Error starring construction:", error);
      return false; // Return false for any errors
    }
  }

  async function unstarConstruction(
    constructionDocId: string
  ): Promise<boolean> {
    if (!appAuth.currentUser || !appAuth.currentUser.uid) {
      throw new Error("User is not authenticated or UID is missing");
    }

    const uid = appAuth.currentUser.uid;

    try {
      const userDocRef = doc(appDB, "users", uid); // User's document
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        let userStarredConstructions: Array<string> =
          userData.userStarredConstructions
            ? userData.userStarredConstructions
            : [];

        const index = userStarredConstructions.indexOf(constructionDocId);
        if (index !== -1) {
          // If construction is starred, unstar it
          userStarredConstructions.splice(index, 1);

          // Update the userStarredConstructions in Firestore
          await updateDoc(userDocRef, {
            userStarredConstructions: userStarredConstructions
          });

          return true; // Return true for successful update
        } else {
          console.log("Construction is not starred.");
          return false; // Return false if construction is not starred
        }
      } else {
        console.log("User document does not exist.");
        return false; // Return false if user document does not exist
      }
    } catch (error) {
      console.error("Error unstarring construction:", error);
      return false; // Return false for any errors
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
    starConstruction,
    unstarConstruction
  };
});

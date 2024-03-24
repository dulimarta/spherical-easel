import { Ref, ref } from "vue";
import { defineStore } from "pinia";
import {
  // AccountState,
  ActionMode,
  ToolButtonGroup,
  ToolButtonType,
  ConstructionInFirestore
} from "@/types";
import { toolGroups } from "@/components/toolgroups";
import { computed } from "vue";
import {
  doc,
  getFirestore,
  getDoc,
  addDoc,
  collection,
  DocumentSnapshot,
  DocumentReference,
  updateDoc
} from "firebase/firestore";

// Declare helper functions OUTSIDE the store definition
function insertAscending(newItem: string, arr: string[]): void {
  let k = 0;
  while (k < arr.length && newItem > arr[k]) k++;
  if (k == arr.length) arr.push(newItem);
  // append to the end of the array
  else arr.splice(k, 0, newItem); // insert in the middle somewhere
}

const DEFAULT_TOOL_NAMES: Array<Array<ActionMode>> = [[], []];

// defineStore("hans", (): => {});
export const useAccountStore = defineStore("acct", () => {
  //state: (): AccountState => ({
  const loginEnabled = ref(false); // true when the secret key combination is detected
  const temporaryProfilePicture = ref("");
  const userDisplayedName: Ref<string | undefined> = ref(undefined);
  const userEmail: Ref<string | undefined> = ref(undefined);
  const firebaseUid: Ref<string | undefined> = ref(undefined);
  const userProfilePictureURL: Ref<string | undefined> = ref(undefined);
  const userRole: Ref<string | undefined> = ref(undefined);
  /** @type { ActionMode[]} */
  const includedTools: Ref<ActionMode[]> = ref([]);
  const excludedTools: Ref<ActionMode[]> = ref([]);
  const favoriteTools: Ref<Array<Array<ActionMode>>> = ref(DEFAULT_TOOL_NAMES);
  const constructionDocId: Ref<string | null> = ref(null);
  const constructionSaved = ref(false);
  const appDB = getFirestore();

  const hasUnsavedWork = computed((): boolean => false);

  function resetToolset(includeAll = true): void {
    includedTools.value.splice(0);
    excludedTools.value.splice(0);
    const toolNames = toolGroups
      .flatMap((g: ToolButtonGroup) => g.children)
      .map((t: ToolButtonType) => t.action);
    if (includeAll) {
      includedTools.value.push(...toolNames);
    } else {
      excludedTools.value.push(...toolNames);
    }
  }
  function includeToolName(name: ActionMode): void {
    const pos = excludedTools.value.findIndex((tool: string) => tool === name);
    if (pos >= 0) {
      insertAscending(name, includedTools.value);
      excludedTools.value.splice(pos, 1);
    }
  }
  function excludeToolName(name: ActionMode): void {
    const pos = includedTools.value.findIndex((tool: string) => tool === name);
    if (pos >= 0) {
      insertAscending(name, excludedTools.value);
      includedTools.value.splice(pos, 1);
    }
  }
  function parseAndSetFavoriteTools(favTools: string) {
    if (favTools.trim().length > 0) {
      favoriteTools.value = favTools
        .split("#")
        .map(
          (fav: string) => fav.split(",").map(s => s.trim()) as ActionMode[]
        );
      if (favoriteTools.value.length !== 2)
        favoriteTools.value = DEFAULT_TOOL_NAMES;
    } else favoriteTools.value = DEFAULT_TOOL_NAMES;
    }
  async function saveCopiedStarredConstruction(docId: String, userUid: String): Promise<void> {
    //if (svgRoot === undefined) {
    //    // By the time doSave() is called, svgCanvas must have been set
    //    // to it is safe to non-null assert svgCanvas.value
    //    svgRoot = svgCanvas.value!.querySelector("svg") as SVGElement;
    //}

    ///* TODO: move the following constant to global-settings? */
    //const FIELD_SIZE_LIMIT = 50 * 1024; /* in bytes */
    //// A local function to convert a blob to base64 representation
    //const toBase64 = (inputBlob: Blob): Promise<string> =>
    //    new Promise((resolve, reject) => {
    //        const reader = new FileReader();
    //        reader.onerror = reject;
    //        reader.onload = () => {
    //            resolve(reader.result as string);
    //        };
    //        reader.readAsDataURL(inputBlob);
    //    });

    ///* dump the command history */
    //const scriptOut = Command.dumpOpcode();

    //// TODO: should we decouple the zoomFactor from the rotation matrix when
    //// saving a construction?. Possible issue: the construction
    //// was saved by a user working on a larger screen (large zoomFactor),
    //// but loaded by a user working on a smaller screen (small zoomFactor)

    //const rotationMat = inverseTotalRotationMatrix;
    //// All constructions, regardless of private/public, are saved under the each user
    //// subcollection. If a construction is made available to public, another document under
    //// the top-level construction will be created
    //const collectionPath = `users/${userUid}/constructions`;

    //// Make a duplicate of the SVG tree
    //const svgElement = svgRoot.cloneNode(true) as SVGElement;
    //svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    //// Remove the top-level transformation matrix
    //// We have to save the preview in its "natural" pose
    //svgElement.style.removeProperty("transform");

    //const svgBlob = new Blob([svgElement.outerHTML], {
    //    type: "image/svg+xml;charset=utf-8"
    //});
    //const svgDataUrl = await toBase64(svgBlob);
    let previewData: string;

    //if (isEarthMode.value) {
    //    // In earth mode, the preview has to capture both the
    //    // the earth ThreeJS and the unit sphere TwoJS layers
    //    // Our trick below is to draw both layers (in the correct order)
    //    // into an offline canvas and then convert to a data image
    //    const earthCanvas = document.getElementById("earth") as HTMLCanvasElement;
    //    previewData = await mergeIntoImageUrl(
    //        // Must be specified in the correct order, the first item
    //        // in the array will be drawn to the offline canvas first
    //        [earthCanvas.toDataURL(), svgDataUrl],
    //        canvasWidth.value,
    //        canvasHeight.value,
    //        "png"
    //    );
    //    // FileSaver.saveAs(previewData, "hans.png");
    //} else {
    //    previewData = svgDataUrl;
    //}

    /* Create a pipeline of Firebase tasks
            Task 1: Upload construction to Firestore
            Task 2: Upload the script to Firebase Storage (for large script)
            Task 3: Upload the SVG preview to Firebase Storage (for large SVG)
        */
    let saveTask: Promise<DocumentReference>;
    const data: DocumentData = await getDoc(doc(appDB, "constructions", { docId } ));
    //{
    //    version: "1",
    //    dateCreated: new Date().toISOString(),
    //    author: userEmail.value!,
    //    description: constructionDescription.value,
    //    rotationMatrix: JSON.stringify(rotationMat.value.elements),
    //    tools: includedTools.value,
    //    aspectRatio: canvasWidth.value / canvasHeight.value,
    //    // Use an empty string (for type checking only)
    //    // the actual script will be determine below
    //    script: "",
    //    preview: "",
    //    // TODO: check this may have to be grabbed from the existing doc in #1a
    //    starCount: 0
    //};

    // Task #1
    if (shouldSaveOverwrite.value) {
        const targetDoc = doc(
            appDB,
            collectionPath.concat("/" + constructionDocId.value)
        );
        // Task #1a: update the existing construction
        saveTask = updateDoc(targetDoc, constructionDetails as any).then(
            () => targetDoc
        );
    } else {
        // Task #1b: save as a new construction
        saveTask = addDoc(collection(appDB, collectionPath), constructionDetails);
    }

    saveTask
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
                        storageRef(appStorage, `construction-svg/${constructionDoc.id}`),
                        previewData
                    ).then(t => getDownloadURL(t.ref));

            /* Wrap the result from the three tasks as a new Promise */
            return Promise.all([constructionDoc.id, scriptPromise, svgPromise]);
        })
        .then(async ([docId, scriptData, svgData]) => {
            const constructionDoc = doc(appDB, collectionPath, docId);
            // Pass on the document ID to be included in the alert message
            if (isSavedAsPublicConstruction.value) {
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
        })
        .then((docId: string) => {
            EventBus.fire("show-alert", {
                key: "constructions.firestoreConstructionSaved",
                keyOptions: { docId },
                type: "info"
            });
            seStore.clearUnsavedFlag();
        })
        .catch((err: Error) => {
            console.error("Can't save document", err.message);
            EventBus.fire("show-alert", {
                key: t("construction.firestoreSaveError", { error: err }),
                keyOptions: { error: err },
                type: "error"
            });
        });

//    saveConstructionDialog.value?.hide();
}

  return {
    userRole,
    userEmail,
    firebaseUid,
    userDisplayedName,
    loginEnabled,
    userProfilePictureURL,
    temporaryProfilePicture,
    constructionDocId,
    favoriteTools,
    includedTools,
    includeToolName,
    excludeToolName,
    resetToolset,
    parseAndSetFavoriteTools,
    //saveCopiedStarredConstruction
  };
});

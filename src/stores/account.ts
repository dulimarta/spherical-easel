import { Ref, ref } from "vue";
import { defineStore } from "pinia";
import {
  // AccountState,
  ActionMode,
  ToolButtonGroup,
  ToolButtonType
} from "@/types";
import { toolGroups } from "@/components/toolgroups";
import { DocumentSnapshot, doc, getDoc, getFirestore } from 'firebase/firestore';
import { UserProfile } from '@/types';

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
  const appDB = getFirestore()
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
  const userStarredConstructions: Ref<string[]> = ref([])
  const favoriteTools: Ref<Array<Array<ActionMode>>> = ref(DEFAULT_TOOL_NAMES);
  const constructionDocId: Ref<string | null> = ref(null);
  // const constructionSaved = ref(false);
  // const hasUnsavedWork = computed((): boolean => false);

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

  function parseUserProfile(uid: string) {
    firebaseUid.value = uid
    getDoc(doc(appDB, "users", uid)).then((ds: DocumentSnapshot) => {
      if (ds?.exists()) {
        const uProfile = ds.data() as UserProfile;
        // console.debug("User Profile Details from Firestore", uProfile);
        const { favoriteTools, displayName, profilePictureURL } = uProfile;
        if (userDisplayedName.value === undefined)
          userDisplayedName.value = displayName
        if (userProfilePictureURL.value === undefined)
          userProfilePictureURL.value = profilePictureURL
        userStarredConstructions.value = uProfile.userStarredConstructions ?? []
        parseAndSetFavoriteTools(favoriteTools ?? "#")
      }
    });
  }
  // async function fetchUserProfile(uid: string) {
  //   const userDocRef = doc(appDB, 'users', uid); // Use the Firestore instance here
  //   const userDocSnap = await getDoc(userDocRef);
  //   if (userDocSnap.exists()) {
  //     userProfile.value = userDocSnap.data();
  //   } else {
  //     console.log("No such user profile!");
  //   }

  // }

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
    userStarredConstructions,
    parseUserProfile,
    // fetchUserProfile
  };
});

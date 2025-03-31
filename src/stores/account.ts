import { Ref, ref } from "vue";
import { defineStore } from "pinia";
import {
  // AccountState,
  ActionMode,
  ToolButtonGroup,
  ToolButtonType
} from "@/types";
import { toolGroups } from "@/components/toolgroups";
import {
  DocumentSnapshot,
  doc,
  getDoc,
  getFirestore
} from "firebase/firestore";
import { UserProfile } from "@/types";
import {
  GoogleAuthProvider,
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "firebase/auth";

// Declare helper functions OUTSIDE the store definition

/**
 * @desc insert a string into an array of strings in ascending alphabetical
 *       order.
 *
 * @param newItem item to insert
 * @param arr list to insert into
 */
function insertAscending(newItem: string, arr: string[]): void {
  let k = 0;
  while (k < arr.length && newItem > arr[k]) k++;
  if (k == arr.length) arr.push(newItem);
  // append to the end of the array
  else arr.splice(k, 0, newItem); // insert in the middle somewhere
}

const DEFAULT_TOOL_NAMES: Array<Array<ActionMode>> = [[], []];

export const useAccountStore = defineStore("acct", () => {
  const appDB = getFirestore();
  const appAuth = getAuth();
  const loginEnabled = ref(false); // true when the secret key combination is detected
  const temporaryProfilePicture = ref("");
  const userDisplayedName: Ref<string | undefined> = ref(undefined);
  const userEmail: Ref<string | undefined> = ref(undefined);
  const firebaseUid: Ref<string | undefined> = ref(undefined);
  const userProfilePictureURL: Ref<string | undefined> = ref(undefined);
  const userRole: Ref<string | undefined> = ref(undefined);
  const starredConstructionIDs: Ref<Array<string>> = ref([]);
  /** @type { ActionMode[]} */
  const includedTools: Ref<ActionMode[]> = ref([]);
  const excludedTools: Ref<ActionMode[]> = ref([]);
  const favoriteTools: Ref<Array<Array<ActionMode>>> = ref(DEFAULT_TOOL_NAMES);
  const constructionDocId: Ref<string | null> = ref(null);

  appAuth.onAuthStateChanged(async (u: User | null) => {
    if (u) {
      firebaseUid.value = u.uid;
      loginEnabled.value = true;
      await parseUserProfile(u);
      if (u.email && !userEmail.value) userEmail.value = u.email;
      if (u.displayName && !userDisplayedName.value)
        userDisplayedName.value = u.displayName;
    } else {
      firebaseUid.value = undefined;
    }
  });

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

  async function parseUserProfile(u: User): Promise<void> {
    firebaseUid.value = u.uid;
    await getDoc(doc(appDB, "users", u.uid)).then((ds: DocumentSnapshot) => {
      if (ds?.exists()) {
        const uProfile = ds.data() as UserProfile;
        const {
          favoriteTools,
          displayName,
          profilePictureURL,
          role,
          userStarredConstructions
        } = uProfile;
        if (userDisplayedName.value === undefined)
          userDisplayedName.value = displayName;
        if (userProfilePictureURL.value === undefined)
          userProfilePictureURL.value = profilePictureURL;
        if (role) userRole.value = role.toLowerCase();
        if (userStarredConstructions) {
          console.debug(
            `User ${displayName} (${u.uid}) has starred constructions`,
            userStarredConstructions
          );
          starredConstructionIDs.value = userStarredConstructions;
        }
        parseAndSetFavoriteTools(favoriteTools ?? "#");
      } else {
        console.debug("Initialize user profile with login provider data?");
        userDisplayedName.value = u.displayName ?? undefined;
        userProfilePictureURL.value = u.photoURL ?? undefined;
      }
    });
  }

  async function signIn(
    email: string,
    password: string
  ): Promise<boolean | string> {
    try {
      const credential: UserCredential = await signInWithEmailAndPassword(
        appAuth,
        email,
        password
      );
      if (credential.user?.emailVerified) {
        console.debug("User email is verified");
        parseUserProfile(credential.user);
        userEmail.value = email;
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return error as string;
    }
  }

  async function signUp(
    email: string,
    password: string
  ): Promise<boolean | string> {
    try {
      const credential: UserCredential = await createUserWithEmailAndPassword(
        appAuth,
        email,
        password
      );
      sendEmailVerification(credential.user);
      userEmail.value = email;
      return true;
    } catch (error: any) {
      return error;
    }
  }

  async function signOff(): Promise<void> {
    starredConstructionIDs.value.splice(0);
    userEmail.value = undefined;
    userDisplayedName.value = undefined;
    favoriteTools.value = [];
    await signOut(appAuth);
  }

  async function passwordReset(email: string) {
    await sendPasswordResetEmail(appAuth, email);
  }

  async function googleLogin(): Promise<string | null> {
    const provider = new GoogleAuthProvider();
    // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
      const cred = await signInWithPopup(appAuth, provider);
      parseUserProfile(cred.user);
      userEmail.value = cred.user.email!!;
      return null;
    } catch (error: any) {
      return error;
    }
  }

  return {
    /* state */
    constructionDocId,
    favoriteTools,
    firebaseUid,
    includedTools,
    loginEnabled,
    starredConstructionIDs,
    temporaryProfilePicture,
    userDisplayedName,
    userEmail,
    userProfilePictureURL,
    userRole,

    /* functions */
    excludeToolName,
    googleLogin,
    includeToolName,
    parseAndSetFavoriteTools,
    parseUserProfile,
    passwordReset,
    resetToolset,
    signIn,
    signOff,
    signUp
  };
});

<template>
  <template v-if="loginEnabled">
    {{ userDisplayedName }} {{ userEmail }}
    <v-avatar
      v-if="userProfilePictureURL !== undefined"
      contain
      max-width="48"
      :image="userProfilePictureURL"
      @click="doLoginOrLogout"></v-avatar>
    <v-btn
      v-else
      icon
      size="x-small"
      class="bg-yellow"
      @click="doLoginOrLogout">
      <v-icon>mdi-account</v-icon>
    </v-btn>
    <template v-if="appAuth.currentUser !== null">
      <v-icon>mdi-share</v-icon>
      <v-icon>mdi-content-save</v-icon>
      <v-icon>mdi-file-export</v-icon>
    </template>
  </template>
</template>
<script setup lang="ts">
import { Ref, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/account";
import { onKeyDown } from "@vueuse/core";
import { getAuth, Unsubscribe, User } from "firebase/auth";
import {
  doc,
  getFirestore,
  getDoc,
  DocumentSnapshot
} from "firebase/firestore";
import { useRouter } from "vue-router";
import { onMounted } from "vue";
import { onBeforeUnmount } from "vue";
enum SecretKeyState {
  NONE,
  ACCEPT_S,
  COMPLETE
}
const acctStore = useAccountStore();
const { loginEnabled, userProfilePictureURL, userDisplayedName, userEmail } = storeToRefs(acctStore);
const state: Ref<SecretKeyState> = ref(SecretKeyState.NONE);
const appAuth = getAuth();
const appDB = getFirestore();
const router = useRouter();
let authSubscription: Unsubscribe | null = null;

onKeyDown(
  true,
  (event: KeyboardEvent) => {
    loginEnabled.value = false;
    if (!event.ctrlKey || !event.altKey) {
      state.value = SecretKeyState.NONE;
      return false;
    }
    if (event.code === "KeyS" && state.value === SecretKeyState.NONE) {
      state.value = SecretKeyState.ACCEPT_S;
      event.preventDefault();
    } else if (
      event.code === "KeyE" &&
      state.value === SecretKeyState.ACCEPT_S
    ) {
      state.value = SecretKeyState.COMPLETE;
      loginEnabled.value = true;
      event.preventDefault();
    } else {
      state.value = SecretKeyState.NONE;
      event.preventDefault();
    }
  },
  { dedupe: true }
);

onMounted(() => {
  authSubscription = appAuth.onAuthStateChanged((u: User | null) => {
    if (u !== null) {
      // showExport.value = true;
      acctStore.userEmail = u.email ?? "unknown email";
      acctStore.userProfilePictureURL = u.photoURL ?? undefined;
      // uid.value = u.uid;
      console.debug("User details", u);
      const userDoc = doc(appDB, "users", u.uid);
      getDoc(userDoc).then((ds: DocumentSnapshot) => {
        if (ds.exists()) {
          // accountEnabled.value = true;
          console.debug("User data", ds.data());
          const { profilePictureURL, role } = ds.data() as any;
          if (profilePictureURL && userProfilePictureURL.value === undefined) {
            acctStore.userProfilePictureURL = profilePictureURL;
          }
          if (role) {
            acctStore.userRole = role.toLowerCase();
          }
        }
      });
    } else {
      acctStore.userEmail = undefined;
      acctStore.userProfilePictureURL = undefined;
    }
  });
});

onBeforeUnmount(() => {
  if (authSubscription) {
    authSubscription();
    authSubscription = null;
  }
});
async function doLoginOrLogout() {
  if (appAuth.currentUser !== null) {
    await appAuth.signOut();
    acctStore.userEmail = undefined;
    acctStore.userProfilePictureURL = undefined;
    acctStore.userDisplayedName = undefined
  } else {
    router.replace({ path: "/account" });
  }
}
</script>

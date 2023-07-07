<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="5">
        <v-sheet elevation="4" class="pa-4">
          <v-form v-model="validEntries">
            <v-row class="flex-column mb-2">
              <v-col cols="auto">
                <v-text-field
                  label="UserId/Email"
                  v-model="userEmail"
                  :rules="emailRules"
                  required
                  prepend-icon="mdi-account"></v-text-field>
              </v-col>
              <v-col cols="auto">
                <v-text-field
                  label="Password"
                  v-model="userPassword"
                  type="password"
                  :rules="passwordRules"
                  prepend-icon="mdi-lock"></v-text-field>
              </v-col>
              <v-col cols="auto">
                <v-row>
                  <v-col cols="auto">
                    <v-btn @click="doSignup" :disabled="!validEntries">
                      Signup
                    </v-btn>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn :disabled="!isValidEmail" @click="doReset">
                      Reset Password
                    </v-btn>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn
                      color="primary"
                      @click="doSignIn"
                      :disabled="!validEntries">
                      Signin
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-divider />
            <v-row>
              <v-col cols="auto">or use other account providers</v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-btn @click="doGoogleLogin">
                  <v-icon left>mdi-google</v-icon>
                  Google
                </v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn disabled>
                  <v-icon left>mdi-yahoo</v-icon>
                  Yahoo
                </v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn disabled>
                  <v-icon left>mdi-facebook</v-icon>
                  Facebook
                </v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn disabled>
                  <v-icon left>mdi-twitter</v-icon>
                  Twitter
                </v-btn>
              </v-col>
              <v-col cols="4">
                <v-btn disabled>
                  <v-icon left>mdi-github</v-icon>
                  GitHub
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
// @ is an alias to /src
import {
  UserCredential,
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  GoogleAuthProvider
} from "firebase/auth";
import EventBus from "@/eventHandlers/EventBus";
import { useAccountStore } from "@/stores/account";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  getDoc,
  getFirestore,
  doc,
  DocumentSnapshot
} from "firebase/firestore";
import { UserProfile } from "@/types";
import { storeToRefs } from "pinia";

const appAuth = getAuth();
const appDB = getFirestore();
const router = useRouter();
const acctStore = useAccountStore();
const userEmail = ref("");
const userPassword = ref("");
const {userDisplayedName, userProfilePictureURL } = storeToRefs(acctStore)
const emailRules = [
  (s: string | undefined): boolean | string => {
    if (!s) return false;
    /* should  be neither undefined nor null */ else if (s.indexOf("@") > 0)
      return true;
    else return "Missing '@'?";
  }
];

const passwordRules = [
  (s: string | undefined): boolean | string => {
    if (!s) return false;
    else return s.length >= 6 ? true : "Password must be at least 6 characters";
  }
];

const validEntries = ref(false);

const isValidEmail = computed((): boolean => {
  return emailRules
    .map(fn => fn(userEmail.value))
    .every(s => typeof s === "boolean" && s);
});

function doSignup(): void {
  createUserWithEmailAndPassword(appAuth, userEmail.value, userPassword.value)
    .then((cred: UserCredential) => {
      sendEmailVerification(cred.user);
      EventBus.fire("show-alert", {
        key: "account.emailVerification",
        keyOptions: { emailAddr: cred.user?.email },
        type: "info"
      });
    })
    .catch((error: any) => {
      EventBus.fire("show-alert", {
        key: "account.createError",
        keyOptions: { error },
        type: "error"
      });
    });
}

function parseUserProfile(uid: string) {
  getDoc(doc(appDB, "users", uid)).then((ds: DocumentSnapshot) => {
    if (ds?.exists()) {
      const uProfile = ds.data() as UserProfile;
      console.debug("User Profile Details from Firestore", uProfile);
      const { favoriteTools, displayName, profilePictureURL } = uProfile;
      if (userDisplayedName.value === undefined)
        acctStore.userDisplayedName = displayName
      if (userProfilePictureURL.value === undefined)
        acctStore.userProfilePictureURL = profilePictureURL
      acctStore.parseAndSetFavoriteTools(favoriteTools ?? "#")
    }
  });
}

function doSignIn(): void {
  signInWithEmailAndPassword(appAuth, userEmail.value, userPassword.value)
    .then((cred: UserCredential) => {
      if (cred.user?.emailVerified) {
        parseUserProfile(cred.user.uid);
        router.replace({
          path: "/"
        });
      } else {
        EventBus.fire("show-alert", {
          key: "account.emailNotVerified",
          keyOptions: undefined,
          type: "warning"
        });
      }
    })
    .catch((error: any) => {
      EventBus.fire("show-alert", {
        key: "account.loginError",
        keyOptions: { error },
        type: "error"
      });
    });
}

function doReset(): void {
  console.debug("Sending password reset email to", userEmail.value);
  sendPasswordResetEmail(appAuth, userEmail.value).then(() => {
    EventBus.fire("show-alert", {
      key: "account.passwordReset",
      keyOptions: { emailAddr: userEmail.value },
      type: "info"
    });
  });
}

function doGoogleLogin(): void {
  const provider = new GoogleAuthProvider();
  // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  signInWithPopup(appAuth, provider)
    .then((cred: UserCredential) => {
      parseUserProfile(cred.user.uid);
      router.replace({
        path: "/"
      });
    })
    .catch((error: any) => {
      console.debug("Error attempting to login with Google account", error);
      EventBus.fire("show-alert", {
        key: "account.loginError",
        keyOptions: { error },
        type: "error"
      });
    });
}
</script>

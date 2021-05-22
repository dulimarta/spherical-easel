<template>
  <v-container fluid>
    <v-row justify="center">
      <v-sheet elevation="4"
        class="pa-4">
        <v-form v-model="validEntries">
          <v-row class="flex-column">
            <v-col cols="auto">
              <v-text-field label="UserId/Email"
                v-model="userEmail"
                :rules="emailRules"
                required
                prepend-icon="mdi-account"></v-text-field>
            </v-col>
            <v-col cols="auto">
              <v-text-field label="Password"
                v-model="userPassword"
                type="password"
                :rules="passwordRules"
                prepend-icon="mdi-lock"></v-text-field>
            </v-col>
            <v-col cols="auto">
              <v-row>
                <v-col cols="auto">
                  <v-btn @click="doSignup"
                    :disabled="!validEntries">Signup</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn :disabled="!isValidEmail">Reset Password</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn color="primary"
                    @click="doSignIn"
                    :disabled="!validEntries">Signin</v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-row>
  </v-container>
</template>

<script lang="ts">
// @ is an alias to /src
import { Component, Vue } from "vue-property-decorator";
import { FirebaseAuth, UserCredential } from "@firebase/auth-types";
import EventBus from "@/eventHandlers/EventBus";
@Component
export default class Login extends Vue {
  readonly $appAuth!: FirebaseAuth;
  userEmail = "";
  userPassword = "";
  readonly emailRules = [
    (s: string | undefined): boolean | string => {
      if (!s) return false;
      /* should  be neither undefined nor null */ else if (s.indexOf("@") > 0)
        return true;
      else return "Missing '@'?";
    }
  ];

  readonly passwordRules = [
    (s: string | undefined): boolean | string => {
      if (!s) return false;
      else
        return s.length >= 6 ? true : "Password must be at least 6 characters";
    }
  ];

  validEntries = false;

  get isValidEmail(): boolean {
    return this.emailRules
      .map(fn => fn(this.userEmail))
      .every(s => typeof s === "boolean" && s);
  }

  doSignup(): void {
    console.log("Attempt to signup a new account", this.$appAuth);
    this.$appAuth
      .createUserWithEmailAndPassword(this.userEmail, this.userPassword)
      .then((cred: UserCredential) => {
        console.log("jsdf", cred);
        cred.user?.sendEmailVerification();
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

  doSignIn(): void {
    this.$appAuth
      .signInWithEmailAndPassword(this.userEmail, this.userPassword)
      .then((cred: UserCredential) => {
        if (cred.user?.emailVerified) {
          this.$router.replace({
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

  doReset(): void {
    this.$appAuth.sendPasswordResetEmail(this.userEmail).then(() => {
      EventBus.fire("show-alert", {
        key: "account.passwordReset",
        keyOptions: { emailAddr: this.userEmail },
        type: "info"
      });
    });
  }
}
</script>

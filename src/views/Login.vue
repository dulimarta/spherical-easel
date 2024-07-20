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
                  v-model="usrEmail"
                  :rules="emailRules"
                  required
                  prepend-icon="mdi-account"></v-text-field>
              </v-col>
              <v-col cols="auto">
                <v-text-field
                  label="Password"
                  v-model="usrPassword"
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
  <v-snackbar v-model="showLoginError" :color="messageType">
    {{ loginMessage }}
  </v-snackbar>
</template>

<script lang="ts" setup>
import { useAccountStore } from "@/stores/account";
import { computed, ref, Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const showLoginError = ref(false);
const loginMessage = ref("");
const messageType: Ref<"info" | "error" | "warning"> = ref("info");
const router = useRouter();
const acctStore = useAccountStore();
const usrEmail:Ref<string> = ref(import.meta.env.VITE_APP_TESTUSER);
const usrPassword:Ref<string> = ref(import.meta.env.VITE_APP_TESTPASSWORD);
const emailRules = [
  (s: string | undefined): boolean => {
    if (!s) return false;
    else {
      return s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) !== null;
    }
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
  const out = emailRules.map(fn => fn(usrEmail.value)).every(s => s);
  console.debug("Email rule check", out);
  return out;
});

function doSignup(): void {
  acctStore.signUp(usrEmail.value, usrPassword.value).then(outcome => {
    if (typeof outcome === "boolean") {
      loginMessage.value = t("emailVerification", {
        emailAddr: usrEmail.value
      });
      messageType.value = "info";
    } else {
      loginMessage.value = t("createError", { error: outcome });
      messageType.value = "error";
    }
    showLoginError.value = true;
  });
}

function doSignIn(): void {
  acctStore.signIn(usrEmail.value, usrPassword.value).then(success => {
    if (typeof success == "boolean") {
      if (success) {
        router.replace({
          path: "/"
        });
      } else {
        messageType.value = "warning";
        loginMessage.value = t("emailNotVerified");
        showLoginError.value = true;
      }
    } else {
      // We can't use show-alert to show error message because the message hub is not visible
      messageType.value = "error";
      loginMessage.value = t("loginError", { error: success });
      showLoginError.value = true;
    }
  });
}

function doReset(): void {
  acctStore.passwordReset(usrEmail.value).then(() => {
    loginMessage.value = t("passwordReset", { emailAddr: usrEmail.value });
    messageType.value = "info";
    showLoginError.value = true;
  });
}

function doGoogleLogin(): void {
  acctStore.googleLogin().then(outcome => {
    if (!outcome) {
      router.replace({
        path: "/"
      });
    } else {
      loginMessage.value = t("loginError", { error: outcome });
      messageType.value = "error";
      showLoginError.value = true;
    }
  });
}
</script>
<i18n lang="json" locale="en">
{
  "createError": "Unable to create a new account: {error}",
  "emailNotVerified": "Your account is not yet verified. Please check your email",
  "emailVerification": "Verification email has been sent to {emailAddr}",
  "loginError": "Unable to login: {error}",
  "passwordReset": "Check your email ({emailAddr}) to reset password"
}
</i18n>
<i18n lang="json" locale="id">
{
  "createError": "Pembuatan akun baru tidak berhasil: {error}",
  "emailNotVerified": "Akun anda belum diverifikasi. Periksalah email anda",
  "emailVerification": "Email untuk verifikasi akun telah dikirim ke {emailAddr}",
  "loginError": "Login tidak berhasil: {error}",
  "passwordReset": "Periksalah email and ({emailAddr}) untuk mereset password"
}
</i18n>

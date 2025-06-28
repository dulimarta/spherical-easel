<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="5">
        <v-sheet elevation="4" class="pa-4">
          <v-form v-model="validEntries">
            <div :style="{ display: 'flex', flexDirection: 'column' }">
              <v-text-field
                label="UserId/Email"
                v-model="usrEmail"
                :rules="emailRules"
                required
                prepend-icon="mdi-account"></v-text-field>
              <v-text-field
                :label="t('Password')"
                v-model="usrPassword"
                type="password"
                :rules="passwordRules"
                prepend-icon="mdi-lock"></v-text-field>
              <template v-if="!isSigningUp">
                <div
                  class="mb-3"
                  :style="{
                    display: 'flex',
                    justifyContent: 'space-evenly'
                  }">
                  <v-btn
                    color="primary"
                    @click="doSignIn"
                    :disabled="!validEntries">
                    {{ t("Signin") }}
                  </v-btn>
                  <v-btn
                    @click="doSignup"
                    :disabled="isSigningUp && !validEntries">
                    {{ t("Signup") }}
                  </v-btn>
                  <v-btn :disabled="!isValidEmail" @click="doReset">
                    {{ t("resetPass") }}
                  </v-btn>
                </div>
                <v-divider />
                <div
                  class="my-2"
                  :style="{
                    display: 'flex',
                    justifyContent: 'center',
                    columnGap: '1em'
                  }">
                  <v-btn @click="doGoogleLogin">
                    <v-icon left>mdi-google</v-icon>
                    Google
                  </v-btn>
                  <v-btn disabled>
                    <v-icon left>mdi-github</v-icon>
                    GitHub
                  </v-btn>
                </div>
              </template>
              <template v-else>
                <v-text-field
                  :label="t('Password2')"
                  v-model="passwordConfirm"
                  type="password"
                  :error="usrPassword !== passwordConfirm"
                  prepend-icon="mdi-lock"></v-text-field>
                <v-text-field
                  :label="t('name')"
                  v-model="userName"
                  type="text"
                  prepend-icon="mdi-card-account-details" />
                <div
                  class="mb-3"
                  :style="{
                    display: 'flex',
                    justifyContent: 'space-evenly'
                  }">
                  <v-btn @click="doSignup" :disabled="!canCreateAccount">
                    {{ t("confirm") }}
                  </v-btn>
                  <v-btn @click="isSigningUp = false">{{ t("cancel") }}</v-btn>
                </div>
              </template>
            </div>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
  <v-snackbar v-model="showLoginError" :color="messageType">
    {{ loginMessage }}
  </v-snackbar>
</template>
<i18n locale="en">
  {
    "Password": "Password",
    "Signin": "Signin",
    "Signup": "Signup",
    "resetPass": "Reset Password",
    "confirm": "Create",
    "cancel": "Cancel",
    "Password2": "Confirm Password",
    "name": "Your name",
    "passwordTooShort": "Password must be at least 6 characters"
  }
</i18n>
<script lang="ts" setup>
import { useAccountStore } from "@/stores/account";
import { computed, ref, Ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const showLoginError = ref(false);
const loginMessage = ref("");
const isSigningUp = ref(false);
const userName = ref("");
const messageType: Ref<"info" | "error" | "warning"> = ref("info");
const router = useRouter();
const acctStore = useAccountStore();
const usrEmail: Ref<string> = ref(import.meta.env.VITE_APP_TESTUSER);
const usrPassword: Ref<string> = ref(import.meta.env.VITE_APP_TESTPASSWORD);
const passwordConfirm = ref(import.meta.env.VITE_APP_TESTPASSWORD);
const emailReges = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const emailRules = [
  (s: string | undefined): boolean => {
    if (!s) return false;
    else {
      return s.match(emailReges) !== null;
    }
  }
];

const passwordRules = [
  (s: string | undefined): boolean | string => {
    if (!s) return false;
    else return s.length >= 6 ? true : t("passwordTooShort");
  }
];

const validEntries = ref(false);
const canCreateAccount = computed(() => {
  if (!validEntries.value) return false;
  if (usrPassword.value !== passwordConfirm.value) return false;
  if (userName.value.length === 0) return false;
  return true;
});

const isValidEmail = computed((): boolean => {
  const out = emailRules.map(fn => fn(usrEmail.value)).every(s => s);
  console.debug("Email rule check", out);
  return out;
});

function doSignup(): void {
  if (!isSigningUp.value) {
    isSigningUp.value = true;
  } else {
    console.debug("Process to create a new account");
    acctStore
      .signUp(usrEmail.value, usrPassword.value, userName.value)
      .then(outcome => {
        if (typeof outcome === "boolean") {
          loginMessage.value = t("emailVerification", {
            emailAddr: usrEmail.value
          });
          messageType.value = "info";
          isSigningUp.value = false;
        } else {
          loginMessage.value = t("createError", { error: outcome });
          messageType.value = "error";
        }
        showLoginError.value = true;
      });
  }
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

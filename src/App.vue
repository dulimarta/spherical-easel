<!--
  template is HTML for the layout for the UI of the vue application (i.e. the main
  window with everything in it), it allows for binding with the
  underlying Document Object Model. We can use this template for specifying
  locations in the document with the "id" class.
-->

<template>
  <!--
    This is the main application that must contain all the vuetify components.
    There can be only one of these environments.
  -->
  <v-app>
    <!-- This is the main app bar in the window. Notice the internationalization in the toolbar
    title where $t('key') means that the key should be looked up in the current language file named
    ##.lang.json.-->

    <!-- <v-app-bar color="primary" density="compact">
      <template #prepend>
        <router-link to="/">
          <v-img
            alt="Spherical Easel Logo"
            class="shrink mr-2"
            contain
            src="@/assets/SphericalEaselLogo.gif"
            transition="scale-transition"
            aspect-ratio="1"
            :width="40" />
        </router-link>
        <a href="/docs/">
          <v-icon class="ml-2" color="white">mdi-help-circle</v-icon>
          <v-tooltip location="bottom" activator="parent">
            Open Documentation
          </v-tooltip>
        </a>
      </template>
      <v-app-bar-title>{{ t("main.SphericalEaselMainTitle") }}</v-app-bar-title> -->

    <!--- TODO: Change the URL to match the hosting site
               For instance, on GitLab use href="/sphericalgeometryvue/docs"
               Watch out for double slashes "//"
            --->
    <!-- Use <a> For GitLab -->
    <!--a :href="`${baseURL}/docs`">
              <v-icon class="ml-2"
                v-bind="props">mdi-help-circle</v-icon>
            </a-->

    <!-- </v-app-bar> -->

    <!--
      This is the main window of the app. All other components are display on top of this element
      The router controls this background and it can be Easel or settings or...
    -->
    <v-main>
      <!-- <MessageHub></MessageHub> -->
      <router-view />
      <!-- this is the spot where the views controlled by Vue Router will be rendered -->
    </v-main>
  </v-app>

  <Dialog
    ref="logoutDialog"
    :title="t('constructions.confirmLogout')"
    :yes-text="t('constructions.proceed')"
    :yes-action="() => doLogout()"
    :no-text="t('constructions.cancel')"
    style=""
    max-width="40%">
    <p>
      {{ t("constructions.logoutDialog") }}
    </p>
  </Dialog>
</template>

<!--
  This section is for Typescript code (note lang="ts") for binding the output of the user
  actions to desired changes in the display and the rest of the app.
-->
<script lang="ts" setup>
/* Import the custom components */
import { Ref, ref, onBeforeMount, onMounted } from "vue";
import Dialog, { DialogAction } from "@/components/Dialog.vue";
// import LanguageSelector from "./components/LanguageSelector.vue";
// import AuthenticatedUserToolbox from "./components/AuthenticatedUserToolbox.vue";
import { getAuth } from "firebase/auth";

import { useAccountStore } from "@/stores/account";
import { storeToRefs } from "pinia";

import { useI18n } from "vue-i18n";
import { useConstructionStore } from "./stores/construction";
const appAuth = getAuth();

// Register vue router in-component navigation guard functions
// Component.registerHooks([
//   "beforeRouteEnter",
//   "beforeRouteLeave",
//   "beforeRouteUpdate"
// ]);

const { t } = useI18n();
const acctStore = useAccountStore();
const { userRole } = storeToRefs(acctStore);
const constructionStore = useConstructionStore()
constructionStore.initialize()

const logoutDialog: Ref<DialogAction | null> = ref(null);
// const shareConstructionDialog: Ref<DialogAction | null> = ref(null);
const whoami = ref("");
const uid = ref("");

/* User account feature is initialy disabled. To unlock this feature
     The user must press Ctrl+Alt+S then Ctrl+Alt+E in that order */

onBeforeMount((): void => {
  acctStore.resetToolset();
});

onMounted((): void => {
  console.log("Base URL is ", import.meta.env.BASE_URL);
  // SEStore.init();
  // Get the top-level SVG element
});

async function doLogout(): Promise<void> {
  await appAuth.signOut();
  logoutDialog.value?.hide();
  userRole.value = undefined;
  uid.value = "";
  whoami.value = "";
  acctStore.parseAndSetFavoriteTools("");
}
</script>

<style lang="scss">
.footer-text {
  padding-top: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 15px;
}
.footer-color {
  color: "accent";
}

#profilePic {
  border-radius: 50%;
}

.pulse-enter-active {
  animation-name: pulse;
  animation-duration: 0.5s;
}
.pulse-leave-active {
  animation-name: pulse;
  animation-duration: 0.5s;
  animation-direction: reverse;
}

@keyframes pulse {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(2);
  }
  100% {
    transform: scale(1);
  }
}

// .shareConstructionClass {
//   width: 300px;
//   margin-top: 50px;
//   margin-bottom: auto;
//   margin-right: 30px;
//   margin-left: auto;
// }
</style>

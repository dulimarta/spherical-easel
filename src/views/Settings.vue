<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12"
        sm="6">
        <v-sheet elevation="2"
          class="pa-2">
          <h3>User Profile</h3>
          <div id="profile"
            class="text-body-2">
            <label>Profile image</label>
            <v-row id="profilePicture">
              <v-col cols="auto"
                style="position:relative">
                <v-hover v-if="!takingPicture"
                  v-slot:default="{hover}">
                  <span id="profileImage">
                    <img v-if="profileImage"
                      :src="profileImage">
                    <v-icon v-else
                      :color="hover ? 'primary' : 'secondary' "
                      size="128">mdi-account
                    </v-icon>
                    <v-overlay absolute
                      :value="hover">
                      <v-row>
                        <v-col cols="auto">
                          <v-icon @click="takingPicture = true">
                            mdi-camera</v-icon>
                        </v-col>
                        <v-col cols="auto">
                          <v-icon @click="$refs.imageUpload.click()">
                            mdi-upload</v-icon>
                          <input ref="imageUpload"
                            type="file"
                            accept="image/*"
                            @change="onImageUploaded" />
                        </v-col>
                      </v-row>
                    </v-overlay>
                  </span>
                </v-hover>

                <PhotoCapture v-if="takingPicture"
                  @captured="profilePicCaptured"
                  @no-capture="takingPicture = false" />
              </v-col>
            </v-row>
            <label>Display name</label>
            <span>Don Knuth</span>
            <label>Email</label>
            <span>knuthd@mail.com</span>
            <label>Location</label>
            <span>Somewhere, USA</span>
            <label>Role</label>
            <v-select :items="
                  ['Student', 'Instructor'
                  , 'Community Member'
                  ]">
            </v-select>
          </div>
          <v-btn>Change Password</v-btn>
          <v-btn>Delete Account</v-btn>
        </v-sheet>
      </v-col>
      <v-col cols="12"
        sm="6">
        <v-sheet elevation="2"
          class="pa-2">
          <h3 v-t="'settings.title'"></h3>
          <div id="appSetting">
            <label>Language</label>
            <v-select v-model="selectedLanguage"
              outlined
              :items="languages"
              item-text="name"
              item-value="locale"
              label="Language"
              return-object>
            </v-select>
            <label>Decimal Precision</label>
            <v-radio-group row>
              <v-radio label="3"
                value="3"></v-radio>
              <v-radio label="5"
                value="5"></v-radio>
              <v-radio label="7"
                value="7"></v-radio>
            </v-radio-group>
            <labeL>Selection Precision</labeL>
            <v-radio-group row>
              <v-radio label="Less">Less</v-radio>
              <v-radio label="More">More</v-radio>
            </v-radio-group>
            <h3>Label options</h3><span></span>
            <label>Initial display</label>
            <v-radio-group row>
              <v-radio label="None"></v-radio>
              <v-radio label="All"></v-radio>
              <v-radio label="Default"></v-radio>
            </v-radio-group>
            <span></span>
            <v-checkbox label="Hide objects/labels" />
            <span></span>
            <v-checkbox label="Show objects/labels" />
            <h3>Hints</h3><span></span>
            <span></span>
            <v-checkbox label="Display Tooltips" />
            <span></span>
            <v-checkbox label="Display use messages" />
          </div>
        </v-sheet>
      </v-col>
    </v-row>
    <v-btn @click="switchLocale">Save</v-btn>
  </v-container>
</template>

<style lang="scss" scoped>
div#container {
  padding: 1rem;
}

div#profile,
div#appSetting {
  display: grid;
  grid-template-columns: 1fr 3fr;
}

#profilePicture {
  #profileImage,
  img {
    border-radius: 50%;
  }
}

input[type="file"] {
  display: none;
}
</style>
<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import PhotoCapture from "@/components/PhotoCapture.vue";
import SETTINGS from "@/global-settings";
import { FirebaseAuth } from "@firebase/auth-types";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { FirebaseStorage } from "@firebase/storage-types";

type UserProfile = {
  profilePictureURL: string;
};
type FileEvent = EventTarget & { files: FileList | undefined };
@Component({ components: { PhotoCapture } })
export default class Settings extends Vue {
  $appAuth!: FirebaseAuth;
  $appDB!: FirebaseFirestore;
  $appStorage!: FirebaseStorage;

  $refs!: {
    imageUpload: HTMLInputElement;
  };
  selectedLanguage: unknown = {};
  profileImage: string | null = null;
  takingPicture = false;
  languages = SETTINGS.supportedLanguages;
  decimalPrecision = 3;

  mounted(): void {
    const uid = this.$appAuth.currentUser?.uid;
    if (!uid) return;
    this.$appDB
      .collection("users")
      .doc(uid)
      .get()
      .then((ds: DocumentSnapshot) => {
        if (ds.exists) {
          const userDetails = ds.data() as UserProfile;
          this.profileImage = userDetails.profilePictureURL;
        }
      });
  }

  switchLocale(): void {
    this.$i18n.locale = (this.selectedLanguage as any).locale;
  }

  profilePicCaptured(event: { image: string; url: string }): void {
    // console.log("Got an image", event.image);
    this.takingPicture = false;
    this.profileImage = event.image;
  }

  onImageUploaded(event: Event): void {
    const files = (event.target as FileEvent).files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent) => {
        const out = (ev.target as any).result;
        console.log("What is", out);
        // const url = URL.createObjectURL(out);
        this.profileImage = out;
      };
      reader.readAsDataURL(files[0]);
    }
  }
}
</script>

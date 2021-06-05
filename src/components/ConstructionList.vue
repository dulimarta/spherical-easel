<template>
  <div>
    Share flag {{allowSharing}}
    <v-list three-line>
      <template v-for="(r,pos) in items">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item>
            <v-list-item-avatar size="64">
              <img :src="previewOrDefault(r.previewData)"
                alt="preview">
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="text-truncate">
                {{r.description || "N/A"}}
              </v-list-item-title>
              <v-list-item-subtitle><code>{{r.id.substring(0,5)}}</code>
                <span class="text-truncate">
                  {{r.objectCount}} objects,
                  {{r.dateCreated.substring(0,10)}}
                  {{r.author}}</span>
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay absolute
              :value="hover">
              <v-row align="center">
                <v-col>
                  <v-btn rounded
                    fab
                    small
                    color="secondary">
                    <v-icon
                      @click="$emit('load-requested', {docId: r.id})">
                      mdi-download</v-icon>
                  </v-btn>
                </v-col>
                <v-col v-if="allowSharing">
                  <v-btn rounded
                    fab
                    small
                    color="secondary"
                    @click="$emit('share-requested', {docId: r.id})">
                    <v-icon>mdi-share-variant</v-icon>
                  </v-btn>
                </v-col>
                <!-- show delete button only for its owner -->
                <v-col v-if="r.author === userEmail">
                  <v-btn rounded
                    fab
                    small
                    color="red"
                    @click="$emit('delete-requested', {docId: r.id})">
                    <v-icon>mdi-trash-can</v-icon>
                  </v-btn>
                </v-col>

              </v-row>
            </v-overlay>
          </v-list-item>
        </v-hover>
      </template>
    </v-list>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { SphericalConstruction } from "@/types";
import { FirebaseAuth } from "node_modules/@firebase/auth-types";

@Component
export default class extends Vue {
  readonly $appAuth!: FirebaseAuth;
  @Prop()
  items!: Array<SphericalConstruction>;

  @Prop({ default: false })
  allowSharing!: boolean;

  get userEmail(): string {
    return this.$appAuth.currentUser?.email ?? "";
  }

  previewOrDefault(dataUrl: string | undefined): string {
    return dataUrl ? dataUrl : require("@/assets/SphericalEaselLogo.gif");
  }
}
</script>

<style scoped>
</style>
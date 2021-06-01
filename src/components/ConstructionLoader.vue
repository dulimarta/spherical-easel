<template>
  <div>
    <div class="text-h6">Private Constructions</div>
    <v-list two-line>
      <template v-for="(r,pos) in privateConstructions">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>{{r.description.substring(0,25) || "N/A"}}
              </v-list-item-title>
              <v-list-item-subtitle><code>{{r.id.substring(0,5)}}</code>
                {{r.objectCount}} objects,
                {{r.dateCreated.substring(0,10)}}
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay absolute
              :value="hover">
              <v-btn rounded
                color="secondary"
                @click="loadConstruction(r.id)">
                <v-icon left>mdi-folder-open-outline</v-icon>Load
              </v-btn>
            </v-overlay>
          </v-list-item>
        </v-hover>
      </template>
    </v-list>
    <div class="text-h6">Public Constructions</div>
    <v-list two-line>
      <template v-for="(r,pos) in publicConstructions">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>{{r.description.substring(0,25) || "N/A"}}
              </v-list-item-title>
              <v-list-item-subtitle><code>{{r.id.substring(0,5)}}</code>
                {{r.objectCount}} objects,
                {{r.dateCreated.substring(0,10)}}
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>
            <!--- show a Load button as an overlay when the mouse hovers -->
            <v-overlay absolute
              :value="hover">
              <v-btn rounded
                color="secondary"
                @click="loadConstruction(r.id)">
                <v-icon left>mdi-folder-open-outline</v-icon>Load
              </v-btn>
            </v-overlay>
          </v-list-item>
        </v-hover>
      </template>
    </v-list>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import {
  FirebaseFirestore,
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";
import { run, ConstructionScript } from "@/commands/CommandInterpreter";
import EventBus from "@/eventHandlers/EventBus";
import { SENodule } from "@/models/SENodule";
import Nodule from "@/plottables/Nodule";
import { FirebaseAuth } from "node_modules/@firebase/auth-types";

// TODO: move the following type alias and interface elsewhere later?
interface SphericalConstruction extends ConstructionInFirestore {
  id: string;
  parsedScript: ConstructionScript;
  objectCount: number;
}

interface ConstructionInFirestore {
  author: string;
  dateCreated: string;
  script: string;
  description: string;
}

@Component
export default class ConstructionLoader extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly $appAuth!: FirebaseAuth;
  publicConstructions: Array<SphericalConstruction> = [];
  privateConstructions: Array<SphericalConstruction> = [];

  get firebaseUid(): string | undefined {
    return this.$appAuth.currentUser?.uid;
  }

  mounted(): void {
    if (this.firebaseUid) {
      this.$appDB
        .collection("users")
        .doc(this.firebaseUid)
        .collection("constructions")
        .onSnapshot((qs: QuerySnapshot) => {
          this.populateData(qs, this.privateConstructions);
        });
    }
    this.$appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
      this.populateData(qs, this.publicConstructions);
    });
  }

  populateData(
    qs: QuerySnapshot,
    targetArr: Array<SphericalConstruction>
  ): void {
    targetArr.splice(0);
    qs.forEach((qd: QueryDocumentSnapshot) => {
      const doc = qd.data() as ConstructionInFirestore;
      const parsedScript = JSON.parse(doc.script) as ConstructionScript;

      if (parsedScript.length > 0) {
        // we care only for non-empty script
        const objectCount = parsedScript
          // A simple command contributes 1 object
          // A CommandGroup contributes N objects (as many elements in its subcommands)
          .map((z: string | Array<string>) =>
            typeof z === "string" ? 1 : z.length
          )
          .reduce((prev: number, curr: number) => prev + curr);

        targetArr.push({
          id: qd.id,
          script: doc.script,
          parsedScript,
          objectCount,
          author: doc.author,
          dateCreated: doc.dateCreated,
          description: doc.description
        });
      }
    });
    // Sort by creation date
    targetArr.sort((a: SphericalConstruction, b: SphericalConstruction) =>
      a.dateCreated.localeCompare(b.dateCreated)
    );
  }

  loadConstruction(docId: string): void {
    let script: ConstructionScript | null = null;

    // Search in public list
    let pos = this.publicConstructions.findIndex(
      (c: SphericalConstruction) => c.id === docId
    );
    if (pos >= 0) script = this.publicConstructions[pos].parsedScript;
    else {
      // Search in private list
      pos = this.privateConstructions.findIndex(
        (c: SphericalConstruction) => c.id === docId
      );
      script = this.privateConstructions[pos].parsedScript;
    }

    this.$store.direct.commit.removeAllFromLayers();
    this.$store.direct.commit.init();
    SENodule.resetAllCounters();
    Nodule.resetAllCounters();
    EventBus.fire("show-alert", {
      key: "objectTree.firestoreConstructionLoaded",
      keyOptions: { docId },
      type: "info"
    });
    run(script);
  }
}
</script>

<style scoped>
</style>
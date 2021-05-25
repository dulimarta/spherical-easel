<template>
  <div>
    <h2>Saved Constructions</h2>
    <v-list two-line>
      <template v-for="(r,pos) in publicConstructions">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>{{r.description || "N/A"}}
              </v-list-item-title>
              <v-list-item-subtitle><code>{{r.id.substring(0,5)}}</code>
                {{r.objectCount}} objects,
                {{r.dateCreated}}
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
  publicConstructions: Array<SphericalConstruction> = [];

  mounted(): void {
    // For now, we will keep all constructions under one collection
    // Later we will separate private from public constructions
    this.$appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
      this.publicConstructions.splice(0);
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

          this.publicConstructions.push({
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
    });
  }

  loadConstruction(docId: string): void {
    const pos = this.publicConstructions.findIndex(
      (c: SphericalConstruction) => c.id === docId
    );
    if (pos >= 0) {
      // console.log("Open", docId, this.publicConstructions[pos].script);
      this.$store.direct.commit.removeAllFromLayers();
      this.$store.direct.commit.init();
      SENodule.resetAllCounters();
      Nodule.resetAllCounters();
      EventBus.fire("show-alert", {
        key: "objectTree.firestoreConstructionLoaded",
        keyOptions: { docId },
        type: "info"
      });
      run(this.publicConstructions[pos].parsedScript);
    }
  }
}
</script>

<style scoped>
</style>
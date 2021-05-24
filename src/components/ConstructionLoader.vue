<template>
  <div>
    <h2>Saved Constructions</h2>
    {{availableConstructions.length}}
    <v-list two-line>
      <template v-for="(r,pos) in availableConstructions">
        <v-hover v-slot:default="{hover}"
          :key="pos">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>{{r.id}}</v-list-item-title>
              <v-list-item-subtitle>{{r.objectCount}} objects,
                {{r.createdOn}}
              </v-list-item-subtitle>
              <v-divider />
            </v-list-item-content>

            <v-list-item-action v-if="hover">

            </v-list-item-action>
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
import { interpret } from "@/commands/Runner";
import EventBus from "@/eventHandlers/EventBus";

// TODO: move the following type alias and interface elsewhere later
type ScriptArray = Array<string | Array<string>>;
interface SphericalConstruction {
  id: string;
  rawScript: string;
  script: ScriptArray;
  author: string;
  createdOn: string;
  objectCount: number;
}
@Component
export default class ConstructionLoader extends Vue {
  readonly $appDB!: FirebaseFirestore;
  availableConstructions: Array<SphericalConstruction> = [];

  mounted(): void {
    this.$appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
      this.availableConstructions.splice(0);
      qs.forEach((qd: QueryDocumentSnapshot) => {
        const doc = qd.data() as any;
        const script = JSON.parse(doc.script) as ScriptArray;

        if (script.length > 0) {
          const objectCount = script
            .map(z => (typeof z === "string" ? 1 : z.length))
            .reduce((prev: number, curr: number) => prev + curr);

          this.availableConstructions.push({
            id: qd.id,
            rawScript: doc.rawScript,
            script,
            objectCount,
            author: doc.author,
            createdOn: doc.createdOn
          });
        }
      });
    });
  }

  loadConstruction(docId: string): void {
    const pos = this.availableConstructions.findIndex(
      (c: SphericalConstruction) => c.id === docId
    );
    if (pos >= 0) {
      console.log("Open", docId, this.availableConstructions[pos].script);
      this.$store.direct.commit.init();
      interpret(this.availableConstructions[pos].script[0]);
      EventBus.fire("show-alert", {
        key: "objectTree.firestoreLoadError",
        keyOptions: { docId },
        type: "info"
      });
    }
  }
}
</script>

<style scoped>
</style>
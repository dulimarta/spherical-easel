<template>
  <div>
    <h2>Open Construction</h2>

    <v-container>
      <v-data-table :items="availableConstructions"
        :headers="myHeaders">
        <template #[`item.action`]="{item}">
          <v-icon @click="loadConstruction(item.id)">
            mdi-folder-open-outline</v-icon>
        </template>
      </v-data-table>
    </v-container>
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

// TODO: move the following type alias and interface elsewhere later
type ScriptArray = Array<string | Array<string>>;
interface SphericalConstruction {
  id: string;
  rawScript: string;
  script: ScriptArray;
  // author: string;
  // creationDate: string;
  objectCount: number;
}
@Component
export default class ConstructionLoader extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly myHeaders = [
    { text: "ID", value: "id" },
    { text: "Object Count", value: "objectCount" },
    { text: "Action", value: "action" }
  ];
  availableConstructions: Array<SphericalConstruction> = [];

  mounted(): void {
    this.availableConstructions.splice(0);
    this.$appDB.collection("constructions").onSnapshot((qs: QuerySnapshot) => {
      // console.log("Attempt to load shared constructions");
      qs.forEach((qd: QueryDocumentSnapshot) => {
        const doc = qd.data() as any;
        const script = JSON.parse(doc.script) as ScriptArray;

        // console.log(qd.id, script);
        const objectCount = script
          .map(z => (typeof z === "string" ? 1 : z.length))
          .reduce((prev: number, curr: number) => prev + curr);

        this.availableConstructions.push({
          id: qd.id,
          rawScript: doc.rawScript,
          script,
          objectCount
        });
      });
    });
  }

  loadConstruction(docId: string): void {
    const pos = this.availableConstructions.findIndex(
      (c: SphericalConstruction) => c.id === docId
    );
    if (pos >= 0)
      console.log("Open", docId, this.availableConstructions[pos].script);
    interpret(this.availableConstructions[pos].script[0]);
  }
}
</script>

<style scoped>
</style>
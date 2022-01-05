<template>
  <div>
    <p>Select a session to join</p>

    <table v-if="availableSessions.length > 0">
      <tr>
        <th>Socket Id</th>
        <th>Action</th>
      </tr>
      <tr v-for="(sessId, pos) in availableSessions"
        :key="pos">
        <td>{{sessId}}</td>
        <td>

          <v-btn @click="joinSession(sessId)"
            color="primary">Join<v-icon>
              mdi-account-multiple</v-icon>
          </v-btn>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { io, Socket } from "socket.io-client";
import {
  FirebaseFirestore,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from "@firebase/firestore-types";
import { namespace } from "vuex-class";
import { StudioState } from "@/types";
import { StudioStore } from "@/store";
const SD = namespace("sd");

@Component
export default class Sessions extends Vue {
  @SD.State((s: StudioState) => s.studioSocket)
  readonly studentStudioSocket!: Socket | null;

  readonly $appDB!: FirebaseFirestore;

  socket!: Socket;
  availableSessions: Array<string> = [];

  mounted(): void {
    console.debug("Sessions::mounted", this.$appDB);
    this.$appDB.collection("sessions").onSnapshot((qs: QuerySnapshot) => {
      this.availableSessions.splice(0);
      qs.docs.forEach((qdoc: QueryDocumentSnapshot) => {
        this.availableSessions.push(qdoc.id);
      });
    });
  }

  joinSession(session: string): void {
    console.debug("Attempt rejoin studio", session);
    this.socket = io(
      process.env.VUE_APP_SESSION_SERVER_URL || "http://localhost:4000"
    );
    StudioStore.setStudioSocket(this.socket);
    this.$router.push({
      name: "StudioActivity",
      params: { session }
    });
  }
}
</script>
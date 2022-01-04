<template>
  <div>
    <h1>List of sessions</h1>

    <table v-if="availableSessions.length > 0">
      <tr>
        <th>Socket Id</th>
        <th>Action</th>
      </tr>
      <tr v-for="(sessId, pos) in availableSessions"
        :key="pos">
        <td>{{sessId}}</td>
        <td>
          <v-btn @click="joinSession(sessId)">Join</v-btn>
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

@Component
export default class Sessions extends Vue {
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
    console.debug("Attempt to join session ", session);
    this.socket = io(
      process.env.VUE_APP_SESSION_SERVER_URL || "http://localhost:4000"
    );
    this.socket.on("connect", () => {
      console.debug("Student connected to socket", this.socket.id);
      this.socket.emit("student-join", { who: "John Doe", session });
    });
    this.socket.on("disconnect", () => {
      console.debug("Student disconnected from socket", this.socket.id);
    });
    this.socket.on("notify-all", (msg: string) => {
      console.debug("Students received broadcast", msg)
    });
  }
}
</script>
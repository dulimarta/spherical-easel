<template>
  <div>
    <h1>Teacher Dashboard</h1>
    <v-btn @click="createSession">Start Session</v-btn>
    <code v-if="socketID.length > 0">Socket ID: {{socketID}}</code>
  </div>
</template>

<script lang="ts">
import { io, Socket } from "socket.io-client";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class TeacherDashboard extends Vue {
  socket!: Socket;
  socketID = "";
  env: any;

  mounted(): void {
    console.debug("Environment", process.env);
  }

  createSession(): void {
    console.debug("About to create a new session...");
    this.socket = io(
      process.env.VUE_APP_SESSION_SERVER_URL || "http://localhost:4000"
    );
    this.socket.on("connect", () => {
      this.socketID = this.socket.id;
      console.debug("Teacher socket connected to ", this.socket.id);
      this.socket.emit("teacher-join", { who: "Just me", isTeacher: true });
    });
    this.socket.on("new-student", (arg) => {
      console.debug("A student just joined", arg)
    })
  }
}
</script>
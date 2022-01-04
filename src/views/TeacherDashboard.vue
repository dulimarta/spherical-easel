<template>
  <div>
    <h1>Teacher Dashboard</h1>
    <v-btn @click="stopSession">Terminate Session</v-btn>
    <code>Socket ID: {{socketID}}</code>
    <v-textarea v-model="message">

    </v-textarea>
    <v-btn @click="broadcastMessage">Broadcast</v-btn>
  </div>
</template>

<script lang="ts">
import { AppState } from "@/types";
import { io, Socket } from "socket.io-client";
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { SEStore } from "@/store";
const SE = namespace("se");

@Component
export default class TeacherDashboard extends Vue {
  @SE.State((s: AppState) => s.teacherSessionSocket)
  readonly teacherSessionSocket!: Socket | null;

  socket: Socket | null = null;
  message = "";

  get socketID(): string {
    return this.teacherSessionSocket ? this.teacherSessionSocket.id : "<None>"
  }

  mounted(): void {
    console.debug("TeacherDashboard::mounted()", process.env);
    if (this.teacherSessionSocket == null) {
      console.debug("About to create a new session...");
      this.socket = io(
        process.env.VUE_APP_SESSION_SERVER_URL || "http://localhost:4000"
      );
      this.socket.on("connect", () => {
        console.debug("Teacher socket connected to ", this.socket?.id);
        SEStore.setTeacherSession(this.socket);
        this.socket?.emit("teacher-join", { who: "Just me", isTeacher: true });
      });
      this.socket.on("new-student", arg => {
        console.debug("A student just joined", arg);
      });
    } else {
      this.socket = this.teacherSessionSocket;
    }
  }

  beforeUnMount(): void {
    console.debug("TeacherDashboard::beforeUnmount()");
  }

  broadcastMessage(): void {
    console.debug("About to broadcast", this.message);
    this.socket?.emit("notify-all", {
      room: `chat-${this.teacherSessionSocket?.id}`,
      message: this.message
    });
  }

  stopSession(): void {
    this.socket?.emit("teacher-leave");
    SEStore.setTeacherSession(null);
    this.$router.back();
  }
}
</script>
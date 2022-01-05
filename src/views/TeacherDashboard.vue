<template>
  <div>
    <h1>Teacher Session Dashboard</h1>
    <v-btn @click="stopStudio">Terminate Session</v-btn>
    <code>Socket ID: {{socketID}}</code>
    <p v-for="(m,pos) in sentMessages"
      :key="pos">
      {{m}}
    </p>
    <v-textarea v-model="message"
      rows="3"
      outlined
      color="secondary"
      class="ma-3">

    </v-textarea>
    <v-btn @click="broadcastMessage">Broadcast</v-btn>
  </div>
</template>

<script lang="ts">
import { StudioState } from "@/types";
import { io, Socket } from "socket.io-client";
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { StudioStore } from "@/store";
const SD = namespace("sd");

@Component
export default class TeacherDashboard extends Vue {
  @SD.State((s: StudioState) => s.studioSocket)
  readonly teacherStudioSocket!: Socket | null;

  socket: Socket | null = null;
  message = "";
  sentMessages: Array<string> = [];

  get socketID(): string {
    return this.teacherStudioSocket ? this.teacherStudioSocket.id : "<None>";
  }

  mounted(): void {
    console.debug("TeacherDashboard::mounted()", process.env);
    if (this.teacherStudioSocket == null) {
      console.debug("About to create a new Studio...");
      this.socket = io(
        process.env.VUE_APP_Studio_SERVER_URL || "http://localhost:4000"
      );
      this.socket.on("connect", () => {
        console.debug("Teacher socket connected to ", this.socket?.id);
        StudioStore.setStudioSocket(this.socket);
        this.socket?.emit("teacher-join", { who: "Just me", isTeacher: true });
      });
      this.socket.on("new-student", arg => {
        console.debug("A student just joined", arg);
      });
    } else {
      this.socket = this.teacherStudioSocket;
    }
  }

  beforeUnMount(): void {
    console.debug("TeacherDashboard::beforeUnmount()");
  }

  broadcastMessage(): void {
    console.debug("About to broadcast", this.message);
    this.socket?.emit("notify-all", {
      room: `chat-${this.teacherStudioSocket?.id}`,
      message: this.message
    });
    this.sentMessages.push(this.message);
    this.message = "";
  }

  stopStudio(): void {
    this.socket?.emit("teacher-leave");
    StudioStore.setStudioSocket(null);
    this.$router.back();
  }
}
</script>
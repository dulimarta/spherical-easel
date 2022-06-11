<template>
  <div>
    <h1>Teacher Studio Dashboard</h1>
    <v-btn @click="stopStudio"
      small>
      <v-icon left>mdi-close</v-icon>Close Studio
    </v-btn>
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
import { Socket } from "socket.io-client";
import { Component, Vue } from "vue-property-decorator";
import { useSDStore } from "@/stores/sd";
import { useAccountStore } from "@/stores/account";
import { mapActions, mapState } from "pinia";

@Component({
  methods: {
    ...mapActions(useSDStore, ["setStudioSocket"])
  },
  computed: {
    ...mapState(useSDStore, ["studioSocket"]),
    ...mapState(useAccountStore, ["userEmail"])
  }
})
export default class TeacherDashboard extends Vue {
  readonly studioSocket!: Socket | null;
  readonly userEmail!: string | undefined;
  readonly setStudioSocket!: (s: Socket | null) => void;
  message = "";
  sentMessages: Array<string> = [];

  get socketID(): string {
    return this.studioSocket?.id ?? "None";
  }

  mounted(): void {
    console.debug(
      "TeacherDashboard::mounted() with socket",
      this.studioSocket?.id,
      "User email",
      this.userEmail
    );

    if (this.studioSocket !== null) {
      //   console.debug("About to create a new Studio...");
      //   this.studioSocket?.on("connect", () => {
      //     console.debug("Teacher socket connected to ", socket.id);
      //     this.setStudioSocket(socket);
      if (this.userEmail)
        this.studioSocket.emit("teacher-join", {
          who: this.userEmail,
          isTeacher: true
        });
      else {
        alert("Email is undefined");
      }
      //   });
      //   socket.on("new-student", arg => {
      //     console.debug("A student just joined", arg);
      //   });
    } else {
      console.debug("TeacherDashboard::mounted: studioSocket is null???");
    }
  }

  beforeUnMount(): void {
    console.debug("TeacherDashboard::beforeUnmount()");
  }

  broadcastMessage(): void {
    console.debug("About to broadcast", this.message);
    this.studioSocket?.emit("notify-all", {
      room: `chat-${this.studioSocket?.id}`,
      message: this.message
    });
    this.sentMessages.push(this.message);
    this.message = "";
  }

  stopStudio(): void {
    this.studioSocket?.emit("teacher-leave");
    this.setStudioSocket(null);
    this.$router.back();
  }
}
</script>
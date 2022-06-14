<template>
  <div>
    <h1>Teacher Studio Dashboard</h1>
    <v-btn @click="stopStudio"
      small>
      <v-icon left>mdi-close</v-icon>Close Studio
    </v-btn>
    <code>Socket ID: {{studioID}}</code>
    <p v-for="(m,pos) in sentMessages"
      :key="pos">
      {{m}}
    </p>
    <p>Members: {{activeMembers.join(", ")}}</p>
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
import { Component, Prop, Vue } from "vue-property-decorator";
import { useSDStore } from "@/stores/sd";
import { useAccountStore } from "@/stores/account";
import { mapState, mapWritableState } from "pinia";
import { FirebaseFirestore, DocumentSnapshot } from "@firebase/firestore-types";
import { StudioDetailsOnFirestore } from "@/types";
@Component({
  computed: {
    ...mapWritableState(useSDStore, ["studioID"]),
    ...mapState(useAccountStore, ["userEmail"])
  }
})
export default class TeacherDashboard extends Vue {
  readonly $appDB!: FirebaseFirestore;

  readonly userEmail!: string | undefined;
  studioID!: string | null;

  message = "";
  sentMessages: Array<string> = [];
  activeMembers: Array<string> = [];

  mounted(): void {
    console.debug(
      "TeacherDashboard::mounted() with socket",
      this.studioID,
      "User email",
      this.userEmail
    );

    this.$appDB
      .doc(`sessions/${this.studioID}`)
      .onSnapshot((ds: DocumentSnapshot) => {
        if (ds.exists) {
          const { members } = ds.data() as StudioDetailsOnFirestore;
          console.debug("Session data updated", members);
          this.activeMembers.splice(0);
          this.activeMembers.push(...members);
        }
      });
    if (this.userEmail)
      this.$socket.client.emit("teacher-join", {
        who: this.userEmail,
        isTeacher: true
      });
    else {
      alert("Email is undefined");
    }
  }

  beforeUnMount(): void {
    console.debug("TeacherDashboard::beforeUnmount()");
  }

  broadcastMessage(): void {
    console.debug("About to broadcast", this.message);
    this.$socket.client.emit("notify-all", {
      room: `chat-${this.studioID}`,
      message: this.message
    });
    this.sentMessages.push(this.message);
    this.message = "";
  }

  stopStudio(): void {
    this.$socket.client.emit("teacher-leave");
    this.studioID = null;
    this.$router.back();
  }
}
</script>
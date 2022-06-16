<template>
  <div>
    <p class="text-h5">Teacher Studio Dashboard</p>
    <code>Socket ID: {{studioID}}</code>
    <v-btn @click="stopStudio"
      small>
      <v-icon left>mdi-close</v-icon>Close Studio
    </v-btn>
    <v-sheet outlined
      class="rounded-lg ma-2">
      <v-container>
        <v-row align="baseline">
          <v-col cols="auto">
            <v-switch v-model="showLeftPane"
              dense
              label="Show left panel"></v-switch>
          </v-col>
          <v-col cols="auto">
            <v-switch v-model="showRightPane"
              dense
              label="`Show right panel`"></v-switch>
          </v-col>
          <v-col cols="auto">
            <v-btn small
              @click="broadcastUIControl">Broadcast</v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
    <p v-for="(m,pos) in sentMessages"
      :key="pos">
      {{m}}
    </p>
    <p>Participants: {{activeMembers.join(", ")}}</p>
    <v-textarea v-model="message"
      rows="3"
      outlined
      color="secondary"
      class="ma-3">

    </v-textarea>
    <v-btn small
      @click="broadcastMessage">Broadcast</v-btn>
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
  showLeftPane = true;
  showRightPane = true;

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
  broadcastUIControl(): void {
    // console.debug("Sending ui-control event");
    this.$socket.client.emit("ui-control", {
      showLeftPane: this.showLeftPane,
      showRightPane: this.showRightPane
    });
  }
}
</script>
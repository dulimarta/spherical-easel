<template>
  <div>
    <span>
      <template v-if="userRole === 'instructor'">
        <v-tooltip bottom
          left>
          <template #activator="{on}">
            <v-icon v-on="on"
              class="mx-2"
              @click="prepareToLaunchStudio">mdi-human-male-board</v-icon>
          </template>
          <span>Create a new studio</span>
        </v-tooltip>
      </template>
      <template v-else>
        <template v-if="!studioName">
          <v-tooltip bottom>
            <template #activator="{on}">
              <v-icon class="mx-2"
                v-on="on"
                @click="prepareToJoinStudio">mdi-google-classroom</v-icon>
            </template>
            <span>Join a studio</span>
          </v-tooltip>
        </template>
        <template v-else>
          <span>In {{studioName}}</span>
        </template>
      </template>
    </span>
    <Dialog ref="initiateSessionDialog"
      title="Session"
      yes-text="Create"
      no-text="Cancel"
      :yes-action="doLaunchStudio"
      max-width="40%">
      You are about to create a new teacher session
    </Dialog>
    <Dialog ref="studioListDialog"
      max-width="40%"
      :yes-text="availableSessions.length > 0 ? 'Cancel' : 'OK'">
      <template v-if="availableSessions.length > 0">
        <p class="text-h5">Please select a studio to join</p>
        <table>
          <thead>
            <tr>
              <th class="text-left">Session ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s,pos) in availableSessions"
              :key="pos">
              <td class="text-body-1">{{s}}</td>
              <td>
                <v-btn @click="joinSession(s)">Join</v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <p class="text-h5"
        v-else>No active studio sessions</p>
    </Dialog>
    <v-snackbar timeout="3000"
      v-model="showBroadcastMessage">
      Broadcast message: {{broadcastMessage}}
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import VueComponent from "vue";
import { Socket, io } from "socket.io-client";
import { Component, Vue } from "vue-property-decorator";
import { mapActions, mapState } from "pinia";
import { useSDStore } from "@/stores/sd";
import { useAccountStore } from "@/stores/account";
import Dialog, { DialogAction } from "./Dialog.vue";
import {
  FirebaseFirestore,
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";

@Component({
  components: { Dialog },
  methods: {
    ...mapActions(useSDStore, ["setStudioSocket"])
  },
  computed: {
    ...mapState(useAccountStore, ["userRole"])
  }
})
export default class StudioSession extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly setStudioSocket!: (s: Socket | null) => void;
  readonly userRole!: string;
  $refs!: {
    initiateSessionDialog: VueComponent & DialogAction;
    studioListDialog: VueComponent & DialogAction;
  };
  studioName: string | null = null;
  myRole = "none";
  studioSocket: Socket | null = null;
  showBroadcastMessage = false;
  broadcastMessage = "";

  availableSessions: Array<string> = [];

  prepareToLaunchStudio(): void {
    console.debug("Preparing to launch studio?", this.studioSocket);
    if (this.studioSocket) {
      this.$router.push({ path: "/teacher-dashboard" });
    } else {
      this.$refs.initiateSessionDialog.show();
    }
  }

  doLaunchStudio(): void {
    // Create a client socket that connects to
    const socket = io(
      process.env.VUE_APP_Studio_SERVER_URL || "http://localhost:4000"
    );
    // socket.on("connect", () => {
    //   console.debug(`Socket ${socket.id} received a new connection`);
    // });
    this.setStudioSocket(socket);
    this.$refs.initiateSessionDialog.hide();
    this.$router.push({ name: "Teacher Dashboard" });
  }

  prepareToJoinStudio(): void {
    console.debug("About to join a studio");
    this.$appDB
      .collection("sessions")
      .get()
      .then((qs: QuerySnapshot) => {
        this.availableSessions.splice(0);
        qs.docs.forEach((qdoc: QueryDocumentSnapshot) => {
          this.availableSessions.push(qdoc.id);
        });
        this.$refs.studioListDialog.show();
      })
      .catch((err: any) => {
        console.debug("Error getting documents?", err);
      });

    // if (this.studioSocket === null) this.$router.push({ path: "/studio-list" });
    // else this.$router.push({ path: "/in-studio" });
  }

  joinSession(session: string): void {
    console.debug("Attempt rejoin studio", session);
    this.studioName = session;
    this.studioSocket = io(
      process.env.VUE_APP_SESSION_SERVER_URL || "http://localhost:4000"
    );
    this.setStudioSocket(this.studioSocket);
    this.$refs.studioListDialog.hide();
    this.studioSocket.on("connect", () => {
      this.studioSocket?.emit("student-join", { who: "Hans", session });
    });
    this.studioSocket.on("notify-all", (msg: string) => {
      console.debug("Got a broadcast message", msg);
      this.broadcastMessage = msg;
      this.showBroadcastMessage = true;
    });
    // this.$router.push({
    //   name: "StudioActivity",
    //   params: { session }
    // });
  }
}
</script>
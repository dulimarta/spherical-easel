<template>
  <div>
    <span>

      <template v-if="userRole === 'instructor'">
        <template v-if="!$route.path.endsWith('teacher-dashboard')">
          <v-tooltip bottom
            left>
            <template #activator="{on}">
              <v-icon v-on="on"
                class="mx-2"
                @click="prepareToLaunchStudio">mdi-human-male-board
              </v-icon>
            </template>
            <span v-if="studioID === null">Create a new studio</span>
            <span v-else>Studio {{studioID}}</span>
          </v-tooltip>
        </template>
      </template>
      <template v-else>
        <template v-if="!studioID">
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
          <span>{{studioID.substring(0,5)}}</span>
          <v-icon @click="leaveSession">mdi-sync-off</v-icon>
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
      max-width="60%"
      :yes-text="availableSessions.length > 0 ? 'Cancel' : 'OK'">
      <template v-if="availableSessions.length > 0">
        <p class="text-h5">Please select a studio to join</p>
        <v-simple-table>
          <thead>
            <tr>
              <th class="text-left">ID</th>
              <th>Owner</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s,pos) in availableSessions"
              :key="pos">
              <td class="text-body-1">{{s.id.substring(0,6)}}</td>
              <td class="text-body-1">{{s.owner}}</td>
              <td class="text-body-1">{{s.createdAt}}</td>
              <td>
                <v-btn @click="joinSession(s.id)"
                  small>Join</v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
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
import { mapActions, mapState, mapWritableState } from "pinia";
import { useSDStore } from "@/stores/sd";
import { useAccountStore } from "@/stores/account";
import Dialog, { DialogAction } from "./Dialog.vue";
import {
  FirebaseFirestore,
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";
import { DateTime } from "luxon";
import { interpret } from "@/commands/CommandInterpreter";
import { useSEStore } from "@/stores/se";

type StudioDetailOnFirestore = {
  id: string;
  owner: string;
  createdAt: string;
};
@Component({
  components: { Dialog },
  methods: {
    ...mapActions(useSEStore, ["updateDisplay"])
  },
  computed: {
    ...mapState(useAccountStore, ["userRole"]),
    ...mapWritableState(useSDStore, ["broadcast", "studioID"])
  }
})
export default class StudioSession extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly userRole!: string;
  readonly updateDisplay!: () => void;

  studioID!: string | null;
  broadcast!: boolean;

  $refs!: {
    initiateSessionDialog: VueComponent & DialogAction;
    studioListDialog: VueComponent & DialogAction;
  };
  myRole = "none";
  showBroadcastMessage = false;
  broadcastMessage = "";
  // SERVER_SOCKET_URL =
  //   process.env.VUE_APP_STUDIO_SERVER_URL || "http://localhost:4000";

  availableSessions: Array<StudioDetailOnFirestore> = [];

  prepareToLaunchStudio(): void {
    // console.debug("Preparing to launch studio?", this.SERVER_SOCKET_URL);
    if (this.studioID) {
      this.$router.push({
        name: "Teacher Dashboard",
        params: {
          id: this.studioID
        }
      });
    } else {
      this.$refs.initiateSessionDialog.show();
    }
  }

  doLaunchStudio(): void {
    // Create a client socket that connects to our backend server
    // socket.on("connect", () => {
    console.debug("Socket connected", this.$socket.client.id);
    this.studioID = this.$socket.client.id;
    this.broadcast = true;
    // Transition to the next route ONLY after the socket is connected
    this.$refs.initiateSessionDialog.hide();
    this.$router.push({
      name: "Teacher Dashboard"
    });
    // });
  }

  prepareToJoinStudio(): void {
    console.debug("About to join a studio");
    this.$appDB
      .collection("sessions")
      .get()
      .then((qs: QuerySnapshot) => {
        this.availableSessions.splice(0);
        const tmpData: Array<StudioDetailOnFirestore> = [];
        qs.docs.forEach((qdoc: QueryDocumentSnapshot) => {
          const { owner, createdAt } = qdoc.data() as StudioDetailOnFirestore;
          tmpData.push({
            id: qdoc.id,
            owner,
            createdAt
          });
        });
        tmpData.sort(
          (a: StudioDetailOnFirestore, b: StudioDetailOnFirestore) => {
            if (a.createdAt < b.createdAt) return +1;
            if (a.createdAt > b.createdAt) return -1;
            else return 0;
          }
        );
        this.availableSessions.push(
          ...tmpData.map((z: StudioDetailOnFirestore) => {
            const t = DateTime.fromISO(z.createdAt).toRelative({
              style: "short"
            });
            return {
              id: z.id,
              owner: z.owner,
              createdAt: t!
            };
          })
        );
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
    this.studioID = session;
    this.$refs.studioListDialog.hide();
    // const socket = io(this.SERVER_SOCKET_URL);
    // this.setStudioSocket(socket);
    // socket.on("connect", () => {
    //   socket?.emit("student-join", { who: "Anonymous", session });
    // });
    this.$socket.client.emit("student-join", { who: "Anonymous", session });

    // Setup listener for text message broadcast
    this.$socket.$subscribe("notify-all", (msg: string) => {
      this.broadcastMessage = msg;
      this.showBroadcastMessage = true;
    });
    // Setup listener for command broadcast
    this.$socket.$subscribe("bcast-cmd", (cmd: string) => {
      // TODO: remove the following debugging if-else
      if (cmd.startsWith("[")) {
        const arr = JSON.parse(cmd) as Array<string>;
        arr.forEach((s: string, pos: number) => {
          console.debug(`Broadcast group cmd ${pos}: ${s.substring(0, 20)}`);
        });
      } else console.debug(`Broadcast cmd: ${cmd.substring(0, 20)}`);
      // Use JSON.parse when the incoming command encodes an array
      interpret(cmd.startsWith("[") ? JSON.parse(cmd) : cmd);
      // TODO: Can we do it without calling updateDisplay?
      this.updateDisplay();
    });
    // this.$router.push({
    //   name: "StudioActivity",
    //   params: { session }
    // });
  }

  leaveSession() {
    console.debug("Disconnecting from session");
    this.studioID = null;
    // this.setStudioSocket(null);
  }
}
</script>
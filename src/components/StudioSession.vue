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
      :yes-text="myPreviousSessions.length > 0 ? 'Create & Delete' :
      'Create'"
      no-text="Cancel"
      :yes-action="doLaunchStudio"
      max-width="40%">
      <template v-if="myPreviousSessions.length > 0">
        <span class="text-h6">You have the following existing
          sessions</span>
        <ol>
          <li v-for="s in myPreviousSessions"
            :key="s.id">
            {{s.id}}
          </li>
        </ol>
        <span class="text-h6">Delete old sessions and create a new
          one?</span>
      </template>
      <template v-else> You are about to create a new teacher session
      </template>
    </Dialog>
    <Dialog ref="studioListDialog"
      title="Join a Studio"
      max-width="60%"
      :yes-text="availableSessions.length > 0 ? 'Cancel' : 'OK'">
      <template v-if="availableSessions.length > 0">
        <v-text-field type="text"
          dense
          outlined
          placeholder="Your name in studio"
          v-model="userName"></v-text-field>

        <v-simple-table id="sessionList">
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
<style scoped>
#sessionList {
  margin-bottom: 2em;
  border: 1px solid gray;
}
</style>>
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
import { StudioDetailsOnFirestore } from "@/types";
@Component({
  components: { Dialog },
  methods: {
    ...mapActions(useSEStore, ["updateDisplay"])
  },
  computed: {
    ...mapState(useAccountStore, ["userRole", "userEmail"]),
    ...mapWritableState(useSDStore, ["broadcast", "studioID"])
  }
})
export default class StudioSession extends Vue {
  readonly $appDB!: FirebaseFirestore;
  readonly userRole!: string;
  readonly userEmail!: string;
  readonly updateDisplay!: () => void;

  studioID!: string | null;
  broadcast!: boolean;

  $refs!: {
    initiateSessionDialog: VueComponent & DialogAction;
    studioListDialog: VueComponent & DialogAction;
  };
  myRole = "none";
  userName = ""; // Student name for joining a studio

  showBroadcastMessage = false;
  broadcastMessage = "";
  // SERVER_SOCKET_URL =
  //   process.env.VUE_APP_STUDIO_SERVER_URL || "http://localhost:4000";

  availableSessions: Array<StudioDetailsOnFirestore> = [];
  myPreviousSessions: Array<StudioDetailsOnFirestore> = [];

  async collectSessionsByName(
    owner: string
  ): Promise<Array<StudioDetailsOnFirestore>> {
    return await this.$appDB
      .collection("sessions")
      .where("owner", "==", owner)
      .get()
      .then((qs: QuerySnapshot) => {
        this.availableSessions.splice(0);
        const tmpData: Array<StudioDetailsOnFirestore> = [];
        qs.docs.forEach((qdoc: QueryDocumentSnapshot) => {
          const { owner, createdAt, members } =
            qdoc.data() as StudioDetailsOnFirestore;
          // Exclude the current session from the search
          if (qdoc.id !== this.$socket.client.id)
            tmpData.push({
              id: qdoc.id,
              owner,
              createdAt,
              members
            });
        });
        return tmpData;
      });
  }

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
      this.myPreviousSessions.splice(0);
      this.collectSessionsByName(this.userEmail).then(
        (arr: Array<StudioDetailsOnFirestore>) => {
          this.myPreviousSessions.push(...arr);
          this.$refs.initiateSessionDialog.show();
        }
      );
    }
  }

  async doLaunchStudio(): Promise<void> {
    const allTasks = this.myPreviousSessions.map(
      (s: StudioDetailsOnFirestore) =>
        this.$appDB.collection("sessions").doc(s.id).delete()
    );

    await Promise.all(allTasks);

    this.studioID = this.$socket.client.id;
    this.broadcast = true;
    // Transition to the next route ONLY after the socket is connected
    this.$refs.initiateSessionDialog.hide();
    this.$router.push({
      name: "Teacher Dashboard"
    });
  }

  prepareToJoinStudio(): void {
    console.debug("About to join a studio");
    this.$appDB
      .collection("sessions")
      .get()
      .then((qs: QuerySnapshot) => {
        this.availableSessions.splice(0);
        const tmpData: Array<StudioDetailsOnFirestore> = [];
        qs.docs.forEach((qdoc: QueryDocumentSnapshot) => {
          const { owner, createdAt, members } =
            qdoc.data() as StudioDetailsOnFirestore;
          tmpData.push({
            id: qdoc.id,
            owner,
            createdAt,
            members
          });
        });
        tmpData.sort(
          (a: StudioDetailsOnFirestore, b: StudioDetailsOnFirestore) => {
            if (a.createdAt < b.createdAt) return +1;
            if (a.createdAt > b.createdAt) return -1;
            else return 0;
          }
        );
        this.availableSessions.push(
          ...tmpData.map((z: StudioDetailsOnFirestore) => {
            const t = DateTime.fromISO(z.createdAt).toRelative({
              style: "short"
            });
            return {
              id: z.id,
              owner: z.owner,
              createdAt: t!,
              members: z.members
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
    console.debug("Attempt join studio", session);
    this.studioID = session;
    this.$refs.studioListDialog.hide();
    // const socket = io(this.SERVER_SOCKET_URL);
    // this.setStudioSocket(socket);
    // socket.on("connect", () => {
    //   socket?.emit("student-join", { who: "Anonymous", session });
    // });
    this.$socket.client.emit("student-join", {
      who: this.userName || "<N/A>",
      session
    });

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
    this.$socket.$subscribe("studio-end", () => {
      this.broadcastMessage = `Studio ${this.studioID} has ended`;
      this.showBroadcastMessage = true;
      this.studioID = null;
    });
  }

  leaveSession() {
    console.debug("Leaving session", this.studioID);
    this.$socket.client.emit("student-leave", {
      who: this.userName || "<N/A>",
      session: this.studioID
    });
    this.studioID = null;
  }
}
</script>
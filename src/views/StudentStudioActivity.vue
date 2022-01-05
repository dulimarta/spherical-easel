<template>
  <div>
    <h2>Student Activity</h2>
    <p>StudioID: {{session}}</p>

    <ol>
      <li v-for="(m,pos) in receivedMessages"
        :key="pos">{{m}}</li>
    </ol>
  </div>
</template>

<script lang="ts">
import { StudioState } from "@/types";
import { Socket } from "socket.io-client";
import { Component, Prop, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
const SD = namespace("sd");

@Component
export default class StudentActivity extends Vue {
  @Prop() session!: string;

  @SD.State((s: StudioState) => s.studioSocket)
  readonly studentStudioSocket!: Socket | null;

  receivedMessages: Array<string> = [];
  mounted(): void {
    console.debug(
      "Which session?",
      this.session,
      " on socket ",
      this.studentStudioSocket?.id
    );
    if (this.studentStudioSocket !== null) {
      const sockId = this.studentStudioSocket.id;

      this.studentStudioSocket.on("connect", () => {
        this.studentStudioSocket?.emit("student-join", {
          who: "John Doe",
          session: this.session
        });
      });
      this.studentStudioSocket.on("disconnect", () => {
        console.debug("Student disconnected from socket", sockId);
      });
      this.studentStudioSocket.on("notify-all", (msg: string) => {
        // console.debug("Students received broadcast", msg);
        this.receivedMessages.push(msg)
      });
    }
  }
}
</script>
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
import { useSDStore } from "@/stores/sd";
import { mapActions, mapState } from "pinia";
import { Socket } from "socket.io-client";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  computed: {
    ...mapState(useSDStore, ["studioSocket"])
  }
})
export default class StudentActivity extends Vue {
  @Prop() session!: string;

  readonly studioSocket!: Socket | null;

  receivedMessages: Array<string> = [];
  mounted(): void {
    console.debug(
      "Which session?",
      this.session,
      " on socket ",
      this.studioSocket?.id
    );
    if (this.studioSocket !== null) {
      const sockId = this.studioSocket.id;

      this.studioSocket.on("connect", () => {
        this.studioSocket?.emit("student-join", {
          who: "John Doe",
          session: this.session
        });
      });
      this.studioSocket.on("disconnect", () => {
        console.debug("Student disconnected from socket", sockId);
      });
      this.studioSocket.on("notify-all", (msg: string) => {
        // console.debug("Students received broadcast", msg);
        this.receivedMessages.push(msg);
      });
    }
  }
}
</script>
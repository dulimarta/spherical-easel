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
    // ...mapState(useSDStore, ["studioID"])
  }
})
export default class StudentActivity extends Vue {
  // @Prop() session!: string;

  readonly studioID!: string | null;

  receivedMessages: Array<string> = [];
  mounted(): void {
    console.debug("Which session?", this.studioID);

    this.$socket.$subscribe("connect", () => {
      this.$socket.client.emit("student-join", {
        who: "John Doe",
        session: this.studioID
      });
    });
    this.$socket.$subscribe("disconnect", () => {
      console.debug("Student disconnected from socket", this.studioID);
    });
    this.$socket.$subscribe("notify-all", (msg: string) => {
      // console.debug("Students received broadcast", msg);
      this.receivedMessages.push(msg);
    });
  }
}
</script>
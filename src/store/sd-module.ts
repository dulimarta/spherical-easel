import { StudioState } from "@/types";
import { Socket } from "socket.io-client";
import { Module, Mutation, VuexModule } from "vuex-module-decorators";

// SD: Studio Data
@Module({ name: "sd", namespaced: true })
export default class StudioStore extends VuexModule implements StudioState {
  studioSocket: Socket | null = null;

  @Mutation
  setStudioSocket(sock: Socket | null): void {
    this.studioSocket = sock;
  }

}
import { StudioState } from "@/types";
import { defineStore } from "pinia";
import { Socket } from "socket.io-client";

// SD: Studio Data
export const useSDStore = defineStore({
  id: "sd",
  state: (): StudioState => ({
    studioSocket: null
  }),
  actions: {
    setStudioSocket(sock: Socket | null): void {
      this.studioSocket = sock;
    }
  }
});

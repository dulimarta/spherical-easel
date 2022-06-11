import { StudioState } from "@/types";
import { defineStore, StoreActions, StoreGetters, StoreState } from "pinia";
import { Socket } from "socket.io-client";

// SD: Studio Data
export const useSDStore = defineStore({
  id: "sd",
  state: (): StudioState => ({
    studioSocket: null,
    broadcast: false
  }),
  actions: {
    setStudioSocket(sock: Socket | null): void {
      this.studioSocket = sock;
    }
  }
});

export type SDStoreType = StoreActions<ReturnType<typeof useSDStore>> &
  StoreGetters<ReturnType<typeof useSDStore>> &
  StoreState<ReturnType<typeof useSDStore>>;

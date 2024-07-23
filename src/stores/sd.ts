import { defineStore } from "pinia";
import {ref} from "vue"
import {io, Socket} from "socket.io-client"

export const useStudioStore = defineStore("studio", () => {
  const socket: Socket = io("http://localhost:4000")
  console.debug("StudioStore: Socket id is", socket)
  const socketID = ref(socket.id)

  async function createStudio(studioName: string, who: string): Promise<string> {
    const id:string = await socket.emitWithAck('teacher-join', {
      instructor: who, name: studioName
    })
    console.debug("Studio ID", id)
    return id
  }
  return {
    /* state */
    socketID,

    /* functions */
    createStudio,
  }
})
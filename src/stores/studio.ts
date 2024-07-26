import { defineStore } from "pinia";
import { ref, Ref, reactive } from "vue";
import { io, Socket } from "socket.io-client";

export type StudioDetails = {
  id: string;
  instructor: string;
  name: string;
  participants: Array<string>;
};

export const useTeacherStudioStore = defineStore("studio-teacher", () => {
  const socket: Socket = io("http://localhost:4000", {
    autoConnect: false
  });
  socket.on('connect', () => {
    console.debug("Teacher StudioStore: Socket is connected with ID", socket.id);
  })
  const myStudio: Ref<StudioDetails|null> = ref(null)
  // const socketID = ref(socket.id);
  // const participants: Ref<Array<string>> = ref([])

  async function createStudio(
    studioName: string,
    who: string
  ): Promise<string> {
    if (!socket.connected) {
      socket.connect()
    }
    const id: string = await socket.emitWithAck("open-studio", {
      instructor: who,
      name: studioName
    });

    myStudio.value = {
      id,
      instructor: who,
      name: studioName,
      participants: []
    }
    console.debug("Studio ID", id);
    socket.on('new-participant', (arg:string) => {
      console.debug("Teacher gets a new student", arg)
      myStudio.value?.participants.push(arg)
    })
    socket.on('drop-participant', (arg:string) => {
      console.debug(`Attempts to drop participant ${arg} from ${myStudio.value?.id}`)
      if (myStudio.value) {
        const pos = myStudio.value.participants.findIndex(p => p === arg)
        if (pos >= 0)
          myStudio.value?.participants.splice(pos, 1)
      }
    })

    return id;
  }

  function stopStudio() {
    socket.emit("teacher-leave")
  }
  return {
    /* state */
    myStudio,
    // socketID,

    /* functions */
    createStudio
  };
});

export const useStudentStudioStore = defineStore("studio-student", () => {
  const socket: Socket = io("http://localhost:4000", {
    autoConnect: false
  });
  const incomingMessage = ref("");
  const activeStudioName: Ref<string | null> = ref(null);
  const participantName = ref("");
  socket.on('connect', () => {
    console.debug("Student StudioStore: Socket is connected with ID", socket.id);
  })

  async function getAvailableStudios(): Promise<Array<StudioDetails>> {
    if (!socket.connected) {
      socket.connect()
    }
    console.debug("Checking studio query.....");
    const out = await socket.emitWithAck("studio-query");
    console.debug("Available studios", out);
    return JSON.parse(out);
  }

  function joinAsStudent(studioId: string, myName: string) {
    activeStudioName.value = studioId;
    participantName.value = myName;
    socket.emit("student-join", { who: myName, session: studioId });
    socket.on("notify-all", (msg: string) => {
      incomingMessage.value = msg;
    });
    socket.on("bcast-cmd", (cmd: string) => {
      console.debug("Receive command to execute");
    });
    socket.on("studio-end", () => {
      incomingMessage.value = `Studio ${activeStudioName.value} has ended`;
      activeStudioName.value = null;
    });
  }

  async function leaveStudio() {
    const result = await socket.emitWithAck("student-leave", {
      who: participantName.value,
      session: activeStudioName.value
    });
    if (result) {
      console.debug("Leaving studio before", activeStudioName.value)
      activeStudioName.value = null
      participantName.value = ""
      console.debug("Leaving studio after", activeStudioName.value)
    }
    else {
      console.debug("Error while attempting to leave studio")
    }
  }
  return {
    /* state */
    activeStudioName,
    participantName,
    /* actions */
    getAvailableStudios,
    joinAsStudent,
    leaveStudio
  };
});

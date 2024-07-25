import { defineStore } from "pinia";
import { ref, Ref } from "vue";
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
  const socketID = ref(socket.id);
  const participants: Ref<Array<string>> = ref([])

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

    console.debug("Studio ID", id);
    socket.on('new-participant', (arg:string) => {
      console.debug("Teacher gets a new student", arg)
      participants.value.push(arg)
    })

    return id;
  }

  function stopStudio() {
    socket.emit("teacher-leave")
  }
  return {
    /* state */
    participants,
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
  const studioIParticipate: Ref<string | null> = ref(null);
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
    studioIParticipate.value = studioId;
    participantName.value = myName;
    socket.emit("student-join", { who: myName, session: studioId });
    socket.on("notify-all", (msg: string) => {
      incomingMessage.value = msg;
    });
    socket.on("bcast-cmd", (cmd: string) => {
      console.debug("Receive command to execute");
    });
    socket.on("studio-end", () => {
      incomingMessage.value = `Studio ${studioIParticipate} has ended`;
      studioIParticipate.value = null;
    });
  }

  async function leaveStudio() {
    await socket.emitWithAck("student-leave", {
      who: participantName,
      session: studioIParticipate.value
    });
    studioIParticipate.value = null
  }
  return {
    getAvailableStudios,
    joinAsStudent,
    leaveStudio
  };
});

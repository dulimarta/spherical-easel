import { defineStore } from "pinia";
import { ref, Ref, reactive, computed } from "vue";
import { io, Socket } from "socket.io-client";
import EventBus from "@/eventHandlers/EventBus";
import { interpret } from "@/commands/CommandInterpreter";
import { useSEStore } from "./se";

export type StudioDetails = {
  id: string;
  instructor: string;
  name: string;
  participants: Array<string>;
};

const serverAddr =
import.meta.env.VITE_APP_SERVER_BASEURL +
":" +
import.meta.env.VITE_APP_SERVER_PORT;

export const useTeacherStudioStore = defineStore("studio-teacher", () => {
  const socket: Socket = io(serverAddr, {
    autoConnect: false
  });
  const myStudio: Ref<StudioDetails | null> = ref(null);

  const socketID = computed(() => socket.id)
  socket.on("connect", () => {
    console.debug(
      "Teacher StudioStore: Socket is connected with ID",
      socket.id
    );
  });

  async function createStudio(
    studioName: string,
    who: string
  ): Promise<string> {
    if (!socket.connected) {
      socket.connect();
    }
    const id: string = await socket.emitWithAck("open-studio", {
      instructor: who,
      name: studioName
    });
    EventBus.fire("toggle-command-broadcast", { socket, id });

    myStudio.value = {
      id,
      instructor: who,
      name: studioName,
      participants: []
    };
    console.debug("Studio ID", id);
    socket.on("new-participant", (arg: string) => {
      console.debug("Teacher gets a new student", arg);
      myStudio.value?.participants.push(arg);
    });
    socket.on("drop-participant", (arg: string) => {
      console.debug(
        `Attempts to drop participant ${arg} from ${myStudio.value?.id}`
      );
      if (myStudio.value) {
        const pos = myStudio.value.participants.findIndex(p => p === arg);
        if (pos >= 0) myStudio.value?.participants.splice(pos, 1);
      }
    });

    return id;
  }

  function stopStudio() {
    console.debug("Inside stopStudio()", myStudio.value, "xxxx");
    if (myStudio.value) {
      socket.emit("close-studio", myStudio.value.id);
      console.debug("Setting myStudio to null");
      myStudio.value = null;
    }
    EventBus.fire("toggle-command-broadcast", { socket: null, id: "" });
  }

  function broadcastMessage(m: string) {
    socket.emit("notify-all", {
      room: "chat:" + myStudio.value!.id,
      message: m
    });
  }
  return {
    /* state */
    myStudio,
    socketID,

    /* functions */
    broadcastMessage,
    createStudio,
    stopStudio
  };
});

export const useStudentStudioStore = defineStore("studio-student", () => {
  const socket: Socket = io(serverAddr, {
    autoConnect: false
  });
  const socketID = computed(() => socket.id)

  const seStore = useSEStore()
  const incomingMessage = ref("");
  const activeStudioId: Ref<string | null> = ref(null);
  const activeStudioTitle: Ref<string | null> = ref(null);
  const participantName = ref("");
  socket.on("connect", () => {
    console.debug(
      "Student StudioStore: Socket is connected with ID",
      socket.id
    );
  });

  async function getAvailableStudios(): Promise<Array<StudioDetails>> {
    if (!socket.connected) {
      socket.connect();
    }
    console.debug("Checking studio query.....");
    const out = await socket.emitWithAck("studio-query");
    console.debug("Available studios", out);
    return JSON.parse(out);
  }

  function joinAsStudent(
    studioId: string,
    studioTitle: string,
    myName: string
  ) {
    activeStudioId.value = studioId;
    activeStudioTitle.value = studioTitle;
    participantName.value = myName;
    incomingMessage.value = "";
    socket.emit("student-join", { who: myName, session: studioId });
    socket.on("chat-msg", (msg: string) => {
      incomingMessage.value = msg;
    });
    socket.on("exec-cmd", (cmd: string) => {
      console.debug("Receive command to execute", cmd);
      interpret(JSON.parse(cmd));
      seStore.updateDisplay()
    });
    socket.on("studio-end", () => {
      console.debug("This student must leave the current studio");
      incomingMessage.value = `Studio ${activeStudioId.value} has ended`;
      activeStudioId.value = null;
      activeStudioTitle.value = null;
    });
  }

  async function leaveStudio(): Promise<boolean> {
    const result = await socket.emitWithAck("student-leave", {
      who: participantName.value,
      session: activeStudioId.value
    });
    if (result) {
      activeStudioId.value = null;
      activeStudioTitle.value = null;
      participantName.value = "";
    } else {
      console.debug("Error while attempting to leave studio");
    }
    return result;
  }
  return {
    /* state */
    activeStudioId,
    activeStudioTitle,
    incomingMessage,
    participantName,
    socketID,

    /* actions */
    getAvailableStudios,
    joinAsStudent,
    leaveStudio
  };
});

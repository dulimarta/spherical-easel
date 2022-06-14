import express, { Request, Response } from "express";
import { createServer } from "http";
import { Socket, Server } from "socket.io";
import firebase from "firebase";
import { firebaseFirestore } from "../src/firebase-backend";
import { DateTime } from "luxon";
const app = express();
const router = express.Router();
const my_server = createServer(app);

const server_io = new Server(my_server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

server_io.on("connection", (socket: Socket) => {
  console.debug(`Got a new connection from client ${socket.id}`);

  socket.on("disconnect", (why: string) => {
    console.debug(`Socket ${socket.id} disconnected because ${why}`);
    // firebaseFirestore
    //   .collection("sessions")
    //   .doc(socket.id)
    //   .delete()
    //   .then(() => {
    //     console.debug(`Socket id ${socket.id} deleted`);
    //   });
  });

  socket.on("teacher-join", async (args: any) => {
    socket.join(`chat-${socket.id}`);
    console.debug("Server received 'teacher-join' event", args, socket.id);
    await firebaseFirestore.collection("sessions").doc(socket.id).set({
      owner: args.who,
      createdAt: DateTime.now().toUTC().toISO(),
      members: []
    });
  });

  socket.on("teacher-leave", async () => {
    console.debug("Server received 'teacher-leave' event", socket.id);
    socket.to(`chat-${socket.id}`).emit("studio-end");
    socket.leave(`chat-${socket.id}`);
    socket.leave(`cmd-${socket.id}`);
    socket.disconnect();
    await firebaseFirestore.collection("sessions").doc(socket.id).delete();
  });

  socket.on("notify-all", (arg: { room: string; message: string }) => {
    console.debug("Server received 'notify-all", arg.room);
    if (arg.room.startsWith("chat-"))
      socket.to(arg.room).emit("notify-all", arg.message);
    else if (arg.room.startsWith("cmd-"))
      socket.to(arg.room).emit("bcast-cmd", arg.message);
  });

  socket.on("student-join", async (arg: { session: string; who: string }) => {
    console.debug(
      "Server received 'student-join' from ",
      arg.who,
      "to",
      arg.session,
      "on socket",
      socket.id
    );

    const msgRoom = `chat-${arg.session}`; // For text messages
    const cmdRoom = `cmd-${arg.session}`; // For geometric commands
    socket.join(msgRoom);
    socket.join(cmdRoom);
    await firebaseFirestore
      .collection("sessions")
      .doc(arg.session)
      .update({ members: firebase.firestore.FieldValue.arrayUnion(arg.who) });
  });

  socket.on("student-leave", async (arg: { session: string; who: string }) => {
    console.debug(
      "Server received 'student-leave' from ",
      arg.who,
      "to",
      arg.session,
      "on socket",
      socket.id
    );

    const msgRoom = `chat-${arg.session}`; // For text messages
    const cmdRoom = `cmd-${arg.session}`; // For geometric commands
    socket.leave(msgRoom);
    socket.leave(cmdRoom);
    await firebaseFirestore
      .collection("sessions")
      .doc(arg.session)
      .update({ members: firebase.firestore.FieldValue.arrayRemove(arg.who) });
  });
});

// Full path to this entry is /geo/sessions
router.get("/sessions", (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  const rooms = server_io.of("/").adapter.rooms;

  console.debug("Incoming request is", req.originalUrl);
  console.debug("Rooms", rooms);

  if (rooms.size > 0) {
    res.write("<h1>List of rooms</h1>");
    res.write("<ol>");
    for (let r of rooms.keys()) {
      if (r.startsWith("chat-")) res.write(`<li>${r}</li>`);
    }
    res.write("</ol>");
  } else {
    res.write("<h1>No active sessions detected </h1>");
  }
  res.end();
});

// router.get("/student", (req: Request, res: Response) => {
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   console.debug("Incoming request is", req);
//   res.end();
// });

// The last component of the path below must match the
// File name under src/app-server
app.use("/.netlify/functions/geo", router);
app.use("/geo", router);
const port = process.env.PORT || 4000;
my_server.listen(port, () => {
  console.log(`ExpressJS server listening on port ${port}`);
});

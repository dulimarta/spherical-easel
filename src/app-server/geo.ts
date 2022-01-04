import express, { Request, Response } from "express";
import { createServer } from "http";
// import serverless from "serverless-http";
import { Socket, Server } from "socket.io";
import { firebaseFirestore } from "./../firebase-backend";
import {
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";

const app = express();
const router = express.Router();
const my_server = createServer(app);

const io = new Server(my_server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket: Socket) => {
  console.debug("Got a new connection to ", socket.id);

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
  socket.on("teacher-join", args => {
    socket.join(`chat-${socket.id}`);
    console.debug("Server received 'teacher-join' event", args, socket.id);
    firebaseFirestore
      .collection("sessions")
      .doc(socket.id)
      .set({
        owner: "Hans"
      });
  });
  socket.on("teacher-leave", () => {
    console.debug("Server received 'teacher-leave' event", socket.id);
    socket.leave(`chat-${socket.id}`);
    socket.disconnect();
    firebaseFirestore
      .collection("sessions")
      .doc(socket.id)
      .delete();
  });

  socket.on('notify-all', (arg: {room: string, message: string}) => {
    console.debug("Server received 'notify-all", arg.room);
    socket.to(arg.room).emit('notify-all', arg.message)
  });

  socket.on("student-join", ({ session }) => {
    console.debug(
      "Server received 'student-join' event",
      session,
      "on socket",
      socket.id
    );
    const roomId = `chat-${session}`;
    socket.join(roomId);
    socket.to(roomId).emit("new-student", session);
  });
});

const APP_URL = "https://easelgeo.app";
router.get("/sessions", (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

  const rooms = io.of("/").adapter.rooms.keys();
  console.debug("Incoming request is", req.originalUrl);
  console.debug("Rooms", rooms);

  res.write("<h1>List of rooms</h1>");
  res.write("<ol>");
  for (let r of rooms) {
    console.debug("Room", r);
    if (r.startsWith("chat-")) res.write(`<li>${r}</li>`);
  }
  res.write("</ol>");
  res.end();
});

// router.get("/student", (req: Request, res: Response) => {
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   res.write(`<h1>You are a student. Proceed to <a href="${APP_URL}">EaselGeo</a></h1>`);
//   console.debug("Incoming request is", req);
//   res.end();
// });

// The last component of the path below must match the
// File name under src/app-server
app.use("/.netlify/functions/geo", router);
app.use("/geo", router);
// app.get("/", (req: Request, res: Response) =>{
//   res.send("I'm here again");
// })
my_server.listen(4000, () => {
  console.log("Listening on port 4000");
});

// export default app;
// export const handler = serverless(app);

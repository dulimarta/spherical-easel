// import express, {Request, Response} from "express";
// import {createServer} from "http";
// import serverless from "serverless-http";
import { Socket, Server } from "socket.io";
import { firebaseFirestore } from "./../firebase-backend";
import {
  QuerySnapshot,
  QueryDocumentSnapshot
} from "@firebase/firestore-types";

// const app = express();
// const router = express.Router()
// const my_server = createServer(app);

const io = new Server(4000, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket: Socket) => {
  console.debug("Got a new connection to ", socket.id);

  socket.on("disconnect", (why: string) => {
    console.debug("Socket disconnected because ", why);
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
  socket.on("student-join", ({ session }) => {
    console.debug("Server received 'student-join' event", session, "on socket", socket.id);
    const roomId = `chat-${session}`
    socket.join(roomId);
    socket.to(roomId).emit("new-student", session);
  });
});

const APP_URL = "https://easelgeo.app";
// router.get("/sessions", (req: Request, res: Response) => {
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   res.write(`<h1>You are a teacher. Proceed to <a href="${APP_URL}">EaselGeo</a></h1>`);
//   console.debug("Incoming request is", req);
//   res.end();
// });

// router.get("/student", (req: Request, res: Response) => {
//   res.writeHead(200, { 'Content-Type': 'text/html' });
//   res.write(`<h1>You are a student. Proceed to <a href="${APP_URL}">EaselGeo</a></h1>`);
//   console.debug("Incoming request is", req);
//   res.end();
// });

// The last component of the path below must match the
// File name under src/app-server
// app.use("/.netlify/functions/geo", router);
// app.use("/geo", router);
// app.get("/", (req: Request, res: Response) =>{
//   res.send("I'm here again");
// })
// my_server.listen(4000, () => {
//   console.log("Listening on port 4000");
// });

// export default app;
// export const handler = serverless(app);

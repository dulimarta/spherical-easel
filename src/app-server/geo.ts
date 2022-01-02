import express, {Request, Response} from "express";
import {createServer} from "http";
// import serverless from "serverless-http";
import { Socket } from "socket.io";
import {Server} from "socket.io";


const app = express();
// const router = express.Router()
const my_server = createServer(app);

const io = new Server(my_server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET","POST"]
  }
})
io.on("connection", (socket:Socket) => {
  console.debug("Got a new connection to ", socket.id);
  socket.emit("hello", {name: "Hans", age: 58});
});

const APP_URL = "https://easelgeo.app";
// router.get("/teacher", (req: Request, res: Response) => {
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
app.get("/", (req: Request, res: Response) =>{
  res.send("I'm here again");
})
my_server.listen(4000, () => {
  console.log("Listening on port 4000");
});

// export default app;
// export const handler = serverless(app);

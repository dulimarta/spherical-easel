import express, { Request, Response } from "express";
import serverless from "serverless-http"
const app = express();
const router = express.Router()

const APP_URL = "https://easelgeo.app";
router.get("/teacher", (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(`<h1>You are a teacher. Proceed to <a href="${APP_URL}">EaselGeo</a></h1>`);
  console.debug("Incoming request is", req);
  res.end();
});

router.get("/student", (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(`<h1>You are a student. Proceed to <a href="${APP_URL}">EaselGeo</a></h1>`);
  console.debug("Incoming request is", req);
  res.end();
});

// The last component of the path below must match the
// File name under src/app-server
app.use("/.netlify/functions/geo", router);
app.use("/geo", router)
export default app;
export const handler = serverless(app);

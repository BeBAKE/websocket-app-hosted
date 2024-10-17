//! index - wss - class - pg/prisma

import express from "express";
import http from "http";
import cors from "cors";
import WSS from "./wss";
// import dotenv from 'dotenv'

// dotenv.config()

const app = express();

app.use(cors());

const server = http.createServer(app);

new WSS(server);

app.get("/", (req, res) => {
  res.status(200).json({ message: "done get" });
});

server.listen(3000, () => console.log("HTTP server is running on port 3000"));




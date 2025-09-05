import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from '@clerk/express'
import fileUpload from "express-fileupload";  
import path from "path";
import cors from "cors";
import { createServer } from "http";

import { initializeSocket } from "./lib/socket.js";


import { connectDB } from "./lib/db.js";
import userRoutes from "./Routes/user.route.js";
import adminRoutes from "./Routes/admin.route.js";
import authRoutes from "./Routes/auth.route.js";
import songRoutes from "./Routes/song.route.js";
import albumRoutes from "./Routes/album.route.js";
import stratRoutes from "./Routes/strat.route.js";


dotenv.config();

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(cors(
  {
    origin: "http://localhost:3000", // replace with your frontend URL
    credentials: true,
  }
));

app.use(express.json());  //to parse req.body
app.use(clerkMiddleware()); // this will add the auth to req obj ==> req.auth

app.use(
  fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(__dirname, "tmp"),
  createParentPath: true,
  limits: 
    { 
      fileSize: 10 * 1024 * 1024    // 10 MB   max file size
    },
  })
);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/strats", stratRoutes);


// error handler
app.use ((err,req,res,next) => {
  res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message });
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
  connectDB();
});

// todo: socket.io
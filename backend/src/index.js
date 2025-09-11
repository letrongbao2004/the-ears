import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";


import { initializeSocket } from "./lib/socket.js";

import { connectDB } from "./lib/db.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import authRoutes from "./routes/auth.route.js";
import songRoutes from "./routes/song.route.js";
import albumRoutes from "./routes/album.route.js";
import statRoutes from "./routes/stat.route.js";
import playlistRoutes from "./routes/playlist.route.js";

// Load environment variables first
dotenv.config();

// Log startup information
console.log("🚀 Starting server...");
console.log("📍 Node version:", process.version);
console.log("📍 Environment:", process.env.NODE_ENV || "development");
console.log("📍 Port:", process.env.PORT || "5000");
console.log("📍 MongoDB URI exists:", !!process.env.MONGODB_URI);

const __dirname = path.resolve();
const app = express();
const PORT = process.env.PORT;

const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(
	cors({
		origin: process.env.NODE_ENV === "production" 
			? [process.env.FRONTEND_URL || "https://the-ears.onrender.com"]
			: ["http://localhost:5173", "http://localhost:3000"],
		credentials: true,
	})
);

// Content Security Policy middleware
app.use((req, res, next) => {
	res.setHeader(
		'Content-Security-Policy',
		"default-src 'self'; " +
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.dev; " +
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
		"font-src 'self' https://fonts.gstatic.com data:; " +
		"img-src 'self' data: blob: https: http:; " +
		"media-src 'self' blob: https: http:; " +
		"connect-src 'self' https: wss: ws:; " +
		"worker-src 'self' blob:; " +
		"frame-src 'self' https:;"
	);
	next();
});

app.use(express.json()); // to parse req.body
app.use(clerkMiddleware()); // this will add auth to req obj => req.auth
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: path.join(__dirname, "tmp"),
		createParentPath: true,
		limits: {
			fileSize: 100 * 1024 * 1024, // 100MB max file size for longer videos
		},
	})
);

// cron jobs
const tempDir = path.join(process.cwd(), "tmp");
cron.schedule("0 * * * *", () => {
	if (fs.existsSync(tempDir)) {
		fs.readdir(tempDir, (err, files) => {
			if (err) {
				console.log("error", err);
				return;
			}
			for (const file of files) {
				fs.unlink(path.join(tempDir, file), (err) => {});
			}
		});
	}
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/playlists", playlistRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "../frontend/dist")));
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "../frontend", "dist", "index.html"));
	});
}

// error handler
app.use((err, req, res, next) => {
	res.status(500).json({ message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message });
});

const start = async () => {
	try {
		console.log("🔌 Connecting to MongoDB...");
		await connectDB();
		console.log("✅ MongoDB connected successfully");
		
		const port = PORT || 5000;
		httpServer.listen(port, "0.0.0.0", () => {
			console.log(`✅ Server is running on port ${port}`);
			console.log("🎵 The Ears music app is ready!");
		});
	} catch (error) {
		console.error("❌ Failed to start server:", error.message);
		console.error("Stack trace:", error.stack);
		process.exit(1);
	}
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('❌ Uncaught Exception:', error.message);
	console.error('Stack trace:', error.stack);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
	process.exit(1);
});

start().catch((error) => {
	console.error("❌ Unhandled error during startup:", error.message);
	console.error("Stack trace:", error.stack);
	process.exit(1);
});
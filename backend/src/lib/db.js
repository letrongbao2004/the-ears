import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI environment variable is not set");
        }
        
        console.log("🔗 Attempting MongoDB connection...");
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        if (error.name === 'MongooseServerSelectionError') {
            console.error("💡 Check if MONGODB_URI is correct and MongoDB Atlas allows connections");
        }
        throw error; // Don't exit here, let the caller handle it
    }
}
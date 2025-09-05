import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
  //  email: { type: String, required: true },
//   password: { type: String, required: true },
        fullName: { 
            type: String, 
            required: true 
        },
        imageUrl: { 
            type: String, 
            required: true 
        },
        clerkID: { 
            type: String, 
            required: true, 
            unique: true 
        },
  
    }, 
    {timestamps: true}  // createdAt, updatedAt
); 


export const User = mongoose.model("User", userSchema);
import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: true
        },
        artist:{
            type: String,
            required: true
        },
        imageUrl:{
            type: String,
            required: true
        },
        audioUrl:{
            type: String,
            required: true
        },
        videoUrl:{
            type: String,
            required: false
        },
        duration:{
            type: Number,
            required: true
        },
        lyrics:{
            type: String,
            required: false,
            default: ""
        },
        albumId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Album",
            required: false
        },
    }, 
    { timestamps: true }
);

export const Song = mongoose.model("Song", songSchema);
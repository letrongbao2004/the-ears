import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        userId: {
            type: String,
            required: true
        },
        songs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Song"
            }
        ],
        isPublic: {
            type: Boolean,
            default: false
        },
        coverImage: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);


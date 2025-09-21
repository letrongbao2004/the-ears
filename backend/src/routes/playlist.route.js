import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPublicPlaylists
} from "../controller/playlist.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(protectRoute);

// Playlist CRUD operations
router.post("/", createPlaylist);
router.get("/", getUserPlaylists);
router.get("/public", getPublicPlaylists);
router.get("/:playlistId", getPlaylistById);
router.put("/:playlistId", updatePlaylist);
router.delete("/:playlistId", deletePlaylist);

// Song management in playlists
router.post("/:playlistId/songs", addSongToPlaylist);
router.delete("/:playlistId/songs/:songId", removeSongFromPlaylist);

export default router;


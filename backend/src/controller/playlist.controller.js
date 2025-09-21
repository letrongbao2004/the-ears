import { Playlist } from "../models/playlist.model.js";
import { Song } from "../models/song.model.js";

export const createPlaylist = async (req, res, next) => {
    try {
        const { name, description, isPublic, coverImage } = req.body;
        const auth = await req.auth();
        const userId = auth.userId;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: "Playlist name is required" });
        }

        const playlist = await Playlist.create({
            name: name.trim(),
            description: description || "",
            userId,
            isPublic: isPublic || false,
            coverImage: coverImage || "",
            songs: []
        });

        res.status(201).json(playlist);
    } catch (error) {
        next(error);
    }
};

export const getUserPlaylists = async (req, res, next) => {
    try {
        const auth = await req.auth();
        const userId = auth.userId;
        const playlists = await Playlist.find({ userId })
            .populate('songs', 'title artist imageUrl audioUrl videoUrl duration')
            .sort({ updatedAt: -1 });

        res.json(playlists);
    } catch (error) {
        next(error);
    }
};

export const getPlaylistById = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const auth = await req.auth();
        const userId = auth.userId;

        // Validate playlist ID format
        if (!playlistId || !playlistId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid playlist ID format" });
        }

        const playlist = await Playlist.findOne({ 
            _id: playlistId, 
            $or: [
                { userId }, // User's own playlist
                { isPublic: true } // Public playlist
            ]
        }).populate('songs', 'title artist imageUrl audioUrl videoUrl duration albumId createdAt');

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        res.json(playlist);
    } catch (error) {
        next(error);
    }
};

export const updatePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const auth = await req.auth();
        const userId = auth.userId;
        const { name, description, isPublic, coverImage } = req.body;

        // Validate playlist ID format
        if (!playlistId || !playlistId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid playlist ID format" });
        }

        const playlist = await Playlist.findOne({ _id: playlistId, userId });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ message: "Playlist name cannot be empty" });
            }
            playlist.name = name.trim();
        }
        if (description !== undefined) playlist.description = description;
        if (isPublic !== undefined) playlist.isPublic = isPublic;
        if (coverImage !== undefined) playlist.coverImage = coverImage;

        await playlist.save();
        res.json(playlist);
    } catch (error) {
        next(error);
    }
};

export const deletePlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const auth = await req.auth();
        const userId = auth.userId;

        // Validate playlist ID format
        if (!playlistId || !playlistId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid playlist ID format" });
        }

        const playlist = await Playlist.findOne({ _id: playlistId, userId });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        await Playlist.findByIdAndDelete(playlistId);
        res.json({ message: "Playlist deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const addSongToPlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { songId } = req.body;
        const auth = await req.auth();
        const userId = auth.userId;

        // Validate playlist ID format
        if (!playlistId || !playlistId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid playlist ID format" });
        }

        if (!songId) {
            return res.status(400).json({ message: "Song ID is required" });
        }

        // Validate song ID format
        if (!songId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid song ID format" });
        }

        // Check if song exists
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        const playlist = await Playlist.findOne({ _id: playlistId, userId });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Check if song is already in playlist
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ message: "Song already in playlist" });
        }

        playlist.songs.push(songId);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlistId)
            .populate('songs', 'title artist imageUrl audioUrl videoUrl duration');

        res.json(updatedPlaylist);
    } catch (error) {
        next(error);
    }
};

export const removeSongFromPlaylist = async (req, res, next) => {
    try {
        const { playlistId, songId } = req.params;
        const auth = await req.auth();
        const userId = auth.userId;

        // Validate playlist ID format
        if (!playlistId || !playlistId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid playlist ID format" });
        }

        // Validate song ID format
        if (!songId || !songId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid song ID format" });
        }

        const playlist = await Playlist.findOne({ _id: playlistId, userId });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlistId)
            .populate('songs', 'title artist imageUrl audioUrl videoUrl duration');

        res.json(updatedPlaylist);
    } catch (error) {
        next(error);
    }
};

export const getPublicPlaylists = async (req, res, next) => {
    try {
        const playlists = await Playlist.find({ isPublic: true })
            .populate('songs', 'title artist imageUrl audioUrl videoUrl duration')
            .sort({ updatedAt: -1 })
            .limit(20);

        // Get user information for each playlist
        const playlistsWithUserInfo = await Promise.all(
            playlists.map(async (playlist) => {
                try {
                    // Get user info from Clerk
                    const { clerkClient } = await import('@clerk/express');
                    const user = await clerkClient.users.getUser(playlist.userId);
                    
                    return {
                        ...playlist.toObject(),
                        user: {
                            fullName: user.fullName || 'Unknown User',
                            imageUrl: user.imageUrl || '',
                            id: user.id
                        }
                    };
                } catch (userError) {
                    // If user not found, return playlist without user info
                    return {
                        ...playlist.toObject(),
                        user: {
                            fullName: 'Unknown User',
                            imageUrl: '',
                            id: playlist.userId
                        }
                    };
                }
            })
        );

        res.json(playlistsWithUserInfo);
    } catch (error) {
        next(error);
    }
};


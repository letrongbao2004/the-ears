import { Album } from "../models/album.model.js";

export const getAllAlbums = async (req, res, next) => {
  try {
    const albums = await Album.find();
    res.status(200).json(albums);
  } catch (error) {
    next(error);
  }
};

export const getAlbumById = async (req, res, next) => {
    try {
      const { albumId } = req.params;

        const album = await Album.findById(albumId).populate("songs");
        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }
        res.status(200).json(album);
    } catch (error) {
        next(error);
    }
};

export const searchAlbums = async (req, res, next) => {
    try {
        const { q, limit = 20 } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        const searchQuery = q.trim();
        
        // Create regex pattern for case-insensitive search
        const regex = new RegExp(searchQuery, 'i');
        
        const albums = await Album.find({
            $or: [
                { title: { $regex: regex } },
                { artist: { $regex: regex } }
            ]
        })
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

        res.json(albums);
    } catch (error) {
        next(error);
    }
};


import { Song } from "../models/song.model.js";

export const getAllSongs = async (req, res, next) => {
    try {
        // -1 = Descending => newest -> oldest
        // 1 = Ascending => oldest -> newest
        const songs = await Song.find().sort({ createdAt: -1 });
        res.json(songs);
    } catch (error) {
        next(error);
    }
};

export const getFeaturedSongs = async (req, res, next) => {
    try {
        // fetch 6 random songs using mongodb's aggregation pipline
       const songs = await Song.aggregate([
            {
                $sample: { size: 6 }
            },
            {
                $project:{
                    _id: 1,
                    title: 1,
                    artist:1,
                    imageUrl: 1,
                    audioUrl: 1,
                },
            },
       ]);

       res.json(songs);
    } catch (error) {
        next(error);
    }
};

export const getMadeForYouSongs = async (req, res, next) => {
    try {
        // fetch 4 random songs using mongodb's aggregation pipline
       const songs = await Song.aggregate([
            {
                $sample: { size: 4 }
            },
            {
                $project:{
                    _id: 1,
                    title: 1,
                    artist:1,
                    imageUrl: 1,
                    audioUrl: 1,
                },
            },
       ]);

       res.json(songs);
    } catch (error) {
        next(error);
    }
};

export const getTrendingSongs = async (req, res, next) => {
    try {
        // fetch 4 random songs using mongodb's aggregation pipline
       const songs = await Song.aggregate([
            {
                $sample: { size: 4 }
            },
            {
                $project:{
                    _id: 1,
                    title: 1,
                    artist:1,
                    imageUrl: 1,
                    audioUrl: 1,
                },
            },
       ]);

       res.json(songs);
    } catch (error) {
        next(error);
    }
};

export const searchSongs = async (req, res, next) => {
    try {
        const { q, limit = 20 } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        const searchQuery = q.trim();
        
        // Create regex pattern for case-insensitive search
        const regex = new RegExp(searchQuery, 'i');
        
        const songs = await Song.find({
            $or: [
                { title: { $regex: regex } },
                { artist: { $regex: regex } }
            ]
        })
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

        res.json(songs);
    } catch (error) {
        next(error);
    }
};
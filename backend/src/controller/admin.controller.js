import {Song} from "../models/song.model.js";
import {Album} from "../models/album.model.js";
import cloudinary from "cloudinary";

    // helper function to upload files to Cloudinary
    const uploadToCloudinary = async (file) => {
        try {
            const result =  await cloudinary.uploader.upload(file.tempFilePath, {
                resource_type: "auto",
            })
        return result.secure_url;
        } catch (error) {
            console.error("Error uploading to Cloudinary:", error);
            throw new Error("Error uploading to Cloudinary");
        }
    };

export const createSong = async (req, res, next) => {
    try {
        if(!req.files || !req.files.audioFile || !req.files.imageFile) {
            return res.status(400).json({ message: "Audio file and image file are required." });
        }

        const {title, artist, albumId, duration} = req.body;
        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;

        const audioUrl = await uploadToCloudinary(audioFile);
        const imageUrl = await uploadToCloudinary(imageFile);

        const song  = new Song({
            title,
            artist,
            audioUrl,
            imageUrl,
            duration,
            albumId: albumId || null,
        });

        await song.save();

        // if song belongs to an album, update the album's song array
        if(albumId){
            await Album.findByIdAndUpdate(albumId, {
                $push: { songs: song._id }
            });
        }
        res.status(201).json(song);
    } catch (error) {
        console.error("Error creating song:", error);
        next(error);
    }
};

export const deleteSong = async (req, res, next) => {
    try {
        const { id } = req.params;

        const song = await Song.findById(id);

        // if song belongs to the albums, update the album's array
        if(song.albumId) {
            await Album.findByIdAndUpdate(song.albumId, {
                $pull: { songs: song._id },
            });
        }

        await Song.findByIdAndDelete(id);

        res.status(200).json({ message: "Song deleted successfully." });
    } catch (error) {
        console.error("Error deleting song:", error);
        next(error);
        
    }
};

export const createAlbum = async (req, res, next) => {
    try {
        const { title, artist, releaseYear } = req.body;

        const { imageFile } = req.files;
        const imageUrl = await uploadToCloudinary(imageFile);

        const album = new Album({
            title,
            artist,
            imageUrl,
            releaseYear,
        });

        await album.save();

        res.status(201).json(album);
    } catch (error) {
        console.error("Error creating album:", error);
        next(error);
    }
};

export const deleteAlbum = async (req, res, next) => {
    try {
        const { id } = req.params;

        const album = await Album.findById(id);

        await Song.deleteMany({ albumId: id });
        await Album.findByIdAndDelete(id);

        res.status(200).json({ message: "Album deleted successfully." });
    } catch (error) {
        console.error("Error deleting album:", error);
        next(error);
    }
};

export const checkAdmin = (req, res) => {
    res.status(200).json({ admin: true });
};
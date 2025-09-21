import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { config } from "dotenv";

config();

const seedDatabase = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		// Clear existing data
		await Album.deleteMany({});
		await Song.deleteMany({});

		// First, create all songs
		const createdSongs = await Song.insertMany([
			{
				title: "Calm Down",
				artist: "Karik",
				imageUrl: "/cover-images/calmdown.jpg",
				audioUrl: "/songs/calmdown.mp3",
				duration: 198, // 3:18
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Xấu Xí",
				artist: "Karik",
				imageUrl: "/cover-images/xauxi.jpg",
				audioUrl: "/songs/xauxi.mp3",
				duration: 166, // 2:46
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Ai Cho Anh Lương Thiện",
				artist: "Karik",
				imageUrl: "/cover-images/aichoanhluongthien.jpg",
				audioUrl: "/songs/aichoanhluongthien.mp3",
				duration: 171, // 2:51
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Nhật Ký Vào Đời",
				artist: "Karik (FT. Thái VG)",
				imageUrl: "/cover-images/nhatkyvaodoi.jpg",
				audioUrl: "/songs/nhatkyvaodoi.mp3",
				duration: 240, // 4:00
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Khắc Cốt Ghi Tâm",
				artist: "Karik (FT. TUẤN KHANH MICROWAVE) ",
				imageUrl: "/cover-images/khaccotghitam.jpg",
				audioUrl: "/songs/khaccotghitam.mp3",
				duration: 176, // 2:56
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Bằng Lòng",
				artist: "Karik",
				imageUrl: "/cover-images/banglong.jpg",
				audioUrl: "/songs/banglong.mp3",
				duration: 211, // 3:31
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Lẽ Đương Nhiên",
				artist: "Karik",
				imageUrl: "/cover-images/leduongnhien.jpg",
				audioUrl: "/songs/leduongnhien.mp3",
				duration: 221, // 3:41
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Không Quan Tâm",
				artist: "Karik",
				imageUrl: "/cover-images/khongquantam.jpg",
				audioUrl: "/songs/khongquantam.mp3",
				duration: 201, // 3:21
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Mời Người Kế Tiếp",
				artist: "Karik (FT. ONLY C)",
				imageUrl: "/cover-images/moinguoiketiep.jpg",
				audioUrl: "/songs/moinguoiketiep.mp3",
				duration: 190, // 3:10
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Có Chơi Có Chịu",
				artist: "Karik (FT. ONLY C)",
				imageUrl: "/cover-images/cochoicochiu.jpg",
				audioUrl: "/songs/cochoicochiu.mp3",
				duration: 221, // 3:41
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Kíu",
				artist: "Karik (FT. MIU LÊ)",
				imageUrl: "/cover-images/kiu.jpg",
				audioUrl: "/songs/kiu.mp3",
				duration: 207, // 3:27
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Thao Túng Tâm Trí",
				artist: "Karik (FT. ONLY C)",
				imageUrl: "/cover-images/thaotungtamtri.jpg",
				audioUrl: "/songs/thaotungtamtri.mp3",
				duration: 199, // 3:19
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Từ Đó Về Sau",
				artist: "Karik",
				imageUrl: "/cover-images/tudovesau.jpg",
				audioUrl: "/songs/tudovesau.mp3",
				duration: 238, // 3:58
				plays: Math.floor(Math.random() * 5000),
			},
			{
				title: "Bạn Đời",
				artist: "Karik (FT. GDUCKY)",
				imageUrl: "/cover-images/bandoi.jpg",
				audioUrl: "/songs/bandoi.mp3",
				duration: 305, // 5:05
				plays: Math.floor(Math.random() * 5000),
			},
		]);

		// Create albums with references to song IDs
		const albums = [
			{
				title: "412",
				artist: "Karik",
				imageUrl: "/albums/412.jpg",
				releaseYear: 2024,
				songs: createdSongs.slice(0, 14).map((song) => song._id),
			},	
		];

		// Insert all albums
		const createdAlbums = await Album.insertMany(albums);

		// Update songs with their album references
		for (let i = 0; i < createdAlbums.length; i++) {
			const album = createdAlbums[i];
			const albumSongs = albums[i].songs;

			await Song.updateMany({ _id: { $in: albumSongs } }, { albumId: album._id });
		}

		console.log("Database seeded successfully!");
	} catch (error) {
		console.error("Error seeding database:", error);
	} finally {
		mongoose.connection.close();
	}
};

seedDatabase();
import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { config } from "dotenv";

config();

const songs = [
	{
		title: "Calm Down",
		artist: "Karik",
		imageUrl: "/cover-images/calmdown.jpg",
		audioUrl: "/songs/calmdown.mp3",
		duration: 198, // 3:18
	},
	{
		title: "Xấu Xí",
		artist: "Karik",
		imageUrl: "/cover-images/xauxi.jpg",
		audioUrl: "/songs/xauxi.mp3",
		duration: 166, // 2:46
	},
	{
		title: "Ai Cho Anh Lương Thiện",
		artist: "Karik",
		imageUrl: "/cover-images/aichoanhluongthien.jpg",
		audioUrl: "/songs/aichoanhluongthien.mp3",
		duration: 171, // 2:51
	},
	{
		title: "Nhật Ký Vào Đời",
		artist: "Karik (FT. Thái VG)",
		imageUrl: "/cover-images/nhatkyvaodoi.jpg",
		audioUrl: "/songs/nhatkyvaodoi.mp3",
		duration: 240, // 4:00
	},
	{
		title: "Khắc Cốt Ghi Tâm",
		artist: "Karik (FT. TUẤN KHANH MICROWAVE) ",
		imageUrl: "/cover-images/khaccotghitam.jpg",
		audioUrl: "/songs/khaccotghitam.mp3",
		duration: 176, // 2:56
	},
	{
		title: "Bằng Lòng",
		artist: "Karik",
		imageUrl: "/cover-images/banglong.jpg",
		audioUrl: "/songs/banglong.mp3",
		duration: 211, // 3:31
	},
	{
		title: "Lẽ Đương Nhiên",
		artist: "Karik",
		imageUrl: "/cover-images/leduongnhien.jpg",
		audioUrl: "/songs/leduongnhien.mp3",
		duration: 221, // 3:41
	},
	{
		title: "Không Quan Tâm",
		artist: "Karik",
		imageUrl: "/cover-images/khongquantam.jpg",
		audioUrl: "/songs/khongquantam.mp3",
		duration: 201, // 3:21
	},
	{
		title: "Mời Người Kế Tiếp",
		artist: "Karik (FT. ONLY C)",
		imageUrl: "/cover-images/moinguoiketiep.jpg",
		audioUrl: "/songs/moinguoiketiep.mp3",
		duration: 190, // 3:10
	},
	{
		title: "Có Chơi Có Chịu",
		artist: "Karik (FT. ONLY C)",
		imageUrl: "/cover-images/cochoicochiu.jpg",
		audioUrl: "/songs/cochoicochiu.mp3",
		duration: 221, // 3:41
	},
	{
		title: "Kíu",
		artist: "Karik (FT. MIU LÊ)",
		imageUrl: "/cover-images/kiu.jpg",
		audioUrl: "/songs/kiu.mp3",
		duration: 207, // 3:27
	},
	{
		title: "Thao Túng Tâm Trí",
		artist: "Karik (FT. ONLY C)",
		imageUrl: "/cover-images/thaotungtamtri.jpg",
		audioUrl: "/songs/thaotungtamtri.mp3",
		duration: 199, // 3:19
	},
	{
		title: "Từ Đó Về Sau",
		artist: "Karik",
		imageUrl: "/cover-images/tudovesau.jpg",
		audioUrl: "/songs/tudovesau.mp3",
		duration: 238, // 3:58
	},
	{
		title: "Bạn Đời",
		artist: "Karik (FT. GDUCKY)",
		imageUrl: "/cover-images/bandoi.jpg",
		audioUrl: "/songs/bandoi.mp3",
		duration: 305, // 5:05
	},
];

const seedSongs = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		// Clear existing songs
		await Song.deleteMany({});

		// Insert new songs
		await Song.insertMany(songs);

		console.log("Songs seeded successfully!");
	} catch (error) {
		console.error("Error seeding songs:", error);
	} finally {
		mongoose.connection.close();
	}
};

seedSongs();
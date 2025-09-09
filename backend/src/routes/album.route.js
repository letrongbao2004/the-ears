import { Router } from "express";
import { getAllAlbums, getAlbumById, searchAlbums } from "../controller/album.controller.js";

const router = Router();

router.get("/", getAllAlbums);
router.get("/search", searchAlbums);
router.get("/:albumId", getAlbumById);

export default router;

import { Router, Request, Response } from "express";
import { CONFIG } from "../config";
import { listAllPhotos, deletePhoto } from "../metadata";

export const apiRouter = Router();

apiRouter.get("/photos", (req: Request, res: Response) => {
  let photos = listAllPhotos(CONFIG.SAVEDATA_DIR);

  const { refid, game, query } = req.query;

  if (typeof refid === "string" && refid.trim()) {
    const target = refid.trim().toUpperCase();
    photos = photos.filter((p) => p.refId.toUpperCase().includes(target));
  }

  if (typeof game === "string" && game.trim()) {
    const target = game.trim().toUpperCase();
    photos = photos.filter(
      (p) =>
        p.gameModel.toUpperCase().startsWith(target) ||
        p.gameTitle.toUpperCase().includes(target)
    );
  }

  if (typeof query === "string" && query.trim()) {
    const q = query.trim().toUpperCase();
    photos = photos.filter(
      (p) =>
        p.fileName.toUpperCase().includes(q) ||
        p.refId.toUpperCase().includes(q) ||
        p.gameTitle.toUpperCase().includes(q)
    );
  }

  res.json({
    success: true,
    total: photos.length,
    photos,
  });
});

apiRouter.delete("/photos/:refid/:filename", (req: Request, res: Response) => {
  const { refid, filename } = req.params;
  const success = deletePhoto(CONFIG.SAVEDATA_DIR, refid, filename);

  if (success) {
    res.json({ success: true, message: "Photo deleted successfully" });
  } else {
    res.status(404).json({ success: false, message: "Photo not found" });
  }
});

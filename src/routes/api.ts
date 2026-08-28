import { Router, Request, Response } from "express";
import { CONFIG } from "../config";
import { listAllPhotos, deletePhoto } from "../metadata";

export const apiRouter = Router();

/**
 * GET /api/photos
 * Query parameters:
 * - refid (filter by card / user ID)
 * - game (filter by game model prefix, e.g. KLP, SDVX)
 * - limit / offset
 */
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

/**
 * DELETE /api/photos/:refid/:filename
 */
apiRouter.delete("/photos/:refid/:filename", (req: Request, res: Response) => {
  const { refid, filename } = req.params;
  const success = deletePhoto(CONFIG.SAVEDATA_DIR, refid, filename);

  if (success) {
    res.json({ success: true, message: "Photo deleted successfully" });
  } else {
    res.status(404).json({ success: false, message: "Photo not found" });
  }
});

/**
 * GET /api/config
 * Returns live runtime configuration from config_uploader.ini
 */
apiRouter.get("/config", (req: Request, res: Response) => {
  const hostHeader = req.headers.host || `${CONFIG.PUBLIC_HOST}:${CONFIG.PORT}`;
  const [hostOnly, portStr] = hostHeader.split(":");
  const port = portStr ? parseInt(portStr, 10) : CONFIG.PORT;
  const publicHost = hostOnly || CONFIG.PUBLIC_HOST;

  res.json({
    success: true,
    port: CONFIG.PORT,
    bind: CONFIG.BIND,
    uploadUrl: `http://${publicHost}:${port}/upload`,
    urlValidSec: CONFIG.URL_VALID_SEC,
    bandwidth: CONFIG.BANDWIDTH,
    accessKey: "MZ4Eof5qdyLLN1IX3BkD7sWyQ374yPm1",
    expireDate: "2030-12-31",
  });
});


import { Router, Request, Response } from "express";
import { CONFIG } from "../config";
import { listAllPhotos } from "../metadata";

export const webuiRouter = Router();

webuiRouter.get("/", (req: Request, res: Response) => {
  const photos = listAllPhotos(CONFIG.SAVEDATA_DIR);

  const userSet = new Set<string>();
  const gameSet = new Set<string>();
  let totalBytes = 0;

  for (const p of photos) {
    userSet.add(p.refId);
    gameSet.add(p.gameTitle);
    totalBytes += p.fileSizeBytes;
  }

  let totalStorage = `${(totalBytes / 1024).toFixed(1)} KB`;
  if (totalBytes > 1024 * 1024) {
    totalStorage = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  res.render("index", {
    config: CONFIG,
    photos,
    totalUsers: userSet.size,
    totalStorage,
    userList: Array.from(userSet).sort(),
    gameList: Array.from(gameSet).sort(),
  });
});

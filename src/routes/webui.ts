import { Router, Request, Response } from "express";
import { CONFIG } from "../config";
import { listAllPhotos, getGameTitleFromModel } from "../metadata";

export const webuiRouter = Router();

webuiRouter.get("/", (req: Request, res: Response) => {
  const photos = listAllPhotos(CONFIG.SAVEDATA_DIR);

  const userSet = new Set<string>();
  const gameMap = new Map<string, string>();
  let totalBytes = 0;

  for (const p of photos) {
    userSet.add(p.refId);
    const model = (p.gameModel || "UNKNOWN").split(":")[0].toUpperCase();
    const title = p.gameTitle || getGameTitleFromModel(model);
    gameMap.set(model, title);
    totalBytes += p.fileSizeBytes;
  }

  let totalStorage = `${(totalBytes / 1024).toFixed(1)} KB`;
  if (totalBytes > 1024 * 1024) {
    totalStorage = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  const gameList = Array.from(gameMap.entries())
    .map(([model, title]) => ({ model, title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  res.render("index", {
    config: CONFIG,
    photos,
    totalUsers: userSet.size,
    totalStorage,
    userList: Array.from(userSet).sort(),
    gameList,
  });
});

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface PhotoMetadata {
  fileName: string;
  refId: string;
  gameModel: string;
  gameTitle: string;
  uploadTime: string;
  timestamp: number;
  fileSizeBytes: number;
  sha256: string;
  arrangeNum?: string;
  url?: string;
}

const GAME_TITLES: Record<string, string> = {
  KLP: "Love Plus Arcade Colorful Clip",
};

export function getGameTitleFromModel(model?: string): string {
  if (!model || model === "UNKNOWN") return "Unknown";
  const prefix = (model.split(":")[0] || model.substring(0, 3)).toUpperCase();
  return GAME_TITLES[prefix] || "Unknown";
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function savePhotoWithMetadata(
  baseDir: string,
  refId: string,
  fileName: string,
  photoBuffer: Buffer,
  extra?: { gameModel?: string; arrangeNum?: string }
): PhotoMetadata {
  const userDir = path.join(baseDir, refId);
  ensureDirectoryExists(userDir);

  const filePath = path.join(userDir, fileName);
  fs.writeFileSync(filePath, photoBuffer);

  const hash = crypto.createHash("sha256").update(photoBuffer).digest("hex");
  const now = new Date();
  const rawModel = extra?.gameModel || "UNKNOWN";
  const gameModel = rawModel.split(":")[0].toUpperCase();

  const metaToSave = {
    fileName,
    refId,
    gameModel,
    gameTitle: getGameTitleFromModel(gameModel),
    uploadTime: now.toISOString(),
    timestamp: now.getTime(),
    fileSizeBytes: photoBuffer.length,
    sha256: hash,
    arrangeNum: extra?.arrangeNum,
  };

  const metaPath = path.join(userDir, `${fileName}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metaToSave, null, 2), "utf-8");

  return {
    ...metaToSave,
    url: `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(fileName)}`,
  };
}

export function listAllPhotos(baseDir: string): PhotoMetadata[] {
  if (!fs.existsSync(baseDir)) return [];

  const photos: PhotoMetadata[] = [];
  const userDirs = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const d of userDirs) {
    if (!d.isDirectory()) continue;
    const refId = d.name;
    const userDirPath = path.join(baseDir, refId);

    try {
      const files = fs.readdirSync(userDirPath);
      const jpgFiles = files.filter((f) => f.toLowerCase().endsWith(".jpg"));

      for (const jpg of jpgFiles) {
        const jsonPath = path.join(userDirPath, `${jpg}.json`);
        const url = `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(jpg)}`;

        if (fs.existsSync(jsonPath)) {
          try {
            const raw = fs.readFileSync(jsonPath, "utf-8");
            const meta = JSON.parse(raw) as PhotoMetadata;
            meta.url = url;

            const currentCode = (meta.gameModel || "UNKNOWN").split(":")[0].toUpperCase();
            if (meta.gameModel !== currentCode || !meta.gameTitle) {
              meta.gameModel = currentCode;
              meta.gameTitle = getGameTitleFromModel(currentCode);
              try {
                fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), "utf-8");
              } catch {}
            }

            photos.push(meta);
            continue;
          } catch {}
        }

        const jpgPath = path.join(userDirPath, jpg);
        const stat = fs.statSync(jpgPath);
        photos.push({
          fileName: jpg,
          refId,
          gameModel: "UNKNOWN",
          gameTitle: getGameTitleFromModel("UNKNOWN"),
          uploadTime: stat.mtime.toISOString(),
          timestamp: stat.mtime.getTime(),
          fileSizeBytes: stat.size,
          sha256: "",
          url,
        });
      }
    } catch (err) {
      console.error(`[Metadata] Error reading directory ${userDirPath}:`, err);
    }
  }

  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

export function deletePhoto(baseDir: string, refId: string, fileName: string): boolean {
  const userDir = path.join(baseDir, refId);
  const jpgPath = path.join(userDir, fileName);
  const jsonPath = path.join(userDir, `${fileName}.json`);

  let deleted = false;
  if (fs.existsSync(jpgPath)) {
    fs.unlinkSync(jpgPath);
    deleted = true;
  }
  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
  }

  return deleted;
}

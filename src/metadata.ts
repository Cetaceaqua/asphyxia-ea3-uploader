import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface PhotoMetadata {
  id: string;
  fileName: string;
  refId: string;
  gameModel: string;
  gameTitle: string;
  uploadTime: string;
  timestamp: number;
  fileSizeBytes: number;
  sha256: string;
  mimeType: string;
  width?: number;
  height?: number;
  arrangeNum?: string;
  url: string;
}

const GAME_TITLES: Record<string, string> = {
  KLP: "LovePlus Arcade",
  KFC: "SOUND VOLTEX",
  MDX: "DanceDanceRevolution",
  LDJ: "beatmania IIDX",
  L44: "jubeat",
  M39: "pop'n music",
  REC: "Nostalgia",
};

export function getGameTitleFromModel(model: string): string {
  const prefix = model.split(":")[0]?.toUpperCase() || model.substring(0, 3).toUpperCase();
  return GAME_TITLES[prefix] || (prefix ? `Arcade (${prefix})` : "General Arcade");
}

/**
 * Ensures the target directory exists.
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Saves photo binary and companion JSON metadata.
 */
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
  const gameModel = extra?.gameModel || "KLP:A:A:A:2012100100";

  const meta: PhotoMetadata = {
    id: `${refId}_${fileName}`,
    fileName,
    refId,
    gameModel,
    gameTitle: getGameTitleFromModel(gameModel),
    uploadTime: now.toISOString(),
    timestamp: now.getTime(),
    fileSizeBytes: photoBuffer.length,
    sha256: hash,
    mimeType: "image/jpeg",
    arrangeNum: extra?.arrangeNum,
    url: `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(fileName)}`,
  };

  const metaPath = path.join(userDir, `${fileName}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

  return meta;
}

/**
 * Lists all stored photos with their parsed metadata.
 */
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
        if (fs.existsSync(jsonPath)) {
          try {
            const raw = fs.readFileSync(jsonPath, "utf-8");
            const meta = JSON.parse(raw) as PhotoMetadata;
            meta.url = `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(jpg)}`;
            photos.push(meta);
            continue;
          } catch {
            // Ignore parse errors and fallback
          }
        }

        // Fallback metadata if .json doesn't exist
        const jpgPath = path.join(userDirPath, jpg);
        const stat = fs.statSync(jpgPath);
        photos.push({
          id: `${refId}_${jpg}`,
          fileName: jpg,
          refId,
          gameModel: "KLP:A:A:A:2012100100",
          gameTitle: "LovePlus Arcade",
          uploadTime: stat.mtime.toISOString(),
          timestamp: stat.mtime.getTime(),
          fileSizeBytes: stat.size,
          sha256: "",
          mimeType: "image/jpeg",
          url: `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(jpg)}`,
        });
      }
    } catch (err) {
      console.error(`[Metadata] Error reading directory ${userDirPath}:`, err);
    }
  }

  // Sort descending by upload timestamp
  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Deletes a photo and its metadata file.
 */
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

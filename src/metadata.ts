import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface CardExtraMeta {
  description?: string;
  dateCode?: string;
  copyright?: string;
  price?: number;
  holoName?: string;
  holoPrice?: number;
  created?: string;
  rarity?: number;
  bodyBaseId?: number;
}

export interface PhotoMetadata {
  fileName: string;
  refId: string;
  gameModel: string;
  gameTitle: string;
  imageType: string;
  uploadTime: string;
  timestamp: number;
  fileSizeBytes: number;
  sha256: string;
  arrangeNum?: string;
  url?: string;
  cardId?: string;
  isCard?: boolean;
  frontUrl?: string;
  backUrl?: string;
  holoUrl?: string;
  irUrl?: string;
  frontPrevUrl?: string;
  hasHolo?: boolean;
  hasBack?: boolean;
  orientation?: "portrait" | "landscape";
  dimensions?: { width: number; height: number };
  cardMeta?: CardExtraMeta;
}

export interface ListPhotosOptions {
  includeMasks?: boolean;
}

const GAME_TITLES: Record<string, string> = {
  KLP: "Love Plus Arcade Colorful Clip",
  TBS: "Busou Shinki Armored Princess Battle Conductor",
};

export function getGameTitleFromModel(model?: string): string {
  if (!model || model === "UNKNOWN") return "Unknown";
  const prefix = (model.split(":")[0] || model.substring(0, 3)).toUpperCase();
  return GAME_TITLES[prefix] || model;
}

export function getImageTypeFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("profile") || /^\d{12}0(?:_|\.|$)/.test(lower)) return "Profile Card";
  if (lower.includes("shinki") || /^000001/i.test(lower)) return "Shinki Card";
  if (lower.includes("photo") || lower.includes("memorial") || /^\d{12}(?:[1-9]|10)(?:_|\.|$)/.test(lower)) return "Photo Card";
  return "Image";
}

export function isMaskImage(fileName: string): boolean {
  return /_(?:ir|holo|frontprev)\.(?:png|jpg|jpeg)$/i.test(fileName);
}

export function getPngDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }
  } catch {}
  return null;
}

function cleanXmlText(s?: string): string {
  if (!s) return "";
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#169;/g, "©")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\{0\}/g, "")
    .trim();
}

export function parseCardMeta(dirPath: string): CardExtraMeta {
  const meta: CardExtraMeta = {};
  const xmlPath = path.join(dirPath, "meta.xml");
  if (fs.existsSync(xmlPath)) {
    try {
      const xml = fs.readFileSync(xmlPath, "utf-8");
      const descMatch = xml.match(/<description>([^<]*)<\/description>/);
      if (descMatch) meta.description = cleanXmlText(descMatch[1]);
      const dateMatch = xml.match(/<date_code>([\s\S]*?)<\/date_code>/);
      if (dateMatch) meta.dateCode = cleanXmlText(dateMatch[1]);
      const copyMatch = xml.match(/<copyright>([\s\S]*?)<\/copyright>/);
      if (copyMatch) meta.copyright = cleanXmlText(copyMatch[1]);
      const priceMatch = xml.match(/<price>(\d+)<\/price>/);
      if (priceMatch) meta.price = parseInt(priceMatch[1], 10);
      const createdMatch = xml.match(/<created>([^<]*)<\/created>/);
      if (createdMatch) meta.created = createdMatch[1].trim();
      const holoNameMatch = xml.match(/<selectable_holo>[\s\S]*?<name>([^<]*)<\/name>/);
      if (holoNameMatch) meta.holoName = holoNameMatch[1].trim();
      const holoPriceMatch = xml.match(/<selectable_holo>[\s\S]*?<price>(\d+)<\/price>/);
      if (holoPriceMatch) meta.holoPrice = parseInt(holoPriceMatch[1], 10);
    } catch {}
  }

  const shinkiJson = path.join(dirPath, "tbs_meta_shinki.json");
  if (fs.existsSync(shinkiJson)) {
    try {
      const d = JSON.parse(fs.readFileSync(shinkiJson, "utf-8"));
      if (typeof d.rarity === "number") meta.rarity = d.rarity;
      if (typeof d.bodyBaseId === "number") meta.bodyBaseId = d.bodyBaseId;
    } catch {}
  }

  return meta;
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
  extra?: { gameModel?: string; arrangeNum?: string; subDir?: string }
): PhotoMetadata {
  const targetDir = extra?.subDir ? path.join(baseDir, refId, extra.subDir) : path.join(baseDir, refId);
  ensureDirectoryExists(targetDir);

  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, photoBuffer);

  const hash = crypto.createHash("sha256").update(photoBuffer).digest("hex");
  const now = new Date();
  const rawModel = extra?.gameModel || "UNKNOWN";
  const gameModel = rawModel.split(":")[0].toUpperCase();
  const imageType = getImageTypeFromFilename(fileName);

  const metaToSave: PhotoMetadata = {
    fileName,
    refId,
    gameModel,
    gameTitle: getGameTitleFromModel(gameModel),
    imageType,
    uploadTime: now.toISOString(),
    timestamp: now.getTime(),
    fileSizeBytes: photoBuffer.length,
    sha256: hash,
    arrangeNum: extra?.arrangeNum,
  };

  const metaPath = path.join(targetDir, `${fileName}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metaToSave, null, 2), "utf-8");

  const subUrl = extra?.subDir ? `${encodeURIComponent(extra.subDir)}/` : "";
  return {
    ...metaToSave,
    url: `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(fileName)}`,
  };
}

export function listAllPhotos(baseDir: string, options?: ListPhotosOptions): PhotoMetadata[] {
  if (!fs.existsSync(baseDir)) return [];

  const photos: PhotoMetadata[] = [];
  const userDirs = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const d of userDirs) {
    if (!d.isDirectory()) continue;
    const refId = d.name;
    const userDirPath = path.join(baseDir, refId);

    try {
      const entries = fs.readdirSync(userDirPath, { withFileTypes: true });

      const scanDirectory = (dirPath: string, subDir?: string) => {
        const dirFiles = fs.readdirSync(dirPath);
        const processedFiles = new Set<string>();

        for (const f of dirFiles) {
          const frontMatch = f.match(/^([0-9A-Za-z_-]+)_front\.(png|jpg|jpeg)$/i);
          if (frontMatch) {
            const cardId = frontMatch[1];
            const ext = frontMatch[2];
            const frontFile = f;
            processedFiles.add(frontFile);

            const findCandidate = (suffix: string) => {
              const exact = `${cardId}_${suffix}.${ext}`;
              if (dirFiles.includes(exact)) return exact;
              return dirFiles.find((name) => new RegExp(`^${cardId}_${suffix}\\.(png|jpg|jpeg)$`, "i").test(name));
            };

            const backFile = findCandidate("back");
            const holoFile = findCandidate("holo");
            const irFile = findCandidate("ir");
            const frontPrevFile = findCandidate("frontprev") || findCandidate("preview");

            if (backFile) processedFiles.add(backFile);
            if (holoFile) processedFiles.add(holoFile);
            if (irFile) processedFiles.add(irFile);
            if (frontPrevFile) processedFiles.add(frontPrevFile);

            const subUrl = subDir ? `${encodeURIComponent(subDir)}/` : "";
            const frontUrl = `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(frontFile)}`;
            const backUrl = backFile ? `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(backFile)}` : undefined;
            const holoUrl = holoFile ? `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(holoFile)}` : undefined;
            const irUrl = irFile ? `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(irFile)}` : undefined;
            const frontPrevUrl = frontPrevFile ? `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(frontPrevFile)}` : undefined;

            const frontPath = path.join(dirPath, frontFile);
            const frontStat = fs.statSync(frontPath);
            const dimensions = getPngDimensions(frontPath) || undefined;
            const orientation: "portrait" | "landscape" =
              dimensions && dimensions.width >= dimensions.height ? "landscape" : "portrait";

            const cardMeta = parseCardMeta(dirPath);

            let metaToUse: Partial<PhotoMetadata> = {};
            const jsonPath = path.join(dirPath, `${frontFile}.json`);
            if (fs.existsSync(jsonPath)) {
              try {
                metaToUse = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
              } catch {}
            }

            const rawModel = metaToUse.gameModel || "TBS";
            const gameModel = rawModel.split(":")[0].toUpperCase();
            let imageType = metaToUse.imageType || getImageTypeFromFilename(frontFile);
            if (fs.existsSync(path.join(dirPath, "tbs_meta_shinki.json"))) {
              imageType = "Shinki Card";
            } else if (fs.existsSync(path.join(dirPath, "tbs_meta_profile.json"))) {
              imageType = "Profile Card";
            } else if (fs.existsSync(path.join(dirPath, "tbs_meta_photo.json"))) {
              imageType = "Photo Card";
            }

            photos.push({
              fileName: frontFile,
              refId,
              gameModel,
              gameTitle: metaToUse.gameTitle || getGameTitleFromModel(gameModel),
              imageType,
              uploadTime: metaToUse.uploadTime || frontStat.mtime.toISOString(),
              timestamp: metaToUse.timestamp || frontStat.mtime.getTime(),
              fileSizeBytes: metaToUse.fileSizeBytes || frontStat.size,
              sha256: metaToUse.sha256 || "",
              arrangeNum: metaToUse.arrangeNum,
              url: frontUrl,
              cardId,
              isCard: true,
              frontUrl,
              backUrl,
              holoUrl,
              irUrl,
              frontPrevUrl,
              hasHolo: !!holoFile,
              hasBack: !!backFile,
              orientation,
              dimensions,
              cardMeta: Object.keys(cardMeta).length > 0 ? cardMeta : undefined,
            });
          }
        }

        for (const f of dirFiles) {
          if (processedFiles.has(f)) continue;
          const lower = f.toLowerCase();
          if (
            (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) &&
            !lower.endsWith(".json")
          ) {
            if (!options?.includeMasks && isMaskImage(f)) continue;

            const imgPath = path.join(dirPath, f);
            const stat = fs.statSync(imgPath);
            const jsonPath = path.join(dirPath, `${f}.json`);
            const subUrl = subDir ? `${encodeURIComponent(subDir)}/` : "";
            const url = `/photos/${encodeURIComponent(refId)}/${subUrl}${encodeURIComponent(f)}`;

            let metaToUse: Partial<PhotoMetadata> = {};
            if (fs.existsSync(jsonPath)) {
              try {
                metaToUse = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
              } catch {}
            }

            const rawModel = metaToUse.gameModel || "UNKNOWN";
            const gameModel = rawModel.split(":")[0].toUpperCase();
            const dimensions = getPngDimensions(imgPath) || undefined;
            const orientation: "portrait" | "landscape" =
              dimensions && dimensions.width >= dimensions.height ? "landscape" : "portrait";

            photos.push({
              fileName: f,
              refId,
              gameModel,
              gameTitle: metaToUse.gameTitle || getGameTitleFromModel(gameModel),
              imageType: metaToUse.imageType || getImageTypeFromFilename(f),
              uploadTime: metaToUse.uploadTime || stat.mtime.toISOString(),
              timestamp: metaToUse.timestamp || stat.mtime.getTime(),
              fileSizeBytes: metaToUse.fileSizeBytes || stat.size,
              sha256: metaToUse.sha256 || "",
              arrangeNum: metaToUse.arrangeNum,
              url,
              isCard: false,
              orientation,
              dimensions,
            });
          }
        }
      };

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = entry.name;
          const subDirPath = path.join(userDirPath, subDir);
          try {
            scanDirectory(subDirPath, subDir);
          } catch (err) {
            console.error(`[Metadata] Error scanning subfolder ${subDirPath}:`, err);
          }
        } else if (entry.isFile()) {
          const lower = entry.name.toLowerCase();
          if (
            (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) &&
            !lower.endsWith(".json")
          ) {
            if (!options?.includeMasks && isMaskImage(entry.name)) continue;
            const imgPath = path.join(userDirPath, entry.name);
            const stat = fs.statSync(imgPath);
            const jsonPath = path.join(userDirPath, `${entry.name}.json`);
            const url = `/photos/${encodeURIComponent(refId)}/${encodeURIComponent(entry.name)}`;

            let metaToUse: Partial<PhotoMetadata> = {};
            if (fs.existsSync(jsonPath)) {
              try {
                metaToUse = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
              } catch {}
            }

            const rawModel = metaToUse.gameModel || "UNKNOWN";
            const gameModel = rawModel.split(":")[0].toUpperCase();
            const dimensions = getPngDimensions(imgPath) || undefined;
            const orientation: "portrait" | "landscape" =
              dimensions && dimensions.width >= dimensions.height ? "landscape" : "portrait";

            photos.push({
              fileName: entry.name,
              refId,
              gameModel,
              gameTitle: metaToUse.gameTitle || getGameTitleFromModel(gameModel),
              imageType: metaToUse.imageType || getImageTypeFromFilename(entry.name),
              uploadTime: metaToUse.uploadTime || stat.mtime.toISOString(),
              timestamp: metaToUse.timestamp || stat.mtime.getTime(),
              fileSizeBytes: metaToUse.fileSizeBytes || stat.size,
              sha256: metaToUse.sha256 || "",
              arrangeNum: metaToUse.arrangeNum,
              url,
              isCard: false,
              orientation,
              dimensions,
            });
          }
        }
      }
    } catch (err) {
      console.error(`[Metadata] Error reading directory ${userDirPath}:`, err);
    }
  }

  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

export function deletePhoto(baseDir: string, refId: string, fileName: string): boolean {
  const userDir = path.join(baseDir, refId);
  const cardMatch = fileName.match(/^([0-9A-Za-z_-]+)_front\.(png|jpg|jpeg)$/i);
  const cardId = cardMatch ? cardMatch[1] : null;

  const deleteDirIfEmpty = (dir: string) => {
    try {
      const remaining = fs.readdirSync(dir);
      if (remaining.length === 0) {
        fs.rmdirSync(dir);
      }
    } catch {}
  };

  const deleteCardFiles = (dir: string, baseId: string): boolean => {
    let deleted = false;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (
          new RegExp(`^${baseId}(?:_[a-z0-9]+)?\\.(?:png|jpg|jpeg|json|dat)$`, "i").test(f) ||
          f === "meta.xml" ||
          f.startsWith("tbs_meta_") ||
          f === "accessKey.dat"
        ) {
          try {
            fs.unlinkSync(path.join(dir, f));
            deleted = true;
          } catch {}
        }
      }
      deleteDirIfEmpty(dir);
    } catch {}
    return deleted;
  };

  if (cardId && deleteCardFiles(userDir, cardId)) {
    deleteDirIfEmpty(userDir);
    return true;
  }

  const imgPath = path.join(userDir, fileName);
  const jsonPath = path.join(userDir, `${fileName}.json`);
  let deleted = false;
  if (fs.existsSync(imgPath)) {
    fs.unlinkSync(imgPath);
    deleted = true;
  }
  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
  }

  if (!deleted) {
    try {
      const entries = fs.readdirSync(userDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const subDirPath = path.join(userDir, e.name);
          if (cardId || e.name === cardId) {
            if (deleteCardFiles(subDirPath, cardId || e.name)) {
              deleteDirIfEmpty(subDirPath);
              deleted = true;
              break;
            }
          }
          const subImg = path.join(subDirPath, fileName);
          const subJson = path.join(subDirPath, `${fileName}.json`);
          if (fs.existsSync(subImg)) {
            fs.unlinkSync(subImg);
            deleted = true;
          }
          if (fs.existsSync(subJson)) {
            fs.unlinkSync(subJson);
          }
          if (deleted) {
            deleteDirIfEmpty(subDirPath);
            break;
          }
        }
      }
    } catch {}
  }

  deleteDirIfEmpty(userDir);
  return deleted;
}

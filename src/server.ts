import express from "express";
import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";
import { CONFIG, openBrowser } from "./config";
import { extractTar } from "./tar";
import { ensureDirectoryExists, savePhotoWithMetadata } from "./metadata";
import { apiRouter } from "./routes/api";
import { webuiRouter } from "./routes/webui";

function pad(str: string, length: number): string {
  const totalPadding = Math.max(0, length - str.length);
  const padStart = Math.floor(totalPadding / 2);
  const padEnd = totalPadding - padStart;
  return " ".repeat(padStart) + str + " ".repeat(padEnd);
}

function logInfo(msg: string): void {
  console.log(`  [${chalk.yellowBright("uploader")}] ${msg}`);
}

const app = express();

ensureDirectoryExists(CONFIG.SAVEDATA_DIR);

const viewsDir = fs.existsSync(path.resolve(__dirname, "../views"))
  ? path.resolve(__dirname, "../views")
  : path.resolve(__dirname, "views");
const publicDir = fs.existsSync(path.resolve(__dirname, "../public"))
  ? path.resolve(__dirname, "../public")
  : path.resolve(__dirname, "public");

app.set("views", viewsDir);
app.set("view engine", "pug");
app.disable("x-powered-by");
app.disable("etag");

app.use("/public", express.static(publicDir));
app.use("/css", express.static(path.join(publicDir, "css")));
app.use("/js", express.static(path.join(publicDir, "js")));
app.use("/fonts", express.static(path.join(publicDir, "fonts")));
app.use(express.static(publicDir));

app.use(
  "/photos",
  express.static(CONFIG.SAVEDATA_DIR, {
    maxAge: "1d",
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  })
);

app.use(
  express.raw({
    type: ["application/octet-stream", "multipart/form-data"],
    limit: "50mb",
  })
);

interface MultipartPart {
  headers: Record<string, string>;
  name?: string;
  filename?: string;
  contentType?: string;
  data: Buffer;
}

function parseMultipartBody(body: Buffer, contentTypeHeader?: string): MultipartPart[] | null {
  let boundary: Buffer | null = null;
  if (contentTypeHeader) {
    const m = contentTypeHeader.match(/boundary=([^;]+)/i);
    if (m && m[1]) {
      let bStr = m[1].trim();
      if (bStr.startsWith('"') && bStr.endsWith('"')) {
        bStr = bStr.slice(1, -1);
      }
      boundary = Buffer.from(`--${bStr}`);
    }
  }

  if (!boundary) {
    const bIdx = body.indexOf(Buffer.from("--"));
    if (bIdx !== -1 && bIdx < 128) {
      const crlf = body.indexOf(Buffer.from("\r\n"), bIdx);
      if (crlf !== -1) {
        boundary = body.subarray(bIdx, crlf);
      }
    }
  }

  if (!boundary || boundary.length === 0) return null;

  const parts: MultipartPart[] = [];
  let offset = body.indexOf(boundary);
  if (offset === -1) return null;

  while (offset < body.length) {
    const nextIdx = body.indexOf(boundary, offset + boundary.length);
    if (nextIdx === -1) break;

    let partChunk = body.subarray(offset + boundary.length, nextIdx);
    if (partChunk.length >= 2 && partChunk[0] === 0x0d && partChunk[1] === 0x0a) {
      partChunk = partChunk.subarray(2);
    }
    if (partChunk.length >= 2 && partChunk[partChunk.length - 2] === 0x0d && partChunk[partChunk.length - 1] === 0x0a) {
      partChunk = partChunk.subarray(0, partChunk.length - 2);
    }

    const headerEnd = partChunk.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const headerStr = partChunk.subarray(0, headerEnd).toString("utf-8");
      const partData = partChunk.subarray(headerEnd + 4);

      const headers: Record<string, string> = {};
      for (const line of headerStr.split(/\r?\n/)) {
        const colon = line.indexOf(":");
        if (colon !== -1) {
          headers[line.substring(0, colon).trim().toLowerCase()] = line.substring(colon + 1).trim();
        }
      }

      const disp = headers["content-disposition"] || "";
      const nameMatch = disp.match(/name="([^"]+)"/i);
      const fileMatch = disp.match(/filename="([^"]+)"/i);

      parts.push({
        headers,
        name: nameMatch ? nameMatch[1] : undefined,
        filename: fileMatch ? path.basename(fileMatch[1]) : undefined,
        contentType: headers["content-type"],
        data: partData,
      });
    }

    offset = nextIdx;
    if (body.subarray(offset + boundary.length, offset + boundary.length + 2).toString("ascii") === "--") {
      break;
    }
  }

  return parts.length > 0 ? parts : null;
}

app.post("/upload", (req: express.Request, res: express.Response) => {
  const body = req.body;

  if (!Buffer.isBuffer(body) || body.length === 0) {
    logInfo(chalk.yellow("Received empty body at /upload"));
    return res.status(400).send("Empty Body");
  }

  logInfo(`Received HTTP POST payload (${body.length} bytes) from ${req.ip}`);

  const queryRef = (req.query.refid || req.query.ref_id) as string | undefined;
  const queryGame = (req.query.game || req.query.model) as string | undefined;
  const querySubdir = (req.query.subdir || req.query.sub_dir || req.query.arrange) as string | undefined;
  const gameModel = queryGame ? decodeURIComponent(queryGame).trim() : "UNKNOWN";
  const refId = queryRef ? decodeURIComponent(queryRef).trim() : "UNKNOWN";
  const rawSubdir = querySubdir ? decodeURIComponent(querySubdir).trim() : "";

  const contentType = (req.headers["content-type"] as string) || "";
  const multipartParts = parseMultipartBody(body, contentType);

  if (multipartParts && multipartParts.length > 0) {
    let detectedSubDir = "";
    for (const part of multipartParts) {
      const fn = part.filename || "";
      const m = fn.match(/^([0-9A-Za-z_-]+)_(?:front|back|holo|ir|preview|frontprev)\.(?:png|jpg|jpeg)$/i);
      if (m) {
        detectedSubDir = m[1];
        break;
      }
    }

    const subDir = rawSubdir || detectedSubDir || `upload_${Date.now()}`;
    const targetDir = path.join(CONFIG.SAVEDATA_DIR, refId, subDir);
    ensureDirectoryExists(targetDir);

    for (const part of multipartParts) {
      const fileName = part.filename || (part.name ? `${part.name}.dat` : `part_${Date.now()}.dat`);
      const lower = fileName.toLowerCase();
      const isPng = part.data.length >= 8 && part.data[0] === 0x89 && part.data[1] === 0x50 && part.data[2] === 0x4e && part.data[3] === 0x47;
      const isJpg = part.data.length >= 3 && part.data[0] === 0xff && part.data[1] === 0xd8 && part.data[2] === 0xff;

      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || isPng || isJpg) {
        const meta = savePhotoWithMetadata(CONFIG.SAVEDATA_DIR, refId, fileName, part.data, { gameModel, subDir });
        logInfo(
          `  -> Saved photo: ${chalk.green(meta.fileName)} (${(meta.fileSizeBytes / 1024).toFixed(1)} KB) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
        );
      } else {
        fs.writeFileSync(path.join(targetDir, fileName), part.data);
        logInfo(
          `  -> Saved metadata: ${chalk.green(fileName)} (${part.data.length} bytes) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
        );
      }
    }
  } else {
    const originalFileName = `upload_${Date.now()}.tar`;
    const extractedFiles = extractTar(body);
    if (extractedFiles.length > 0) {
      logInfo(`Unpacked ${extractedFiles.length} file(s) from TAR archive:`);
      let detectedSubDir = "";
      for (const f of extractedFiles) {
        const m = f.name.match(/^([0-9A-Za-z_-]+)_(?:front|back|holo|ir|preview|frontprev)\.(?:png|jpg|jpeg)$/i);
        if (m) {
          detectedSubDir = m[1];
          break;
        }
      }

      const subDir = rawSubdir || detectedSubDir || `upload_${Date.now()}`;
      const targetDir = path.join(CONFIG.SAVEDATA_DIR, refId, subDir);
      ensureDirectoryExists(targetDir);

      for (const f of extractedFiles) {
        if (f.name.toLowerCase().endsWith(".jpg") || f.name.toLowerCase().endsWith(".jpeg") || f.name.toLowerCase().endsWith(".png")) {
          const meta = savePhotoWithMetadata(CONFIG.SAVEDATA_DIR, refId, f.name, f.data, { gameModel, subDir });
          logInfo(
            `  -> Saved photo: ${chalk.green(meta.fileName)} (${(meta.fileSizeBytes / 1024).toFixed(1)} KB) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
          );
        } else {
          fs.writeFileSync(path.join(targetDir, f.name), f.data);
          logInfo(
            `  -> Saved metadata: ${chalk.green(f.name)} (${f.data.length} bytes) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
          );
        }
      }
    } else {
      const isPng = body.length >= 8 && body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47;
      const isJpg = body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;

      const subDir = rawSubdir || `upload_${Date.now()}`;
      const targetDir = path.join(CONFIG.SAVEDATA_DIR, refId, subDir);
      ensureDirectoryExists(targetDir);

      if (isPng || isJpg) {
        const imgExt = isPng ? ".png" : ".jpg";
        const imgName = `photo_${Date.now()}${imgExt}`;
        const meta = savePhotoWithMetadata(CONFIG.SAVEDATA_DIR, refId, imgName, body, { gameModel, subDir });
        logInfo(
          `  -> Saved photo: ${chalk.green(meta.fileName)} (${(meta.fileSizeBytes / 1024).toFixed(1)} KB) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
        );
      } else {
        fs.writeFileSync(path.join(targetDir, originalFileName), body);
        logInfo(
          `  -> Saved raw binary file: ${originalFileName} (${body.length} bytes) in [${chalk.yellow(subDir)}] for RefID: ${chalk.cyan(refId)}`
        );
      }
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Content-Length": "2",
    "X-Eamuse-Uploader-Status": "200",
  });
  res.end("OK");
});

app.use("/", webuiRouter);
app.use("/api", apiRouter);

const bindHost = CONFIG.BIND === "localhost" ? "127.0.0.1" : CONFIG.BIND;

app.listen(CONFIG.PORT, bindHost, () => {
  process.title = "Asphyxia EA3 Uploader";

  console.log('                        _                _        ');
  console.log('        /\\             | |              (_)      ');
  console.log('       /  \\   ___ _ __ | |__  _   ___  ___  __ _ ');
  console.log("      / /\\ \\ / __| '_ \\| '_ \\| | | \\ \\/ / |/ _` |");
  console.log('     / ____ \\\\__ \\ |_) | | | | |_| |>  <| | (_| |');
  console.log('    /_/    \\_\\___/ .__/|_| |_|\\__, /_/\\_\\_|\\__,_|');
  console.log('                 | |           __/ |              ');
  console.log('                 |_|          |___/               ');
  console.log("");
  console.log(chalk.cyanBright(pad("EA3 UPLOADER", 60)));
  console.log(" ");
  console.log(chalk.redBright(pad("FREE SOFTWARE. BEWARE OF SCAMMERS.", 60)));
  console.log(pad("If you bought this software, request refund immediately.", 60));
  console.log(" ");

  const openAddr = CONFIG.BIND === "0.0.0.0" ? "localhost" : CONFIG.BIND;
  const serverInfo = `${CONFIG.BIND} at ${CONFIG.PORT}`;
  const httpInfo = `http://${openAddr}:${CONFIG.PORT}`;

  console.log(`   +=============== Server Started ===============+`);
  console.log(`   | - Listening - - - - - - - - - - - - - - - - -|`);
  console.log(`   |${pad(serverInfo, 46)}|`);
  console.log(`   | - WebUI - - - - - - - - - - - - - - - - - - -|`);
  console.log(`   |${pad(httpInfo, 46)}|`);
  console.log(`   +==============================================+`);
  console.log("");

  if (CONFIG.WEBUI_ON_STARTUP) {
    try {
      openBrowser(`http://${openAddr}:${CONFIG.PORT}`);
    } catch {}
  }
});

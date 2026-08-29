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

app.post("/upload", (req: express.Request, res: express.Response) => {
  const body = req.body;

  if (!Buffer.isBuffer(body) || body.length === 0) {
    logInfo(chalk.yellow("Received empty body at /upload"));
    return res.status(400).send("Empty Body");
  }

  logInfo(`Received HTTP POST payload (${body.length} bytes) from ${req.ip}`);

  let payloadBuffer = body;
  let originalFileName = `upload_${Date.now()}.tar`;

  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    const bodyHeaderStr = body.subarray(0, Math.min(body.length, 2048)).toString("ascii");
    const filenameMatch =
      bodyHeaderStr.match(/filename="([^"]+)"/i) || bodyHeaderStr.match(/name="([^"]+)"/i);
    if (filenameMatch && filenameMatch[1]) {
      originalFileName = path.basename(filenameMatch[1]);
    }

    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd !== -1) {
      const boundaryEnd = body.lastIndexOf(Buffer.from("\r\n--"));
      if (boundaryEnd > headerEnd) {
        payloadBuffer = body.subarray(headerEnd + 4, boundaryEnd);
      } else {
        payloadBuffer = body.subarray(headerEnd + 4);
      }
    }
  }

  const parts = originalFileName.split("_");
  const refId = parts[0] || "UNKNOWN";
  const queryGame = (req.query.game || req.query.model) as string | undefined;
  const gameModel = queryGame ? decodeURIComponent(queryGame).trim() : undefined;

  const extractedFiles = extractTar(payloadBuffer);
  if (extractedFiles.length > 0) {
    logInfo(`Unpacked ${extractedFiles.length} file(s) from TAR archive:`);
    for (const f of extractedFiles) {
      if (f.name.toLowerCase().endsWith(".jpg") || f.name.toLowerCase().endsWith(".jpeg") || f.name.toLowerCase().endsWith(".png")) {
        const meta = savePhotoWithMetadata(CONFIG.SAVEDATA_DIR, refId, f.name, f.data, { gameModel });
        logInfo(
          `  -> Saved photo: ${chalk.green(meta.fileName)} (${(meta.fileSizeBytes / 1024).toFixed(1)} KB) for RefID: ${chalk.cyan(refId)}`
        );
      } else {
        const userDir = path.join(CONFIG.SAVEDATA_DIR, refId);
        ensureDirectoryExists(userDir);
        fs.writeFileSync(path.join(userDir, f.name), f.data);
      }
    }
  } else {
    const jpegStart = payloadBuffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]));
    const jpegEnd = payloadBuffer.lastIndexOf(Buffer.from([0xff, 0xd9]));

    if (jpegStart !== -1 && jpegEnd !== -1 && jpegEnd > jpegStart) {
      const jpegData = payloadBuffer.subarray(jpegStart, jpegEnd + 2);
      const jpegName = originalFileName.replace(/\.tar$/i, ".jpg");
      const meta = savePhotoWithMetadata(CONFIG.SAVEDATA_DIR, refId, jpegName, jpegData, { gameModel });
      logInfo(
        `  -> Saved extracted JPEG: ${chalk.green(meta.fileName)} (${(meta.fileSizeBytes / 1024).toFixed(1)} KB) for RefID: ${chalk.cyan(refId)}`
      );
    } else {
      const userDir = path.join(CONFIG.SAVEDATA_DIR, refId);
      ensureDirectoryExists(userDir);
      fs.writeFileSync(path.join(userDir, originalFileName), payloadBuffer);
      logInfo(
        `  -> Saved raw binary file: ${originalFileName} (${payloadBuffer.length} bytes)`
      );
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Content-Length": "2",
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

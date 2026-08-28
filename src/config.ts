import * as fs from "fs";
import * as path from "path";
import * as ini from "ini";
import { exec } from "child_process";

// Determine execution directory (works for ts-node, node dist/server.js, and pkg single binary)
const EXEC_PATH = (process as any).pkg
  ? path.dirname(process.argv0)
  : process.cwd();

export const CONFIG_PATH = path.join(EXEC_PATH, "config_uploader.ini");

export interface UploaderConfig {
  PORT: number;
  BIND: string;
  SAVEDATA_DIR: string;
  BANDWIDTH: number;
  URL_VALID_SEC: number;
  WEBUI_ON_STARTUP: boolean;
  PUBLIC_HOST: string;
}

const DEFAULT_CONFIG = {
  port: 8084,
  bind: "localhost",
  savedata_dir: "./savedata/photos",
  bandwidth: 104857600,
  url_valid_sec: 86400,
  webui_on_startup: true,
};

export function loadOrCreateConfig(): UploaderConfig {
  let raw: any = {};

  if (!fs.existsSync(CONFIG_PATH)) {
    // Generate default config_uploader.ini without comments (matches Asphyxia CORE config.ini)
    const initialIniContent = `port=8084
bind=localhost
savedata_dir=./savedata/photos
bandwidth=104857600
url_valid_sec=86400
webui_on_startup=true
`;
    try {
      fs.writeFileSync(CONFIG_PATH, initialIniContent, "utf-8");
    } catch (err) {
      console.error(`[Config] Failed to create initial config file:`, err);
    }
    raw = { ...DEFAULT_CONFIG };
  } else {
    try {
      const content = fs.readFileSync(CONFIG_PATH, "utf-8");
      raw = ini.parse(content);
    } catch (err) {
      console.error(`[Config] Error reading ${CONFIG_PATH}, using defaults:`, err);
      raw = { ...DEFAULT_CONFIG };
    }
  }

  const port = raw.port ? parseInt(String(raw.port), 10) : DEFAULT_CONFIG.port;
  const bind = String(raw.bind || DEFAULT_CONFIG.bind).trim();
  const rawSaveDir = String(raw.savedata_dir || DEFAULT_CONFIG.savedata_dir).trim();
  const bandwidth = raw.bandwidth ? parseInt(String(raw.bandwidth), 10) : DEFAULT_CONFIG.bandwidth;
  const urlValidSec = raw.url_valid_sec ? parseInt(String(raw.url_valid_sec), 10) : DEFAULT_CONFIG.url_valid_sec;
  const webuiOnStartup =
    raw.webui_on_startup !== undefined
      ? String(raw.webui_on_startup).toLowerCase() === "true"
      : DEFAULT_CONFIG.webui_on_startup;

  // Resolve savedata directory: if relative, resolve from EXEC_PATH
  const savedataDir = path.isAbsolute(rawSaveDir)
    ? rawSaveDir
    : path.resolve(EXEC_PATH, rawSaveDir);

  const publicHost = bind === "0.0.0.0" || bind === "localhost" ? "127.0.0.1" : bind;

  return {
    PORT: isNaN(port) ? DEFAULT_CONFIG.port : port,
    BIND: bind,
    SAVEDATA_DIR: savedataDir,
    BANDWIDTH: isNaN(bandwidth) ? DEFAULT_CONFIG.bandwidth : bandwidth,
    URL_VALID_SEC: isNaN(urlValidSec) ? DEFAULT_CONFIG.url_valid_sec : urlValidSec,
    WEBUI_ON_STARTUP: webuiOnStartup,
    PUBLIC_HOST: publicHost,
  };
}

export const CONFIG = loadOrCreateConfig();

/**
 * Open default browser on Windows / macOS / Linux.
 */
export function openBrowser(url: string): void {
  const start =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "start"
      : "xdg-open";

  exec(`${start} ${url}`, (err) => {
    if (err) {
      // Silently catch browser open error
    }
  });
}

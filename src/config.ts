import * as fs from "fs";
import * as path from "path";
import * as ini from "ini";
import { exec } from "child_process";

const EXEC_PATH = (process as any).pkg
  ? path.dirname(process.argv0)
  : process.cwd();

export const CONFIG_PATH = path.join(EXEC_PATH, "config_uploader.ini");

export interface UploaderConfig {
  PORT: number;
  BIND: string;
  SAVEDATA_DIR: string;
  WEBUI_ON_STARTUP: boolean;
  PUBLIC_HOST: string;
}

const DEFAULT_CONFIG = {
  port: 8084,
  bind: "localhost",
  savedata_dir: "./savedata/photos",
  webui_on_startup: true,
};

export function loadOrCreateConfig(): UploaderConfig {
  let raw: any = {};

  if (!fs.existsSync(CONFIG_PATH)) {
    const initialIniContent = `port=8084
bind=localhost
savedata_dir=./savedata/photos
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
  const webuiOnStartup =
    raw.webui_on_startup !== undefined
      ? String(raw.webui_on_startup).toLowerCase() === "true"
      : DEFAULT_CONFIG.webui_on_startup;

  const savedataDir = path.isAbsolute(rawSaveDir)
    ? rawSaveDir
    : path.resolve(EXEC_PATH, rawSaveDir);

  const publicHost = bind === "0.0.0.0" || bind === "localhost" ? "127.0.0.1" : bind;

  return {
    PORT: isNaN(port) ? DEFAULT_CONFIG.port : port,
    BIND: bind,
    SAVEDATA_DIR: savedataDir,
    WEBUI_ON_STARTUP: webuiOnStartup,
    PUBLIC_HOST: publicHost,
  };
}

export const CONFIG = loadOrCreateConfig();

export function openBrowser(url: string): void {
  const start =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
      ? "start"
      : "xdg-open";

  exec(`${start} ${url}`, () => {});
}

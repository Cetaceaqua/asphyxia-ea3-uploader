import { XMLParser, XMLBuilder } from "fast-xml-parser";
import * as iconv from "iconv-lite";
import { CONFIG } from "./config";

export interface ParsedXRPCRequest {
  model: string;
  srcid: string;
  module: string;
  method: string;
  bindedUser?: string;
  contentList?: any[];
  arrangeNum?: string;
  raw: any;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  trimValues: true,
});

/**
 * Parses raw XML bytes (supports Shift-JIS & UTF-8) into a structured XRPC request.
 */
export function parseXRPCRequest(bodyBuffer: Buffer): ParsedXRPCRequest | null {
  try {
    // Detect encoding from XML declaration header
    const headerSlice = bodyBuffer.subarray(0, 100).toString("ascii");
    const isShiftJIS = /encoding=["']shift[-_]jis["']/i.test(headerSlice);
    const xmlString = isShiftJIS
      ? iconv.decode(bodyBuffer, "shift_jis")
      : iconv.decode(bodyBuffer, "utf-8");

    const parsed = parser.parse(xmlString);
    const call = parsed.call || parsed["?xml"]?.call || parsed;
    const model = call["@_model"] || "UNKNOWN";
    const srcid = call["@_srcid"] || "00000000000000000000";

    const uploader = call.uploader;
    if (!uploader) return null;

    const method = uploader["@_method"] || "";
    const bindedUser =
      uploader.bindedUser?.["#text"] ||
      uploader.bindedUser ||
      uploader.item?.uid?.["#text"] ||
      uploader.item?.uid;
    const arrangeNum =
      uploader.arrangeNum?.["#text"] || uploader.arrangeNum;

    return {
      model,
      srcid,
      module: "uploader",
      method,
      bindedUser: typeof bindedUser === "string" ? bindedUser : undefined,
      arrangeNum: typeof arrangeNum === "string" ? arrangeNum : undefined,
      raw: parsed,
    };
  } catch (err) {
    console.error("[XRPC] Failed to parse XML RPC body:", err);
    return null;
  }
}

/**
 * Builds standard XML response for declareUpload.
 */
export function buildDeclareUploadResponse(
  srcid: string,
  arrangeNum: string,
  publicHost: string,
  port: number
): Buffer {
  const uploadUrl = `http://${publicHost}:${port}/upload`;
  const xml = `<?xml version="1.0" encoding="SHIFT_JIS"?>
<response dstid="${srcid}">
    <uploader method="declareUpload">
        <arrangeNum __type="str">${arrangeNum}</arrangeNum>
        <uploadUrl __type="str">${uploadUrl}</uploadUrl>
        <urlValidSec __type="s32">${CONFIG.URL_VALID_SEC}</urlValidSec>
        <accessKey __type="str">MZ4Eof5qdyLLN1IX3BkD7sWyQ374yPm1</accessKey>
        <bandWidth __type="s32">${CONFIG.BANDWIDTH}</bandWidth>
        <expireDate __type="str">2030-12-31</expireDate>
    </uploader>
</response>`;

  return iconv.encode(xml, "shift_jis");
}

/**
 * Builds standard XML response for commitUpload.
 */
export function buildCommitUploadResponse(srcid: string): Buffer {
  const xml = `<?xml version="1.0" encoding="SHIFT_JIS"?>
<response dstid="${srcid}">
    <uploader method="commitUpload" status="0"/>
</response>`;

  return iconv.encode(xml, "shift_jis");
}

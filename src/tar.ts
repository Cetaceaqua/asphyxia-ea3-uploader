import * as path from "path";

export interface ExtractedFile {
  name: string;
  size: number;
  data: Buffer;
}

/**
 * Basic POSIX tar archive extractor to unpack files without third-party dependencies.
 */
export function extractTar(tarBuffer: Buffer): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  let offset = 0;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    // Check for empty block (end of tar archive)
    if (header.every((b) => b === 0)) break;

    // File name: 0..100 (null-terminated ascii)
    let nameEnd = header.indexOf(0, 0);
    if (nameEnd < 0 || nameEnd > 100) nameEnd = 100;
    const rawName = header.subarray(0, nameEnd).toString("ascii").trim();
    if (!rawName) break;

    // File size: 124..136 in octal ASCII
    const sizeStr = header.subarray(124, 136).toString("ascii").trim().replace(/\0/g, "");
    const size = parseInt(sizeStr, 8);

    offset += 512;
    if (isNaN(size) || size < 0 || offset + size > tarBuffer.length) break;

    const fileData = tarBuffer.subarray(offset, offset + size);
    files.push({
      name: path.basename(rawName),
      size: fileData.length,
      data: fileData,
    });

    // In tar archives, each file data block is padded to a multiple of 512 bytes
    offset += Math.ceil(size / 512) * 512;
  }

  return files;
}

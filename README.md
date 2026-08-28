# asphyxia-ea3-uploader

A standalone, high-performance Konami EA3 photo and media upload server microservice designed for Asphyxia CORE and modern arcade emulators.

## Features

- **Standard EA3 XRPC Support**: Implements `uploader.declareUpload` and `uploader.commitUpload` with Shift-JIS / UTF-8 XML handling.
- **Universal Multi-Game Archiving**: Supports LovePlus Arcade, SOUND VOLTEX, Nostalgia, and any Konami e-Amusement arcade game that uploads photos or media.
- **TAR Archive Extraction**: Built-in POSIX TAR extractor unpacking multipart uploads and JPEG streams without third-party dependencies.
- **Structured JSON Metadata**: Persists comprehensive metadata sidecar files (`<photo>.json`) recording Game Model, Player RefID/Card, Upload Timestamp, File Size, and SHA256 Hash.
- **Dedicated Responsive WebUI**: Beautiful dark-themed Gallery on `http://localhost:8084` with photo grid, search, filters by game/player, lightbox preview modal, and original file downloads.
- **Standalone Executable**: Zero-dependency single binary `.exe` distribution compiled with `pkg`.

## Quick Start

### Running from source
```bash
npm install
npm run build
npm start
```

### Running the pre-compiled binary
Double-click `bin/asphyxia-ea3-uploader.exe`.

### Configuration (`.env`)
```ini
PORT=8084
HOST=0.0.0.0
PUBLIC_HOST=127.0.0.1
SAVEDATA_DIR=D:/Arcade_PC/asphyxia-core-win-x64/savedata/photos
BANDWIDTH=104857600
URL_VALID_SEC=86400
```

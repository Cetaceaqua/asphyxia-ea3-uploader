@echo off
setlocal enabledelayedexpansion
title Clean
chcp 65001 >nul
cd /d "%~dp0"

echo [*] Cleaning Asphyxia EA3 Uploader build artifacts...

:: 1. Terminate any running instance of the uploader to release file locks
taskkill /f /im asphyxia-ea3-uploader.exe >nul 2>&1

:: 2. Remove compiled JavaScript directory (dist)
if exist "dist" (
    echo [*] Removing dist directory...
    rmdir /s /q "dist" >nul 2>&1
)

:: 3. Remove standalone binary directory (bin)
if exist "bin" (
    echo [*] Removing bin directory...
    rmdir /s /q "bin" >nul 2>&1
)

:: 4. Remove temporary caches and logs
if exist "*.tsbuildinfo" (
    del /f /q "*.tsbuildinfo" >nul 2>&1
)
if exist "*.log" (
    del /f /q "*.log" >nul 2>&1
)

echo.
echo  [SUCCESS] Clean completed successfully!
echo.

pause

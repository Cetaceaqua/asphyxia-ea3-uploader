@echo off
setlocal enabledelayedexpansion
title Build
chcp 65001 >nul
cd /d "%~dp0"

:: 1. Check Node.js and npm
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check and install dependencies if needed
if not exist "node_modules" (
    echo [*] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install npm dependencies!
        echo.
        pause
        exit /b 1
    )
)

:: 3. Compile TypeScript
echo [*] Compiling TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed!
    echo.
    pause
    exit /b 1
)

:: 4. Package standalone Windows executable via pkg
echo [*] Packaging standalone executable...
if not exist "bin" mkdir "bin"
call npm run package
if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    echo.
    pause
    exit /b 1
)

echo.
echo  [SUCCESS] Build and packaging completed!
echo.

pause

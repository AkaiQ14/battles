@echo off
REM Card Battle Server - Quick Start Script for Windows
REM This script will install dependencies and start the server

echo 🎮 Card Battle Server - Quick Start
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version %NODE_VERSION% detected

REM Navigate to server directory
cd /d "%~dp0"

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the server directory.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Start the server
echo 🚀 Starting Card Battle Server...
echo    Server will be available at: http://localhost:3000
echo    Health check: http://localhost:3000/health
echo    Press Ctrl+C to stop the server
echo.

npm start

pause
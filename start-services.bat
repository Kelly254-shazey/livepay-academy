@echo off
REM LiveGate Full Stack Startup Script for Windows
REM This script starts all services in the correct order

setlocal enabledelayedexpansion

echo ================================
echo Starting LiveGate Services (Windows)
echo ================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    exit /b 1
)

echo [INFO] Starting Docker containers...
cd backend
docker-compose up -d --build
if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers
    exit /b 1
)
cd ..

echo [INFO] Waiting for MySQL to be healthy...
timeout /t 10 /nobreak

echo [INFO] Running Node.js Prisma migrations...
docker-compose -f backend/docker-compose.yml exec -T nodejs-service npm run prisma:migrate:deploy

echo.
echo [SUCCESS] All backend services are running!
echo.
echo Service URLs:
echo   Frontend Web:         http://localhost:5173
echo   Frontend Mobile:      Use Expo Go with QR code
echo   Node.js API:          http://localhost:3000
echo   Swagger Docs:         http://localhost:3000/docs
echo   Python Service:       http://localhost:8000
echo   Java Service:         http://localhost:8080
echo   MySQL:                localhost:3306
echo   Redis:                localhost:6379
echo.
echo [INFO] Next steps in separate terminals:
echo   1. frontend\web ^> npm install ^&^& npm run dev
echo   2. frontend\mobile ^> npm install ^&^& npx expo start
echo   3. Open http://localhost:5173 in your browser
echo.
pause

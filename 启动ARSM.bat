@echo off
chcp 65001 >nul 2>&1
title ARSM
cd /d "G:\Hermes Agent\ARSM\ARSM"

echo.
echo ========================================
echo     ARSM - Private Audio Library
echo ========================================
echo.
echo Seeding...
call node_modules\.bin\tsx.cmd prisma\seed.ts 2>nul

echo Stopping old server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul

echo.
echo ========================================
echo   Login:  admin / admin
echo   URL:    http://localhost:3000
echo   Close this window to stop server
echo ========================================
echo.
echo Starting... (wait ~10 seconds for "ready")
echo.

start http://localhost:3000
call node_modules\.bin\next.cmd dev -p 3000
pause

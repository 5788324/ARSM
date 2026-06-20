@echo off
chcp 65001 >nul 2>&1
title ARSM
cd /d "G:\Hermes Agent\ARSM\ARSM"

echo.
echo ========================================
echo     ARSM - Private Audio Library
echo ========================================
echo.
echo Seeding admin account...
call node_modules\.bin\tsx.cmd prisma\seed.ts 2>nul

echo Stopping old server (if any)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
start http://localhost:3000

echo.
echo ========================================
echo  Browser: http://localhost:3000
echo  Login:   admin / admin
echo ========================================
echo  Close this window to stop the server
echo ========================================
echo.

call node_modules\.bin\next.cmd dev -p 3000

pause

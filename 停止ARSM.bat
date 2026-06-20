@echo off
chcp 65001 >nul
setlocal
set FOUND=
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
  set FOUND=1
  taskkill /F /PID %%a >nul 2>nul
)

if defined FOUND (
  echo ARSM ??????
) else (
  echo ???????? ARSM ???
)

pause

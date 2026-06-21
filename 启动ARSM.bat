@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do (
  start "" http://127.0.0.1:3000
  echo ARSM ??????????????
  goto :end
)

if not exist logs mkdir logs

echo 同步数据库...
call npx prisma db push --skip-generate
if errorlevel 1 (
  echo 数据库结构同步失败
  goto :end
)

call node_modules\\.bin\\tsx.cmd prisma\\seed.ts 2>nul
if errorlevel 1 (
  echo ???????????
  goto :end
)

echo ????...
call npm.cmd run build
if errorlevel 1 (
  echo ???????????
  goto :end
)

echo ?? ARSM ??...
start "ARSM Server" /min cmd /c "cd /d "%cd%" && node node_modules\next\dist\bin\next start -p 3000 1> logs\arsm-server.out.log 2> logs\arsm-server.err.log"

echo ??????...
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 20;$i++){ try { $r=Invoke-WebRequest 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200){$ok=$true; break} } catch {}; Start-Sleep -Seconds 1 }; if(-not $ok){ exit 1 }"
if errorlevel 1 (
  echo ?????????? logs\arsm-server.err.log
  goto :end
)

start "" http://127.0.0.1:3000
echo ARSM ????http://127.0.0.1:3000

echo ??????????ARSM.bat

:end
pause

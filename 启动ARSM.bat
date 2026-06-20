@echo off
chcp 65001 >nul
cd /d "G:\Hermes Agent\ARSM\ARSM"

echo.
echo ╔══════════════════════════════════════╗
echo ║     ARSM — 私人音频图书馆            ║
echo ╠══════════════════════════════════════╣
echo ║  启动中...                           ║
echo ║  关闭此窗口即可停止服务               ║
echo ╚══════════════════════════════════════╝
echo.

REM Ensure admin user exists with correct password
echo 检查管理员账号...
npx tsx prisma/seed.ts 2>nul

REM Start dev server and open browser
start http://localhost:3000
echo.
echo 浏览器已打开 → http://localhost:3000
echo 用户名: admin  密码: admin
echo.
echo 关闭此窗口停止服务...
echo ─────────────────────────────────────
echo.

npx next dev

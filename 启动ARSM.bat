@echo off
title ARSM - 私人音频图书馆
cd /d "G:\Hermes Agent\ARSM\ARSM"

echo.
echo ========================================
echo     ARSM -- 私人音频图书馆
echo ========================================
echo.
echo 正在检查管理员账号...
call npx tsx prisma/seed.ts 2>nul

echo.
echo 正在启动服务...
start http://localhost:3000

echo.
echo ========================================
echo  浏览器已打开: http://localhost:3000
echo  用户名: admin    密码: admin
echo ========================================
echo  关闭此窗口即可停止服务
echo ========================================
echo.

call npx next dev -p 3000

pause

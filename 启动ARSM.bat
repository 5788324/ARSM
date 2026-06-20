@echo off
chcp 65001 >nul 2>&1
title ARSM — 私人音频图书馆
cd /d "G:\Hermes Agent\ARSM\ARSM"

echo.
echo ========================================
echo     ARSM — 私人音频图书馆
echo ========================================
echo.
echo 1. 检查管理员账号...
call node_modules\.bin\tsx.cmd prisma\seed.ts 2>nul

echo 2. 关闭旧服务(如有)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING" 2^>nul') do taskkill /F /PID %%a 2>nul

echo 3. 启动服务...
echo.
echo ========================================
echo    账号: admin    密码: admin
echo ========================================
echo    ** 等出现 "ready" 后 **
echo    手动打开浏览器访问: http://localhost:3000
echo    关此窗口 = 停止服务
echo ========================================
echo.

call node_modules\.bin\next.cmd dev -p 3000
pause

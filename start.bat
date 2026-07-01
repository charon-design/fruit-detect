@echo off
chcp 65001 >nul
title 水果病害检测系统

echo ========================================
echo   水果病害+新鲜度检测系统
echo ========================================
echo.

:: 启动 Flask 服务器（后台运行，日志隐藏）
echo [1/2] 启动服务器...
start /b "" "D:\Users\LEGIGN\anaconda3\envs\fruit_detect\python.exe" "%~dp0api\server.py" >nul 2>&1

:: 等待服务器启动
timeout /t 3 /nobreak >nul

:: 启动 Cloudflare 隧道，日志写入临时文件
echo [2/2] 创建公网隧道...
set "LOGFILE=%TEMP%\cloudflared_log.txt"
del "%LOGFILE%" >nul 2>&1

start /b "" "C:\Users\LEGIGN\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe" tunnel --url http://localhost:5000 --protocol http2 > "%LOGFILE%" 2>&1

:: 等待隧道创建并提取链接
echo 正在获取公网链接...
set "URL="
for /L %%i in (1,1,30) do (
    if not defined URL (
        findstr /C:"trycloudflare.com" "%LOGFILE%" >nul 2>&1
        if not errorlevel 1 (
            for /f "tokens=6 delims=| " %%a in ('findstr /C:"trycloudflare.com" "%LOGFILE%"') do (
                set "URL=%%a"
            )
        )
        if not defined URL timeout /t 1 /nobreak >nul
    )
)

:: 清理链接中的空格
set "URL=%URL: =%"

echo.
echo ========================================
if defined URL (
    echo   启动成功！公网访问地址：
    echo.
    echo   %URL%
) else (
    echo   隧道创建超时，请查看日志：
    echo   %LOGFILE%
)
echo ========================================
echo.
echo   提示：不要关闭此窗口，关闭后服务停止
echo   按任意键退出...
echo.

pause >nul

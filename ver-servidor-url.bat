@echo off
chcp 65001 >nul
title Royal Casino - Consultar URL
for /f "tokens=*" %%i in ('wsl.exe -d Ubuntu -u root -- bash -c "grep -o 'https://[-a-zA-Z0-9@:%%._\+~#=]*\.trycloudflare\.com' /var/log/cloudflared.log | tail -n 1"') do set TUNNEL_URL=%%i
echo.
echo ========================================================
echo  URL ACTUAL DEL CASINO:
echo  %TUNNEL_URL%
echo.
echo  PANEL DE ADMINISTRACIÓN:
echo  %TUNNEL_URL%/admin
echo.
echo  Usuario: admin
echo  Clave:   RoyalAdmin2026!
echo ========================================================
echo.
pause

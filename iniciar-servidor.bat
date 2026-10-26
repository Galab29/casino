@echo off
chcp 65001 >nul
title Royal Casino - Servidor WSL
echo ========================================================
echo        ROYAL CASINO - SERVIDOR WSL Y TÚNEL ACTIVO
echo ========================================================
echo.
echo [1/3] Iniciando distribución WSL Ubuntu...
wsl.exe -d Ubuntu -u root -- systemctl start casino casino-tunnel

echo [2/3] Verificando estado de los servicios...
wsl.exe -d Ubuntu -u root -- systemctl is-active casino
wsl.exe -d Ubuntu -u root -- systemctl is-active casino-tunnel

echo.
echo [3/3] Obteniendo enlace público de acceso...
for /f "tokens=*" %%i in ('wsl.exe -d Ubuntu -u root -- bash -c "grep -o 'https://[-a-zA-Z0-9@:%%._\+~#=]*\.trycloudflare\.com' /var/log/cloudflared.log | tail -n 1"') do set TUNNEL_URL=%%i

echo.
echo ========================================================
echo  URL PÚBLICA DEL CASINO (INTERNET):
echo  %TUNNEL_URL%
echo.
echo  PANEL DE ADMINISTRACIÓN:
echo  %TUNNEL_URL%/admin
echo.
echo  CREDENCIALES:
echo  Usuario:    admin
echo  Contraseña: RoyalAdmin2026!
echo ========================================================
echo.
echo Este servidor corre de forma continua en WSL.
echo Siempre que el computador tenga internet, estará accesible.
echo.
pause

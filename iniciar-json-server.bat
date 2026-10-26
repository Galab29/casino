@echo off
chcp 65001 >nul
title Royal Casino - JSON Server
echo ========================================================
echo        ROYAL CASINO - JSON SERVER (PUERTO 4000)
echo ========================================================
echo.
echo Iniciando servidor JSON Server para la base de datos db.json...
echo URL Local: http://localhost:4000
echo.
echo Endpoints disponibles:
echo   - http://localhost:4000/users
echo   - http://localhost:4000/recharge_codes
echo   - http://localhost:4000/transactions
echo   - http://localhost:4000/game_stats
echo   - http://localhost:4000/user_preferences
echo   - http://localhost:4000/bets
echo.
echo Presiona Ctrl + C para detener el servidor.
echo ========================================================
echo.
npm run json-server
pause

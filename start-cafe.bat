@echo off
title CafeOS - Cafe Management System
color 0A

echo.
echo  =====================================================
echo      CafeOS - Cafe Management System
echo      Starting local server for in-cafe use...
echo  =====================================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo  [SETUP] Installing dependencies (first-time only)...
    npm install
    echo  [SETUP] Done! Starting server...
    echo.
)

:: Detect local IP address for sharing with kitchen TV / tablets
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo  -------------------------------------------------------
echo   BILLER (this PC):  http://localhost:5173/?portal=biller
echo   OWNER PANEL:        http://localhost:5173/?portal=owner
echo   KITCHEN SCREEN TV:  http://%LOCAL_IP%:5173/?portal=chef
echo   CUSTOMER (any QR):  http://%LOCAL_IP%:5173/?table=1
echo  -------------------------------------------------------
echo.
echo  [TIP] Open the Kitchen URL on the Android TV stick / tablet.
echo  [TIP] Print QR codes from the Biller portal to place on tables.
echo  [TIP] Internet is NOT needed for local use - WiFi only!
echo.

:: Open Biller portal in Chrome maximized
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173/?portal=biller --start-maximized

:: If Chrome not found at default path, try without kiosk
if errorlevel 1 (
    echo  [INFO] Chrome not found at default path. Opening default browser...
    start http://localhost:5173/?portal=biller
)

:: Start the Vite dev server (blocking - keep this window open)
echo  [SERVER] Starting Vite server on port 5173 (all interfaces)...
npx vite --host 0.0.0.0 --port 5173

@echo off
TITLE Bharatpur Bike and Car Rental
echo =========================================================
echo       BHARATPUR BIKE AND CAR RENTAL - SYSTEM
echo           "Drive More, Spend Less"
echo =========================================================
echo Starting Server...

cd /d "%~dp0"

IF NOT EXIST "node_modules" (
    echo Installing required packages...
    call npm install
)

start "" http://localhost:3000
echo Server is running on http://localhost:3000
echo Data is continuously synchronized.
node server.js
pause

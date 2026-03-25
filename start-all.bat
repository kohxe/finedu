@echo off
echo Starting FinEdu servers...

start "FinEdu Backend" cmd /k "cd /d "%~dp0backend" && py -3.11 -m pip install -r requirements.txt --user && py -3.11 -m uvicorn main:app --reload --port 8000"
timeout /t 3

start "FinEdu Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Servers started!
echo Frontend : http://localhost:7777
echo Backend  : http://localhost:8000
echo.
pause

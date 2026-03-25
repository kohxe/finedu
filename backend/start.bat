@echo off
echo Starting FinEdu Backend (port 8000)...
cd /d "%~dp0"

if not exist .env (
    copy .env.example .env
    echo .env file created. Please enter your API keys.
    pause
    exit
)

py -3.11 -m pip install -r requirements.txt --user
py -3.11 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause

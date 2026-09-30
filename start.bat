@echo off
REM Start Whisprtale: backend (port 3001) and frontend (port 3000) in separate windows
start "Whisprtale Backend (3001)" cmd /k "cd /d %~dp0back-end && node index.js"
start "Whisprtale Frontend (3000)" cmd /k "cd /d %~dp0front-end && npx --yes http-server -p 3000 -c-1"
timeout /t 3 /nobreak >nul
start "" http://localhost:3000/index.html

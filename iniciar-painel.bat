@echo off
cd /d "%~dp0"
start "" python -m http.server 4173
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:4173/

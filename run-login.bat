@echo off
cd /d "%~dp0"
if not exist logs mkdir logs
echo ===== %date% %time% ===== >> logs\login.log
call npx playwright test prod/auth-setup.spec.ts >> logs\login.log 2>&1
echo exit code: %errorlevel% >> logs\login.log

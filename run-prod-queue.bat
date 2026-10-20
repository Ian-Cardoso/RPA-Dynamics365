@echo off
cd /d "%~dp0"
if not exist logs mkdir logs
echo ===== %date% %time% ===== >> logs\prod-queue.log
call npx playwright test prod/route-queue-items.spec.ts >> logs\prod-queue.log 2>&1
echo exit code: %errorlevel% >> logs\prod-queue.log

@echo off
cd /d "%~dp0"
if not exist logs mkdir logs
echo ===== %date% %time% ===== >> logs\remover.log
call npx playwright test test/remover-itens-respondidos.spec.ts >> logs\remover.log 2>&1
echo exit code: %errorlevel% >> logs\remover.log

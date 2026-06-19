@echo off
REM Self by Saint - CLI Launcher
REM Executa a aplicacao com Node.js embutido

cd /d "%~dp0"
".\node\node.exe" dist/main.js
pause

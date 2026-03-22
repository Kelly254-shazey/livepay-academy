@echo off
setlocal
set JAVA_FINANCE_URL=http://localhost:8080
set PYTHON_INTELLIGENCE_URL=http://localhost:8000
cd /d "%~dp0"
node dist\src\server.js

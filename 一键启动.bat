@echo off
chcp 65001 >nul
title Privacy AI Helper -

echo.
echo ========================================
echo   Privacy AI Helper - Full Stack
echo ========================================
echo.

set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

:: === 1. Ollama ===
echo [1/3] Starting Ollama...
set OLLAMA_PATH=%LOCALAPPDATA%\Programs\Ollama\ollama.exe
if not exist "%OLLAMA_PATH%" (
    echo [WARNING] Ollama not found at %OLLAMA_PATH%
    echo           Please install from https://ollama.com
    goto :backend
)
start "Ollama Service" /MIN "%OLLAMA_PATH%" serve
echo        Waiting for Ollama to be ready...
set counter=0
:wait_ollama
timeout /t 2 /nobreak >nul
curl -s http://localhost:11434/api/tags >nul 2>&1
if not errorlevel 1 goto :ollama_ready
set /a counter+=1
if %counter% GTR 30 (
    echo [ERROR] Ollama  (60)
    echo         Ollama  Plan B
    goto :backend
)
goto wait_ollama

:ollama_ready
echo        Ollama is ready.

:: Check model
curl -s http://localhost:11434/api/tags 2>nul | findstr "qwen2.5:1.5b" >nul
if errorlevel 1 (
    echo        Pulling model qwen2.5:1.5b...
    "%OLLAMA_PATH%" pull qwen2.5:1.5b
)

:: === 2. Backend ===
:backend
echo.
echo [2/3] Starting Backend (port 3001)...
start "Backend - Privacy AI" cmd /k "cd /d %BASE_DIR%backend && echo Installing backend deps... && npm install && echo Starting backend... && node index.js"

:: Wait for backend
echo        Waiting for backend...
set counter=0
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if not errorlevel 1 goto :backend_ready
set /a counter+=1
if %counter% GTR 30 (
    echo [ERROR]  (60)
    pause && exit /b 1
)
goto wait_backend

:backend_ready
echo        Backend is ready.

:: === 3. Frontend ===
echo.
echo [3/3] Starting Frontend (port 5173)...
start "Frontend - Privacy AI" cmd /k "cd /d %BASE_DIR%frontend && echo Installing frontend deps... && npm install && echo Starting frontend... && npm run dev"

:: Wait for frontend
echo        Waiting for frontend...
set counter=0
:wait_frontend
timeout /t 2 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if not errorlevel 1 goto :frontend_ready
set /a counter+=1
if %counter% GTR 30 (
    echo [ERROR]  (60)
    pause && exit /b 1
)
goto wait_frontend

:frontend_ready

:: === Done ===
echo.
echo ========================================
echo   ALL SERVICES READY!
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:3001
echo   Ollama   : http://localhost:11434
echo ========================================
echo.
start http://localhost:5173
pause

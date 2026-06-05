@echo off
echo ========================================
echo FindMyJob - Starting Application
echo ========================================
echo.
echo This will start both backend and frontend servers.
echo.
echo Backend will run on: http://localhost:8080
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop the servers.
echo.
pause

echo Starting MongoDB Memory Server...
start "FindMyJob Local MongoDB" cmd /k "node local-mongo\start-mongo.js"

timeout /t 5 /nobreak >nul

echo Starting Backend Server...
start "FindMyJob Backend" cmd /k "cd backend && run.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "FindMyJob Frontend" cmd /k "cd frontend && run.bat"

echo.
echo MongoDB, Backend, and Frontend servers are starting in separate windows.
echo Please wait for them to fully start before accessing the application.
echo.
echo Once started, open your browser and go to: http://localhost:5173
echo.
pause

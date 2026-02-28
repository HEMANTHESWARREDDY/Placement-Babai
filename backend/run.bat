@echo off
echo ========================================
echo FindMyJob Backend Build Script
echo ========================================
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Maven found! Building with Maven...
    call mvn clean install -DskipTests
    if %ERRORLEVEL% EQU 0 (
        echo Build successful!
        echo Starting Spring Boot application...
        call mvn spring-boot:run
    ) else (
        echo Build failed!
        pause
    )
) else (
    echo Maven not found!
    echo.
    echo Please install Maven from: https://maven.apache.org/download.cgi
    echo.
    echo Alternative: Install Maven using Chocolatey
    echo   1. Install Chocolatey: https://chocolatey.org/install
    echo   2. Run: choco install maven -y
    echo.
    pause
)

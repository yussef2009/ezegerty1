@echo off
echo Starting Ezegerty Dev Server...
if not exist node_modules (
    echo node_modules not found. Installing dependencies first...
    call npm install
)
call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo Error: Failed to start the development server.
    pause
)

@echo off
echo 🚀 Starting InIt AI Development Environment...

REM Check if bun is installed
where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Bun is not installed. Please install Bun first: https://bun.sh/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Copying from .env.example...
    copy .env.example .env
    echo ✅ Please edit .env file with your API keys before continuing.
    echo    Most importantly, add your OpenAI API key and Supabase credentials.
    pause
    exit /b 1
)

echo 📡 Starting backend server...
start "Backend Server" cmd /k "bun run backend/server.ts"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo ✅ Backend should be running on http://localhost:3000
echo 🔍 API Health Check: http://localhost:3000/api/
echo 🔧 tRPC Endpoint: http://localhost:3000/api/trpc

echo.
echo 📱 Starting Expo development server...
start "Expo Dev Server" cmd /k "bun start"

echo.
echo 🎉 InIt AI is now running!
echo.
echo 📱 Mobile: Scan the QR code with Expo Go
echo 🌐 Web: Should open automatically in your browser
echo 🔧 Backend Test: Navigate to the Backend Test page in the app
echo.
echo Close the terminal windows to stop the servers
pause
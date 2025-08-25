#!/bin/bash

# InIt AI Development Startup Script
echo "🚀 Starting InIt AI Development Environment..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first: https://bun.sh/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your API keys before continuing."
    echo "   Most importantly, add your OpenAI API key and Supabase credentials."
    exit 1
fi

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "📡 Starting backend server..."
bun run backend/server.ts &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3000/api/ > /dev/null; then
    echo "❌ Backend failed to start. Check the logs above."
    exit 1
fi

echo "✅ Backend is running on http://localhost:3000"
echo "🔍 API Health Check: http://localhost:3000/api/"
echo "🔧 tRPC Endpoint: http://localhost:3000/api/trpc"

echo ""
echo "📱 Starting Expo development server..."
bun start &
FRONTEND_PID=$!

echo ""
echo "🎉 InIt AI is now running!"
echo ""
echo "📱 Mobile: Scan the QR code with Expo Go"
echo "🌐 Web: Should open automatically in your browser"
echo "🔧 Backend Test: Navigate to the Backend Test page in the app"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait
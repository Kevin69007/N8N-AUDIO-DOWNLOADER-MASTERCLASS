#!/bin/bash

# Function to handle shutdown signals
cleanup() {
    echo "Received shutdown signal, stopping services..."
    kill -TERM $NODE_PID $PYTHON_PID 2>/dev/null
    wait $NODE_PID $PYTHON_PID
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

# Start Node.js service in background
node index.js &
NODE_PID=$!

# Start Python Flask service in background
python3 ytdlp_service.py &
PYTHON_PID=$!

# Log PIDs for debugging
echo "Node.js service started with PID: $NODE_PID"
echo "Python Flask service started with PID: $PYTHON_PID"

# Wait for all background processes
wait $NODE_PID $PYTHON_PID


#!/bin/bash

# Simplified startup script for Universal Audio Downloader
# This script is optional - Docker can run 'node index.js' directly

echo "Starting Universal Audio Downloader..."
echo "Port: ${PORT:-3000}"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "ERROR: yt-dlp is not installed"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "WARNING: ffmpeg is not installed (required for audio chunking)"
fi

# Start the Node.js application
exec node index.js


# Vimeo Audio Downloader

A multi-service API that downloads audio from Vimeo videos using yt-dlp.

## Features

- Download audio from Vimeo URLs (Node.js service)
- Converts to MP3 format
- Extract video information without downloading (Python Flask service)
- RESTful API endpoints
- Health check endpoint

## API Endpoints

### POST /download-audio
Downloads audio from a Vimeo URL.

**Request Body:**
```json
{
  "vimeoUrl": "https://vimeo.com/...",
  "videoId": "unique-identifier"
}
```

**Response:**
Returns the MP3 file as a download.

### GET /health
Health check endpoint (Node.js service).

**Response:**
```json
{
  "status": "ok"
}
```

## Python Flask Service (Port 5001)

### POST /download
Extracts video information without downloading.

**Request Body:**
```json
{
  "url": "https://vimeo.com/...",
  "cookies": "optional_cookie_string"
}
```

**Response:**
```json
{
  "success": true,
  "title": "Video Title",
  "duration": 3600,
  "audioUrl": "https://...",
  "format": "format_info"
}
```

## Local Development

### Node.js Service

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3000 (or the PORT environment variable if set).

### Python Flask Service

1. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

2. Start the Flask service:
```bash
python3 ytdlp_service.py
```

The Flask service will run on port 5001.

### Running Both Services

Use the startup script:
```bash
chmod +x start.sh
./start.sh
```

## Railway Deployment

This project is ready to deploy on Railway:

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Create a new project on Railway
3. Connect your repository
4. Railway will automatically detect the Dockerfile and deploy

The Dockerfile includes all necessary dependencies:
- Node.js 18
- Python 3 (for yt-dlp and Flask)
- yt-dlp
- Flask
- ffmpeg

The container runs both services automatically:
- Node.js service on port 3000
- Python Flask service on port 5001

### Railway Configuration Notes

- Railway will automatically expose both ports (3000 and 5001) from the Dockerfile
- Both services start automatically when the container starts
- Health checks available:
  - Node.js: `GET /health` (port 3000)
  - Flask: `GET /health` (port 5001)

### Using Railway CLI

Alternatively, you can deploy using Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Environment Variables

- `PORT` - The port the server will listen on (default: 3000)

## Requirements

- Node.js 18+
- Python 3
- yt-dlp
- Flask (Python)
- ffmpeg

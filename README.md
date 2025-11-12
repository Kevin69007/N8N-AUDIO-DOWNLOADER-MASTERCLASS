# Universal Audio Downloader API

A powerful, universal audio downloader API powered by yt-dlp. Download audio from 1000+ platforms including YouTube, Vimeo, SoundCloud, TikTok, and many more.

## Features

- **Universal Support**: Works with YouTube, Vimeo, SoundCloud, Twitter/X, Facebook, Instagram, TikTok, and 1000+ more sites
- **Audio Extraction**: Automatically extracts and converts to MP3 (or other formats)
- **Quality Options**: Choose from best, good, or medium quality
- **Audio Chunking**: Extract specific time ranges from audio
- **RESTful API**: Simple JSON-based API
- **Docker Ready**: Fully containerized for easy deployment
- **Railway Compatible**: Optimized for Railway deployment

## API Endpoints

### GET /

Get API information and supported platforms.

**Response:**
```json
{
  "service": "Universal Audio Downloader API",
  "version": "3.0.0",
  "supportedPlatforms": ["YouTube", "Vimeo", "SoundCloud", "..."],
  "endpoints": { ... }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dependencies": {
    "ytdlp": "2024.01.01",
    "tmpDir": "accessible"
  }
}
```

### POST /download-audio

Download audio from any supported URL.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "format": "mp3",
  "quality": "best",
  "startTime": 10,
  "endTime": 60
}
```

**Parameters:**
- `url` (required): URL of the video/audio to download
- `format` (optional): Audio format - default: `mp3`
- `quality` (optional): Audio quality - `best`, `good`, or `medium` - default: `best`
- `startTime` (optional): Start time in seconds for audio chunk
- `endTime` (optional): End time in seconds for audio chunk

**Response:**
Returns the audio file as a download.

**Example with curl:**
```bash
curl -X POST https://your-app.railway.app/download-audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  -o audio.mp3
```

### POST /get-info

Get video/audio information without downloading.

**Request Body:**
```json
{
  "url": "https://vimeo.com/..."
}
```

**Response:**
```json
{
  "success": true,
  "title": "Video Title",
  "duration": 300,
  "thumbnail": "https://...",
  "uploader": "Channel Name",
  "uploadDate": "20240101",
  "description": "Video description...",
  "formats": 15,
  "extractor": "youtube",
  "webpage_url": "https://..."
}
```

## Supported Platforms

This API uses yt-dlp which supports 1000+ platforms including:

- **Video**: YouTube, Vimeo, Dailymotion, Twitch
- **Social**: Twitter/X, Facebook, Instagram, TikTok, Reddit
- **Audio**: SoundCloud, Bandcamp, Spotify (if available)
- **Education**: Coursera, Udemy, Khan Academy
- **News**: CNN, BBC, France TV
- And many more...

[Full list of supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

## Local Development

### Prerequisites

- Node.js 18+
- Python 3
- yt-dlp
- ffmpeg (optional, for audio chunking)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd N8N-AUDIO-DOWNLOADER-MASTERCLASS
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install yt-dlp:
```bash
# macOS (Homebrew)
brew install yt-dlp

# Ubuntu/Debian
sudo apt install yt-dlp

# pip
pip3 install yt-dlp
```

4. Install ffmpeg (optional, for chunking):
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

### Running Locally

```bash
npm start
```

The server will start on port 3000 (or the PORT environment variable if set).

Visit http://localhost:3000 to see the API information.

## Docker Deployment

### Build and Run

```bash
# Build the image
docker build -t audio-downloader .

# Run the container
docker run -p 3000:3000 audio-downloader
```

### Docker Compose

```yaml
version: '3.8'
services:
  audio-downloader:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    restart: unless-stopped
```

## Railway Deployment

This application is optimized for Railway deployment:

### Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Manual Deployment

1. **Create a new project on Railway**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Connect your GitHub repository

2. **Railway will automatically:**
   - Detect the Dockerfile
   - Build the container
   - Deploy the application
   - Assign a public URL

3. **Your API will be available at:**
   ```
   https://your-app-name.up.railway.app
   ```

4. **Test the deployment:**
   ```bash
   curl https://your-app-name.up.railway.app/health
   ```

### Railway Configuration

Railway automatically handles:
- Port assignment (via PORT environment variable)
- HTTPS certificates
- Container orchestration
- Health checks
- Automatic restarts

**No additional configuration needed!**

### Environment Variables (Optional)

You can set these in Railway's dashboard:

- `PORT`: The port to run on (Railway sets this automatically)

## Usage Examples

### Download YouTube video as MP3

```bash
curl -X POST https://your-app.railway.app/download-audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  -o audio.mp3
```

### Download with quality selection

```bash
curl -X POST https://your-app.railway.app/download-audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://vimeo.com/123456", "quality": "good"}' \
  -o audio.mp3
```

### Extract audio chunk (10s to 60s)

```bash
curl -X POST https://your-app.railway.app/download-audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=...", "startTime": 10, "endTime": 60}' \
  -o chunk.mp3
```

### Get video information

```bash
curl -X POST https://your-app.railway.app/get-info \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=..."}'
```

### Use with n8n Workflow

In n8n, use the HTTP Request node:

1. **Method**: POST
2. **URL**: `https://your-app.railway.app/download-audio`
3. **Body**: JSON
   ```json
   {
     "url": "{{$json.videoUrl}}",
     "quality": "best"
   }
   ```
4. **Response Format**: File

## Troubleshooting

### yt-dlp not found
Ensure yt-dlp is installed:
```bash
yt-dlp --version
```

### Downloads failing
Try updating yt-dlp to the latest version:
```bash
pip3 install --upgrade yt-dlp
```

### Railway deployment not working
1. Check Railway logs in the dashboard
2. Verify the Dockerfile builds successfully
3. Test the /health endpoint first

### Audio chunking not working
Ensure ffmpeg is installed:
```bash
ffmpeg -version
```

## Architecture

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Downloader**: yt-dlp (Python)
- **Audio Processing**: FFmpeg
- **Container**: Docker (node:18-slim base)

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Support

If you encounter any issues, please open an issue on GitHub with:
- The URL you're trying to download
- Error messages from the logs
- Your deployment environment (Railway, Docker, local, etc.)

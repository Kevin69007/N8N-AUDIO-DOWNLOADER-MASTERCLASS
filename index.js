const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();

app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    service: 'Universal Audio Downloader API',
    version: '3.0.0',
    description: 'Download audio from various platforms using yt-dlp',
    supportedPlatforms: [
      'YouTube',
      'Vimeo',
      'SoundCloud',
      'Twitter/X',
      'Facebook',
      'Instagram',
      'TikTok',
      'and 1000+ more sites'
    ],
    endpoints: {
      'GET /': 'API information',
      'GET /health': 'Health check',
      'POST /download-audio': 'Download audio from any supported URL',
      'POST /get-info': 'Get video/audio information without downloading'
    },
    examples: {
      downloadAudio: {
        url: '/download-audio',
        method: 'POST',
        body: {
          url: 'https://www.youtube.com/watch?v=...',
          format: 'mp3',
          quality: 'best'
        }
      },
      getInfo: {
        url: '/get-info',
        method: 'POST',
        body: {
          url: 'https://vimeo.com/...'
        }
      }
    }
  });
});

// Helper to sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Helper to check if yt-dlp is installed
async function checkYtDlp() {
  try {
    const { stdout } = await execAsync('yt-dlp --version');
    return { installed: true, version: stdout.trim() };
  } catch (error) {
    return { installed: false, error: error.message };
  }
}

// POST /download-audio - Universal audio downloader
app.post('/download-audio', async (req, res) => {
  const { url, format = 'mp3', quality = 'best', startTime, endTime } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'Missing URL parameter',
      usage: {
        url: 'Required - URL of the video/audio to download',
        format: 'Optional - Audio format (default: mp3)',
        quality: 'Optional - Audio quality: best, good, medium (default: best)',
        startTime: 'Optional - Start time in seconds for audio chunk',
        endTime: 'Optional - End time in seconds for audio chunk'
      }
    });
  }

  console.log(`[${new Date().toISOString()}] Download request: ${url}`);

  const timestamp = Date.now();
  const tempId = `audio_${timestamp}`;
  const outputPath = `/tmp/${tempId}.${format}`;

  try {
    // Determine quality settings
    let qualityOption = '0'; // best
    if (quality === 'good') qualityOption = '5';
    if (quality === 'medium') qualityOption = '9';

    // Build yt-dlp command
    const ytDlpArgs = [
      '--no-check-certificate',
      '--no-warnings',
      '--no-playlist',
      '--retries', '3',
      '--fragment-retries', '3',
      '-x', // Extract audio
      '--audio-format', format,
      '--audio-quality', qualityOption,
      '-o', outputPath,
      url
    ];

    console.log(`Executing: yt-dlp ${ytDlpArgs.join(' ')}`);

    // Execute yt-dlp
    await new Promise((resolve, reject) => {
      const ytDlp = spawn('yt-dlp', ytDlpArgs, {
        timeout: 300000 // 5 minutes
      });

      let stdout = '';
      let stderr = '';

      ytDlp.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      ytDlp.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      ytDlp.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`yt-dlp exited with code ${code}\nStderr: ${stderr}`));
        }
      });

      ytDlp.on('error', (error) => {
        reject(error);
      });
    });

    // Verify file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('Audio file was not created');
    }

    const fileSize = fs.statSync(outputPath).size;
    if (fileSize === 0) {
      fs.unlinkSync(outputPath);
      throw new Error('Audio file is empty');
    }

    console.log(`Download successful: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    // Handle audio chunking if requested
    if (startTime !== undefined && endTime !== undefined) {
      const chunkPath = `/tmp/chunk_${timestamp}.${format}`;
      const duration = endTime - startTime;

      console.log(`Creating chunk: ${startTime}s to ${endTime}s (duration: ${duration}s)`);

      await new Promise((resolve, reject) => {
        const ffmpegArgs = [
          '-ss', startTime.toString(),
          '-i', outputPath,
          '-t', duration.toString(),
          '-c:a', 'libmp3lame',
          '-b:a', '128k',
          '-ar', '44100',
          '-y',
          chunkPath
        ];

        const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
          timeout: 60000 // 1 minute
        });

        ffmpeg.on('close', (code) => {
          // Clean up full audio
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }

          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });

        ffmpeg.on('error', (error) => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
          reject(error);
        });
      });

      // Send chunk
      res.download(chunkPath, `chunk_${startTime}_${endTime}.${format}`, (err) => {
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
        if (err) {
          console.error('Download error:', err);
        } else {
          console.log('Chunk sent successfully');
        }
      });

    } else {
      // Send full audio
      res.download(outputPath, `audio_${timestamp}.${format}`, (err) => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        if (err) {
          console.error('Download error:', err);
        } else {
          console.log('Audio sent successfully');
        }
      });
    }

  } catch (error) {
    console.error('Download failed:', error);

    // Clean up any files
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    res.status(500).json({
      error: 'Failed to download audio',
      details: error.message,
      url: url
    });
  }
});

// POST /get-info - Get video/audio information without downloading
app.post('/get-info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'Missing URL parameter',
      usage: {
        url: 'Required - URL of the video/audio to get information about'
      }
    });
  }

  console.log(`[${new Date().toISOString()}] Info request: ${url}`);

  try {
    // Get info with yt-dlp
    const command = `yt-dlp --dump-json --no-warnings "${url}"`;
    const { stdout } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000
    });

    const info = JSON.parse(stdout);

    res.json({
      success: true,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader,
      uploadDate: info.upload_date,
      description: info.description,
      formats: info.formats?.length || 0,
      extractor: info.extractor,
      webpage_url: info.webpage_url
    });

  } catch (error) {
    console.error('Failed to get info:', error);
    res.status(500).json({
      error: 'Failed to get video information',
      details: error.message,
      url: url
    });
  }
});

app.get('/health', async (req, res) => {
  const ytdlpCheck = await checkYtDlp();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Universal Audio Downloader',
    version: '3.0.0',
    dependencies: {
      ytdlp: ytdlpCheck.installed ? ytdlpCheck.version : 'not installed',
      tmpDir: fs.existsSync('/tmp') ? 'accessible' : 'not accessible'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log(`Universal Audio Downloader API v3.0.0`);
  console.log(`Server running on port ${PORT}`);
  console.log('='.repeat(60));

  // Check dependencies
  const ytdlpCheck = await checkYtDlp();
  console.log(`yt-dlp: ${ytdlpCheck.installed ? '✓ ' + ytdlpCheck.version : '✗ NOT INSTALLED'}`);
  console.log(`/tmp directory: ${fs.existsSync('/tmp') ? '✓ accessible' : '✗ NOT accessible'}`);

  console.log('\nEndpoints:');
  console.log(`  GET  / - API information`);
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /download-audio - Download audio`);
  console.log(`  POST /get-info - Get video info`);
  console.log('='.repeat(60));
});
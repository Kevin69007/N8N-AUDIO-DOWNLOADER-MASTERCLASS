from flask import Flask, request, jsonify
import yt_dlp
import subprocess
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "ytdlp-service"
    }), 200

@app.route('/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    cookies = data.get('cookies', '')
    
    if not url:
        return jsonify({"error": "Missing URL"}), 400
    
    try:
        # Extract info only (no download)
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        # Add cookies if provided
        if cookies:
            # Write cookies to temp file
            cookie_file = '/tmp/cookies.txt'
            with open(cookie_file, 'w') as f:
                f.write("# Netscape HTTP Cookie File\n")
                for cookie in cookies.split('; '):
                    if '=' in cookie:
                        name, value = cookie.split('=', 1)
                        f.write(f".masterclass.com\tTRUE\t/\tTRUE\t0\t{name}\t{value}\n")
            
            ydl_opts['cookiefile'] = cookie_file
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get direct audio URL
            formats = info.get('formats', [])
            audio_url = None
            
            for fmt in formats:
                if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                    audio_url = fmt.get('url')
                    break
            
            if not audio_url and formats:
                audio_url = formats[0].get('url')
            
            return jsonify({
                "success": True,
                "title": info.get('title'),
                "duration": info.get('duration'),
                "audioUrl": audio_url,
                "format": info.get('format')
            })
    
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)


FROM node:18-slim

# Install system dependencies: yt-dlp, ffmpeg, and Python
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    wget && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp using the recommended method
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Verify installations
RUN yt-dlp --version && \
    ffmpeg -version && \
    node --version

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
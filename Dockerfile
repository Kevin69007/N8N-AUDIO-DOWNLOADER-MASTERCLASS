FROM node:18-slim

# Install system dependencies: yt-dlp, ffmpeg, and Python
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY index.js ./

# Verify yt-dlp installation
RUN yt-dlp --version

# Railway will provide PORT environment variable
# Default to 3000 if not set
ENV PORT=3000

# Expose the port (Railway will use the PORT env var)
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the application
CMD ["node", "index.js"]
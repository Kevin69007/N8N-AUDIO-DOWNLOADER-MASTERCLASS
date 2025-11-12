FROM node:18-slim

# Install yt-dlp, ffmpeg, and Python dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install --break-system-packages yt-dlp && \
    apt-get clean

WORKDIR /app
COPY package*.json ./
RUN npm install

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --break-system-packages -r requirements.txt

COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

EXPOSE 3000 5001
CMD ["/app/start.sh"]
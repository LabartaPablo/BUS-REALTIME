# Build stage
FROM node:20-slim AS builder

# Install dependencies for better-sqlite3 and wget/unzip
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Download GTFS Static data and build database
RUN echo "Downloading GTFS Static data..." && \
    mkdir -p data database && \
    wget -O data/gtfs_static.zip "https://www.transportforireland.ie/transitData/Data/GTFS_All.zip" && \
    unzip -o data/gtfs_static.zip "routes.txt" "stops.txt" -d data/ && \
    echo "Building SQLite database..." && \
    node scripts/initDatabase.js && \
    echo "Database built successfully" && \
    ls -lh database/

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --from=builder /app/*.js ./
COPY --from=builder /app/services ./services
COPY --from=builder /app/database ./database
COPY --from=builder /app/data/routes.txt ./data/routes.txt
COPY --from=builder /app/data/stops.txt ./data/stops.txt
COPY --from=builder /app/data/agency.txt ./data/agency.txt

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:3001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1));"

# Start server
CMD ["npm", "start"]

# Backend services Dockerfile for Railway deployment
FROM ubuntu:24.04

# Install required dependencies
RUN apt-get update && apt-get install -y \
    openjdk-21-jdk \
    maven \
    nodejs \
    npm \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY . .

# Build Java service (optional, can be skipped for Node.js/Python only)
RUN if [ "$SERVICE_TYPE" = "java" ] || [ "$SERVICE_TYPE" = "" ]; then \
      cd java-service && mvn clean package -DskipTests -q; \
    fi

# Setup Node.js service
RUN if [ "$SERVICE_TYPE" = "nodejs" ] || [ "$SERVICE_TYPE" = "" ]; then \
      cd nodejs-service && npm ci && npm run build && npx prisma generate; \
    fi

# Setup Python service
RUN if [ "$SERVICE_TYPE" = "python" ] || [ "$SERVICE_TYPE" = "" ]; then \
      cd python-service && pip install --no-cache-dir -e .; \
    fi

# Make run script executable
RUN chmod +x ./run-services.sh

# Railway will assign PORT automatically
EXPOSE 3000 8000 8080

# Start the appropriate service
CMD ["./run-services.sh"]

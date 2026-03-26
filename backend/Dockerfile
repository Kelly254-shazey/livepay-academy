# Backend services Dockerfile for Railway deployment
FROM ubuntu:24.04

# Railway variables are only available to Docker builds when declared as ARG.
# Default this image to the public Node.js API service.
ARG SERVICE_TYPE=nodejs

# Install required dependencies
RUN apt-get update && apt-get install -y \
    openjdk-21-jdk \
    maven \
    nodejs \
    npm \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app

# Copy backend files
COPY . .

# Build only the selected service for this image.
RUN if [ "$SERVICE_TYPE" = "java" ]; then \
      cd java-service && mvn clean package -DskipTests -q; \
    fi

# Setup Node.js service
RUN if [ "$SERVICE_TYPE" = "nodejs" ]; then \
      cd nodejs-service && npm ci && npm run build && npx prisma generate; \
    fi

# Setup Python service
RUN if [ "$SERVICE_TYPE" = "python" ]; then \
      cd python-service && python -m pip install --no-cache-dir -e .; \
    fi

# Make run script executable
RUN chmod +x ./run-services.sh

# Railway will assign PORT automatically
EXPOSE 3000 8000 8080

# Start the appropriate service
CMD ["./run-services.sh"]

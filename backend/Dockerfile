FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PRISMA_SKIP_POSTINSTALL_GENERATE=true \
    SERVER_PORT=8080 \
    PYTHON_SERVICE_PORT=8000 \
    JAVA_FINANCE_URL=http://127.0.0.1:8080 \
    PYTHON_INTELLIGENCE_URL=http://127.0.0.1:8000

RUN apt-get update \
    && apt-get install -y ca-certificates curl gnupg build-essential \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y \
      openjdk-21-jdk \
      maven \
      nodejs \
      python3.12 \
      python3.12-venv \
      python3-pip \
    && ln -sf /usr/bin/python3.12 /usr/bin/python3 \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install --no-cache-dir --upgrade pip \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app

COPY . .

RUN cd /app/java-service && mvn -q -DskipTests package

RUN cd /app/nodejs-service \
    && npm ci \
    && npm run build \
    && DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/livegate_nodejs" npx prisma generate \
    && npm prune --omit=dev

RUN cd /app/python-service && python -m pip install --no-cache-dir .

RUN chmod +x /app/run-services.sh /app/start.sh

EXPOSE 3000 8000 8080

CMD ["/app/run-services.sh"]

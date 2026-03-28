#!/bin/bash

set -euo pipefail

echo "Starting LiveGate Backend Services on Railway"
echo "=============================================="

PORT=${PORT:-3000}
SERVER_PORT=${SERVER_PORT:-8080}
PYTHON_SERVICE_PORT=${PYTHON_SERVICE_PORT:-8000}
SERVICE_TYPE=${SERVICE_TYPE:-all}

export NODE_ENV=${NODE_ENV:-production}
export PORT
export SERVER_PORT
export JAVA_FINANCE_URL=${JAVA_FINANCE_URL:-http://127.0.0.1:${SERVER_PORT}}
export PYTHON_INTELLIGENCE_URL=${PYTHON_INTELLIGENCE_URL:-http://127.0.0.1:${PYTHON_SERVICE_PORT}}
export PYTHON_DATABASE_URL=${PYTHON_DATABASE_URL:-}
export PYTHON_SOURCE_DATABASE_URL=${PYTHON_SOURCE_DATABASE_URL:-}

generate_secret() {
  python3 -c 'import secrets; print(secrets.token_urlsafe(36)[:48])'
}

parse_database_url() {
  local raw_url="${1:-}"

  if [ -z "${raw_url}" ]; then
    return 1
  fi

  python3 -c 'from urllib.parse import urlparse; import sys; u = urlparse(sys.argv[1]); print(u.hostname or ""); print(u.port or 3306); print(u.username or ""); print(u.password or ""); print((u.path or "").lstrip("/").split("?", 1)[0]);' "${raw_url}"
}

derive_database_name() {
  local base_name="${1:-}"
  local target_suffix="$2"

  if [ -z "${base_name}" ]; then
    echo "livegate_${target_suffix}"
    return 0
  fi

  case "${base_name}" in
    *_nodejs|*_java|*_python)
      echo "${base_name%_*}_${target_suffix}"
      ;;
    *)
      echo "${base_name}_${target_suffix}"
      ;;
  esac
}

normalize_runtime_env() {
  local mysql_host="${MYSQLHOST:-${MYSQL_HOST:-}}"
  local mysql_port="${MYSQLPORT:-${MYSQL_PORT:-3306}}"
  local mysql_user="${MYSQLUSER:-${MYSQL_USER:-}}"
  local mysql_password="${MYSQLPASSWORD:-${MYSQL_PASSWORD:-}}"
  local mysql_database="${MYSQLDATABASE:-${MYSQL_DATABASE:-}}"
  local database_url_source="${DATABASE_URL:-${DATABASE_PUBLIC_URL:-${MYSQL_URL:-}}}"
  local node_database_name="${NODE_DATABASE_NAME:-${mysql_database:-}}"
  local java_database_name=""
  local python_database_name=""
  local parsed_parts=()

  if [ -z "${DATABASE_URL:-}" ] && [ -n "${database_url_source}" ]; then
    export DATABASE_URL="${database_url_source}"
  fi

  if [ -z "${mysql_host}" ] && [ -n "${DATABASE_URL:-}" ]; then
    mapfile -t parsed_parts < <(parse_database_url "${DATABASE_URL}") || true
    if [ "${#parsed_parts[@]}" -ge 5 ]; then
      mysql_host="${parsed_parts[0]}"
      mysql_port="${parsed_parts[1]}"
      mysql_user="${parsed_parts[2]}"
      mysql_password="${parsed_parts[3]}"
      mysql_database="${parsed_parts[4]}"
      if [ -z "${node_database_name}" ] && [ -n "${mysql_database}" ]; then
        node_database_name="${mysql_database}"
      fi
    fi
  fi

  # Apply local development defaults only outside production. On Railway,
  # missing database configuration must not silently fall back to localhost.
  if [ "${NODE_ENV:-}" != "production" ]; then
    mysql_host="${mysql_host:-127.0.0.1}"
    mysql_user="${mysql_user:-root}"
    node_database_name="${node_database_name:-livegate_nodejs}"
  fi

  if [ -z "${DATABASE_URL:-}" ] && [ -n "${mysql_host}" ] && [ -n "${mysql_user}" ] && [ -n "${node_database_name}" ]; then
    local auth_part="${mysql_user}"
    [ -n "${mysql_password}" ] && auth_part="${auth_part}:${mysql_password}"
    export DATABASE_URL="mysql://${auth_part}@${mysql_host}:${mysql_port}/${node_database_name}"
    echo "Configured DATABASE_URL to point to host: ${mysql_host}"
  fi

  java_database_name="$(derive_database_name "${node_database_name}" "java")"
  python_database_name="$(derive_database_name "${node_database_name}" "python")"

  if [ -z "${SPRING_DATASOURCE_URL:-}" ] && [ -n "${mysql_host}" ] && [ -n "${java_database_name}" ]; then
    export SPRING_DATASOURCE_URL="jdbc:mysql://${mysql_host}:${mysql_port}/${JAVA_DATABASE_NAME:-${java_database_name}}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
  fi

  if [ -z "${SPRING_DATASOURCE_USERNAME:-}" ] && [ -n "${mysql_user}" ]; then
    export SPRING_DATASOURCE_USERNAME="${mysql_user}"
  fi

  if [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ] && [ -n "${mysql_password}" ]; then
    export SPRING_DATASOURCE_PASSWORD="${mysql_password}"
  fi

  if [ -z "${PYTHON_DATABASE_URL:-}" ] && [ -n "${mysql_host}" ] && [ -n "${mysql_user}" ] && [ -n "${mysql_password}" ] && [ -n "${python_database_name}" ]; then
    export PYTHON_DATABASE_URL="mysql+aiomysql://${mysql_user}:${mysql_password}@${mysql_host}:${mysql_port}/${PYTHON_DATABASE_NAME:-${python_database_name}}"
  fi

  if [ -z "${PYTHON_SOURCE_DATABASE_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
    export PYTHON_SOURCE_DATABASE_URL="$(printf '%s' "${DATABASE_URL}" | sed 's#^mysql://#mysql+aiomysql://#')"
  fi

  if [ -z "${JWT_SECRET:-}" ] && [ "${NODE_ENV:-}" != "production" ]; then
    export JWT_SECRET="dev-secret-keep-it-secret-keep-it-safe"
    echo "Using default JWT_SECRET for development"
  fi

  if [ -z "${JWT_ACCESS_SECRET:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
    export JWT_ACCESS_SECRET="${JWT_SECRET}"
  fi

  if [ -z "${JWT_REFRESH_SECRET:-}" ] && [ -n "${JWT_SECRET:-}" ]; then
    export JWT_REFRESH_SECRET="${JWT_SECRET}-refresh"
  fi

  if [ -z "${JWT_ACCESS_SECRET:-}" ] && [ -n "${JWT_REFRESH_SECRET:-}" ]; then
    export JWT_ACCESS_SECRET="${JWT_REFRESH_SECRET}-access"
  fi

  if [ -z "${JWT_REFRESH_SECRET:-}" ] && [ -n "${JWT_ACCESS_SECRET:-}" ]; then
    export JWT_REFRESH_SECRET="${JWT_ACCESS_SECRET}-refresh"
  fi

  if [ -z "${INTERNAL_API_KEY:-}" ]; then
    export INTERNAL_API_KEY="$(generate_secret)"
    echo "Generated INTERNAL_API_KEY for this deployment"
  fi
}

validate_node_runtime_env() {
  local missing=()

  [ -n "${DATABASE_URL:-}" ] || missing+=("DATABASE_URL")
  [ -n "${JWT_ACCESS_SECRET:-}" ] || missing+=("JWT_ACCESS_SECRET")
  [ -n "${JWT_REFRESH_SECRET:-}" ] || missing+=("JWT_REFRESH_SECRET")
  [ -n "${INTERNAL_API_KEY:-}" ] || missing+=("INTERNAL_API_KEY")

  if [ "${#missing[@]}" -gt 0 ]; then
    echo "Node.js service configuration is incomplete."
    echo "Missing required environment variables:"
    for var_name in "${missing[@]}"; do
      echo "  - ${var_name}"
    done
    return 1
  fi

  return 0
}

normalize_runtime_env

PIDS=()
LAST_STARTED_PID=""
PRIMARY_PID=""
PYTHON_STARTED=0

cleanup() {
  local exit_code=${1:-0}

  trap - EXIT INT TERM

  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done

  wait || true
  exit "$exit_code"
}

trap 'cleanup $?' EXIT INT TERM

wait_for_port() {
  local name="$1"
  local port="$2"
  local attempts="${3:-30}"

  while [ "$attempts" -gt 0 ]; do
    if (echo >"/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1; then
      echo "${name} is accepting connections on port ${port}"
      return 0
    fi

    attempts=$((attempts - 1))
    sleep 1
  done

  echo "${name} did not open port ${port} in time"
  return 1
}

start_java() {
  if [ -z "${SPRING_DATASOURCE_URL:-}" ] || [ -z "${SPRING_DATASOURCE_USERNAME:-}" ] || [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
    echo "Skipping Java service because datasource configuration is incomplete"
    LAST_STARTED_PID=""
    return 0
  fi

  echo "Starting Java service on port ${SERVER_PORT}..."
  (
    cd /app/java-service
    exec java -Dserver.port="${SERVER_PORT}" -Dserver.address=127.0.0.1 -jar target/java-service-1.0.0.jar
  ) &
  LAST_STARTED_PID=$!
  PIDS+=($LAST_STARTED_PID)
}

start_python() {
  if [ -z "${PYTHON_DATABASE_URL}" ]; then
    echo "Skipping Python service because PYTHON_DATABASE_URL is not set"
    LAST_STARTED_PID=""
    return 0
  fi

  if [ -z "${PYTHON_SOURCE_DATABASE_URL}" ] && [ -n "${DATABASE_URL:-}" ]; then
    PYTHON_SOURCE_DATABASE_URL=$(printf '%s' "${DATABASE_URL}" | sed 's#^mysql://#mysql+aiomysql://#')
  fi

  if [ -z "${PYTHON_SOURCE_DATABASE_URL}" ]; then
    echo "Skipping Python service because PYTHON_SOURCE_DATABASE_URL is not set"
    LAST_STARTED_PID=""
    return 0
  fi

  echo "Starting Python service on port ${PYTHON_SERVICE_PORT}..."
  (
    cd /app/python-service
    export PORT="${PYTHON_SERVICE_PORT}"
    export DATABASE_URL="${PYTHON_DATABASE_URL}"
    export SOURCE_DATABASE_URL="${PYTHON_SOURCE_DATABASE_URL}"
    exec python -m uvicorn app.main:app --host 127.0.0.1 --port "${PYTHON_SERVICE_PORT}"
  ) &
  LAST_STARTED_PID=$!
  PYTHON_STARTED=1
  PIDS+=($LAST_STARTED_PID)
}

start_node() {
  validate_node_runtime_env
  echo "Starting Node.js service on port ${PORT}..."
  (
    cd /app/nodejs-service
    exec npm run start
  ) &
  LAST_STARTED_PID=$!
  PIDS+=($LAST_STARTED_PID)
}

case "$SERVICE_TYPE" in
  "all")
    start_java
    start_python
    wait_for_port "Java service" "${SERVER_PORT}" || true
    if [ "${PYTHON_STARTED}" -eq 1 ]; then
      wait_for_port "Python service" "${PYTHON_SERVICE_PORT}" || true
    fi
    start_node
    PRIMARY_PID="${LAST_STARTED_PID}"
    ;;
  "java")
    start_java
    PRIMARY_PID="${LAST_STARTED_PID}"
    ;;
  "python")
    start_python
    PRIMARY_PID="${LAST_STARTED_PID}"
    ;;
  "nodejs")
    start_node
    PRIMARY_PID="${LAST_STARTED_PID}"
    ;;
  *)
    echo "Unknown SERVICE_TYPE: ${SERVICE_TYPE}"
    exit 1
    ;;
esac

if [ -z "${PRIMARY_PID}" ] && [ "${#PIDS[@]}" -eq 0 ]; then
  echo "No backend services were started. Check Railway environment configuration."
  exit 1
fi

if [ -n "${PRIMARY_PID}" ]; then
  wait "${PRIMARY_PID}"
else
  wait -n
fi

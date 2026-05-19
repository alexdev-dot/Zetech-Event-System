#!/bin/sh
# Start MySQL if not already running
MYSQL_SOCK="/tmp/mysql/run/mysql.sock"
MYSQL_DATA="/tmp/mysql/data"
MYSQL_RUN="/tmp/mysql/run"
MYSQL_LOGS="/tmp/mysql/logs"

mkdir -p "$MYSQL_DATA" "$MYSQL_RUN" "$MYSQL_LOGS"

if ! mysqladmin --socket="$MYSQL_SOCK" ping --silent 2>/dev/null; then
  echo "[start.sh] Initializing MySQL data directory..."
  if [ ! -f "$MYSQL_DATA/ibdata1" ]; then
    mysqld --initialize-insecure --datadir="$MYSQL_DATA" --user=runner 2>/dev/null
  fi

  echo "[start.sh] Starting MySQL..."
  rm -f "$MYSQL_SOCK" "$MYSQL_SOCK.lock" "$MYSQL_RUN/mysql.pid"
  mysqld --datadir="$MYSQL_DATA" \
         --socket="$MYSQL_SOCK" \
         --pid-file="$MYSQL_RUN/mysql.pid" \
         --log-error="$MYSQL_LOGS/error.log" \
         --port=3306 \
         --mysqlx=OFF \
         --user=runner \
         --daemonize 2>/dev/null

  # Wait until MySQL is ready
  for i in $(seq 1 15); do
    if mysqladmin --socket="$MYSQL_SOCK" ping --silent 2>/dev/null; then
      echo "[start.sh] MySQL is ready."
      break
    fi
    sleep 1
  done

  # Set root password and load schema
  mysql --socket="$MYSQL_SOCK" -u root -e \
    "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'AlexMySQL'; FLUSH PRIVILEGES;" 2>/dev/null || true

  mysql --socket="$MYSQL_SOCK" -u root -pAlexMySQL < /home/runner/workspace/backend/schema.sql 2>/dev/null || true
  echo "[start.sh] Database schema loaded."
else
  echo "[start.sh] MySQL already running."
fi

# Start the backend
exec node /home/runner/workspace/backend/server.js

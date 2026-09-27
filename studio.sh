#!/usr/bin/env bash
# ==============================================================================
# Vodafone DNEXT Cloud Deployment Studio Control Script
# Usage: ./studio.sh [start|stop|restart|status|logs]
# ==============================================================================

set -e

STUDIO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$STUDIO_ROOT/.pids"
LOG_DIR="$STUDIO_ROOT/logs"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PORT=3002
FRONTEND_PORT=5174

# ANSI Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

mkdir -p "$PID_DIR" "$LOG_DIR"

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

is_pid_running() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  return 1
}

find_port_pids() {
  local port="$1"
  lsof -ti tcp:"$port" 2>/dev/null || true
}

is_backend_running() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    local pid
    pid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
    if is_pid_running "$pid"; then
      return 0
    fi
  fi
  local pids
  pids="$(find_port_pids "$BACKEND_PORT")"
  if [ -n "$pids" ]; then
    return 0
  fi
  return 1
}

is_frontend_running() {
  if [ -f "$FRONTEND_PID_FILE" ]; then
    local pid
    pid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    if is_pid_running "$pid"; then
      return 0
    fi
  fi
  local pids
  pids="$(find_port_pids "$FRONTEND_PORT")"
  if [ -n "$pids" ]; then
    return 0
  fi
  return 1
}

check_dependencies() {
  if [ ! -d "$STUDIO_ROOT/backend/node_modules" ] || [ ! -d "$STUDIO_ROOT/frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies missing. Installing workspace packages...${NC}"
    (cd "$STUDIO_ROOT" && npm run install:all)
  fi
}

# ------------------------------------------------------------------------------
# Commands
# ------------------------------------------------------------------------------

start_app() {
  echo -e "${BOLD}${CYAN}=======================================================${NC}"
  echo -e "${BOLD}${CYAN}🚀 Starting Vodafone DNEXT Deployment Studio...${NC}"
  echo -e "${BOLD}${CYAN}=======================================================${NC}"

  check_dependencies

  # Check if Backend is already running
  if is_backend_running; then
    echo -e "${YELLOW}ℹ️  Backend already running on port ${BACKEND_PORT}.${NC}"
  else
    echo -e "Starting Backend server (Port ${BACKEND_PORT})..."
    cd "$STUDIO_ROOT/backend"
    nohup node server.js </dev/null >> "$BACKEND_LOG" 2>&1 &
    local bpid=$!
    echo "$bpid" > "$BACKEND_PID_FILE"
    disown "$bpid" 2>/dev/null || true
    cd "$STUDIO_ROOT"

    sleep 1
    if is_backend_running; then
      echo -e "${GREEN}✓ Backend started successfully (PID: $bpid)${NC}"
    else
      echo -e "${RED}✕ Failed to start Backend. Check logs at: $BACKEND_LOG${NC}"
      exit 1
    fi
  fi

  # Check if Frontend is already running
  if is_frontend_running; then
    echo -e "${YELLOW}ℹ️  Frontend already running on port ${FRONTEND_PORT}.${NC}"
  else
    echo -e "Starting Frontend Vite UI (Port ${FRONTEND_PORT})..."
    cd "$STUDIO_ROOT/frontend"
    nohup npm run dev </dev/null >> "$FRONTEND_LOG" 2>&1 &
    local fpid=$!
    echo "$fpid" > "$FRONTEND_PID_FILE"
    disown "$fpid" 2>/dev/null || true
    cd "$STUDIO_ROOT"

    sleep 1.5
    if is_frontend_running; then
      echo -e "${GREEN}✓ Frontend started successfully (PID: $fpid)${NC}"
    else
      echo -e "${RED}✕ Failed to start Frontend. Check logs at: $FRONTEND_LOG${NC}"
      exit 1
    fi
  fi

  echo ""
  echo -e "${BOLD}${GREEN}=======================================================${NC}"
  echo -e "${BOLD}${GREEN}✨ DNEXT Deployment Studio is now ONLINE!${NC}"
  echo -e "${BOLD}${GREEN}=======================================================${NC}"
  echo -e "  🌐 ${BOLD}Frontend UI:${NC}   ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
  echo -e "  ⚙️  ${BOLD}Backend API:${NC}   ${CYAN}http://localhost:${BACKEND_PORT}${NC}"
  echo -e "  📋 ${BOLD}Logs:${NC}          ${YELLOW}$LOG_DIR${NC}"
  echo -e "  🛑 ${BOLD}Stop Command:${NC}  ${YELLOW}./studio.sh stop${NC} or ${YELLOW}./stop.sh${NC}"
  echo -e "${BOLD}${GREEN}=======================================================${NC}"
}

stop_app() {
  echo -e "${BOLD}${YELLOW}=======================================================${NC}"
  echo -e "${BOLD}${YELLOW}🛑 Stopping Vodafone DNEXT Deployment Studio...${NC}"
  echo -e "${BOLD}${YELLOW}=======================================================${NC}"

  local stopped_any=0

  # 1. Stop Backend
  if [ -f "$BACKEND_PID_FILE" ]; then
    local bpid
    bpid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
    if [ -n "$bpid" ] && is_pid_running "$bpid"; then
      echo -e "Stopping Backend (PID: $bpid)..."
      kill "$bpid" 2>/dev/null || true
      stopped_any=1
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  # Clean any remaining process on Backend Port
  local port_bpids
  port_bpids="$(find_port_pids "$BACKEND_PORT")"
  if [ -n "$port_bpids" ]; then
    echo -e "Cleaning up lingering process on port ${BACKEND_PORT} (PIDs: $port_bpids)..."
    for p in $port_bpids; do
      kill -9 "$p" 2>/dev/null || true
    done
    stopped_any=1
  fi

  # 2. Stop Frontend
  if [ -f "$FRONTEND_PID_FILE" ]; then
    local fpid
    fpid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    if [ -n "$fpid" ] && is_pid_running "$fpid"; then
      echo -e "Stopping Frontend (PID: $fpid)..."
      kill "$fpid" 2>/dev/null || true
      stopped_any=1
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi

  # Clean any remaining process on Frontend Port
  local port_fpids
  port_fpids="$(find_port_pids "$FRONTEND_PORT")"
  if [ -n "$port_fpids" ]; then
    echo -e "Cleaning up lingering process on port ${FRONTEND_PORT} (PIDs: $port_fpids)..."
    for p in $port_fpids; do
      kill -9 "$p" 2>/dev/null || true
    done
    stopped_any=1
  fi

  # Check if anything was stopped
  if [ $stopped_any -eq 1 ]; then
    echo -e "${GREEN}✓ All DNEXT Deployment Studio services stopped successfully.${NC}"
  else
    echo -e "${YELLOW}ℹ️  No running instances found.${NC}"
  fi
}

status_app() {
  echo -e "${BOLD}${CYAN}=======================================================${NC}"
  echo -e "${BOLD}${CYAN}🔍 DNEXT Deployment Studio Status${NC}"
  echo -e "${BOLD}${CYAN}=======================================================${NC}"

  # Backend Status
  local b_port_pids
  b_port_pids="$(find_port_pids "$BACKEND_PORT")"
  if [ -n "$b_port_pids" ]; then
    echo -e "  Backend (Port ${BACKEND_PORT}):  ${GREEN}● RUNNING${NC} (PID: ${b_port_pids})"
  else
    echo -e "  Backend (Port ${BACKEND_PORT}):  ${RED}○ STOPPED${NC}"
  fi

  # Frontend Status
  local f_port_pids
  f_port_pids="$(find_port_pids "$FRONTEND_PORT")"
  if [ -n "$f_port_pids" ]; then
    echo -e "  Frontend (Port ${FRONTEND_PORT}): ${GREEN}● RUNNING${NC} (PID: ${f_port_pids})"
  else
    echo -e "  Frontend (Port ${FRONTEND_PORT}): ${RED}○ STOPPED${NC}"
  fi

  echo ""
  if [ -n "$b_port_pids" ] && [ -n "$f_port_pids" ]; then
    echo -e "  ${GREEN}● Application is fully ONLINE at:${NC} ${BOLD}http://localhost:${FRONTEND_PORT}${NC}"
  elif [ -n "$b_port_pids" ] || [ -n "$f_port_pids" ]; then
    echo -e "  ${YELLOW}⚠️  Application is partially running.${NC}"
  else
    echo -e "  ${RED}○ Application is completely OFFLINE.${NC}"
  fi
  echo -e "${BOLD}${CYAN}=======================================================${NC}"
}

logs_app() {
  local target="${1:-all}"
  if [ "$target" = "backend" ]; then
    echo -e "${CYAN}Tailing Backend logs ($BACKEND_LOG)... (Press Ctrl+C to exit)${NC}"
    tail -f "$BACKEND_LOG"
  elif [ "$target" = "frontend" ]; then
    echo -e "${CYAN}Tailing Frontend logs ($FRONTEND_LOG)... (Press Ctrl+C to exit)${NC}"
    tail -f "$FRONTEND_LOG"
  else
    echo -e "${CYAN}Tailing all logs... (Press Ctrl+C to exit)${NC}"
    tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
  fi
}

# ------------------------------------------------------------------------------
# Dispatcher
# ------------------------------------------------------------------------------

case "${1:-start}" in
  start)
    start_app
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app
    sleep 1
    start_app
    ;;
  status)
    status_app
    ;;
  logs)
    logs_app "$2"
    ;;
  help|--help|-h)
    echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend]}"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [backend|frontend]}"
    exit 1
    ;;
esac

#!/bin/bash

# ISP Website - Comprehensive Action Logger
# Logs all system activities: users, admins, verification, server events

LOG_DIR="backend/logs"
LOG_FILE="$LOG_DIR/system.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Log function
log_action() {
    local action="$1"
    local user="$2"
    local details="$3"
    local level="${4:-INFO}"
    
    echo "[$TIMESTAMP] [$level] $action | User: ${user:-system} | $details" >> "$LOG_FILE"
    echo "[$TIMESTAMP] [$level] $action | User: ${user:-system} | $details"
}

# Parse command
case "$1" in
    "user-signup")
        log_action "USER_SIGNUP" "$2" "Username: $3, Email: $4" "SUCCESS"
        ;;
    "user-login")
        log_action "USER_LOGIN" "$2" "Email: $3, Status: Success" "SUCCESS"
        ;;
    "user-login-fail")
        log_action "USER_LOGIN_FAILED" "$2" "Email: $3, Reason: Invalid credentials" "WARNING"
        ;;
    "admin-login")
        log_action "ADMIN_LOGIN" "$2" "Admin: $2, Status: Success" "SUCCESS"
        ;;
    "admin-login-fail")
        log_action "ADMIN_LOGIN_FAILED" "$2" "Admin: $2, Reason: Invalid credentials" "WARNING"
        ;;
    "user-suspend")
        log_action "USER_SUSPENDED" "$2" "Target User: $3, Admin: $2" "WARNING"
        ;;
    "user-reactivate")
        log_action "USER_REACTIVATED" "$2" "Target User: $3, Admin: $2" "SUCCESS"
        ;;
    "ticket-created")
        log_action "SUPPORT_TICKET_CREATED" "$2" "Ticket ID: $3, Subject: $4" "SUCCESS"
        ;;
    "ticket-updated")
        log_action "TICKET_UPDATED" "$2" "Ticket ID: $3, Status: $4" "SUCCESS"
        ;;
    "verify-check")
        log_action "VERIFY_CHECK" "system" "Server: $2, API: $3, DB: $4" "INFO"
        ;;
    "server-start")
        log_action "SERVER_START" "system" "Port: 3000, Status: Running" "SUCCESS"
        ;;
    "server-stop")
        log_action "SERVER_STOP" "system" "Port: 3000, Status: Stopped" "INFO"
        ;;
    "server-restart")
        log_action "SERVER_RESTART" "$2" "Initiated by: ${2:-system}" "SUCCESS"
        ;;
    "view-logs")
        log_action "LOGS_VIEWED" "$2" "Admin: $2 accessed system logs" "INFO"
        ;;
    "clear-logs")
        log_action "LOGS_CLEARED" "$2" "Admin: $2 cleared system logs" "WARNING"
        ;;
    "db-query")
        log_action "DATABASE_QUERY" "$2" "Query: $3" "INFO"
        ;;
    "show")
        echo ""
        echo "=== System Action Log ==="
        echo ""
        tail -n 50 "$LOG_FILE" 2>/dev/null || echo "No logs yet"
        echo ""
        echo "Recent actions: $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)"
        ;;
    "clear")
        if [ "$2" == "confirm" ]; then
            rm -f "$LOG_FILE"
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Logs cleared"
        else
            echo "Confirm log clear: ./log.sh clear confirm"
        fi
        ;;
    "tail")
        tail -f "$LOG_FILE" 2>/dev/null || echo "No logs yet"
        ;;
    *)
        echo "Action logger - Log system events"
        echo ""
        echo "Usage: ./log.sh <action> [user] [details...]"
        echo ""
        echo "User Actions:"
        echo "  ./log.sh user-signup <username> <email>"
        echo "  ./log.sh user-login <email>"
        echo "  ./log.sh user-login-fail <email>"
        echo ""
        echo "Admin Actions:"
        echo "  ./log.sh admin-login <admin>"
        echo "  ./log.sh admin-login-fail <admin>"
        echo "  ./log.sh user-suspend <admin> <username>"
        echo "  ./log.sh user-reactivate <admin> <username>"
        echo "  ./log.sh ticket-created <admin> <ticket-id> <subject>"
        echo "  ./log.sh ticket-updated <admin> <ticket-id> <status>"
        echo "  ./log.sh server-restart <admin>"
        echo ""
        echo "System Actions:"
        echo "  ./log.sh verify-check <server-status> <api-status> <db-status>"
        echo "  ./log.sh server-start"
        echo "  ./log.sh server-stop"
        echo "  ./log.sh db-query <admin> <query>"
        echo ""
        echo "View/Manage Logs:"
        echo "  ./log.sh show       - Show last 50 actions"
        echo "  ./log.sh tail       - Follow logs in real-time"
        echo "  ./log.sh clear      - Clear all logs (requires confirm)"
        echo ""
        ;;
esac

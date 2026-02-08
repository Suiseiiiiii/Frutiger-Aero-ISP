#!/bin/bash

# ISP Website Verification Script

check_status() {
    echo "Verification Check - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Check if server is running
    if ! nc -zv localhost 3000 &>/dev/null; then
        echo "Server is offline"
        return 1
    fi
    
    echo "Server: ONLINE"
    
    # Check API health
    if command -v curl &>/dev/null; then
        if curl -s http://localhost:3000/api/health | grep -q "online"; then
            echo "API: RESPONDING"
        else
            echo "API: OFFLINE"
        fi
    fi
    
    # Check database
    if [ -f "backend/db/isp.db" ]; then
        echo "Database: OK ($(ls -lh backend/db/isp.db | awk '{print $5}'))"
    fi
    
    echo ""
    return 0
}

# Quick verification
echo "ISP Website Verification"
echo "========================"
echo ""

# Check requirements
command -v node > /dev/null || { echo "Node.js not found"; exit 1; }
command -v npm > /dev/null || { echo "npm not found"; exit 1; }

# Check files
for file in package.json backend/server.js public/index.html public/js/app.js public/css/style.css; do
    [ -f "$file" ] || { echo "$file not found"; exit 1; }
done

# Check dependencies
[ -d "node_modules" ] || { echo "Running npm install..."; npm ci --silent; }

echo "Setup: OK"
echo ""

# Initial check
check_status
SERVER_WAS_RUNNING=$?

# Live monitoring loop
if [ $SERVER_WAS_RUNNING -eq 0 ]; then
    echo "Starting live monitoring (every 30 min)..."
    echo "Press Ctrl+C to stop"
    echo ""
    
    while true; do
        sleep 1800  # 30 minutes
        check_status
    done
else
    echo "Server not running. Start with: npm start"
    echo "Run this script again to enable live monitoring"
fi

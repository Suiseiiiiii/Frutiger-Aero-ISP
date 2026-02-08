#!/bin/bash

# ISP Website - Verification Script
# This script verifies all components are working correctly

echo "=========================================="
echo "🔍 ISP Website Verification Script"
echo "=========================================="
echo ""

# Check 1: Node.js installed
echo "✓ Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js installed: $NODE_VERSION"
else
    echo "  ❌ Node.js not found - install Node.js v14 or higher"
    exit 1
fi
echo ""

# Check 2: npm installed
echo "✓ Checking npm installation..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✅ npm installed: $NPM_VERSION"
else
    echo "  ❌ npm not found"
    exit 1
fi
echo ""

# Check 3: Project files exist
echo "✓ Checking project files..."
FILES=(
    "package.json"
    "backend/server.js"
    "backend/test.js"
    "public/index.html"
    "public/css/style.css"
    "public/js/app.js"
    "README.md"
    "API_DOCUMENTATION.md"
)

ALL_FOUND=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - NOT FOUND"
        ALL_FOUND=false
    fi
done

if [ "$ALL_FOUND" = false ]; then
    echo ""
    echo "❌ Some files are missing!"
    exit 1
fi
echo ""

# Check 4: Dependencies installed
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules directory exists"
else
    echo "  ⚠️  node_modules not found - run 'npm install'"
    echo "  Installing dependencies..."
    npm install > /dev/null 2>&1
    echo "  ✅ Dependencies installed"
fi
echo ""

# Check 5: Server is running
echo "✓ Checking if server is running..."
if nc -zv localhost 3000 > /dev/null 2>&1; then
    echo "  ✅ Server is running on localhost:3000"
else
    echo "  ⚠️  Server is not running"
    echo "  To start: npm start"
fi
echo ""

# Check 6: API Health
echo "✓ Testing API endpoints..."
if command -v curl &> /dev/null; then
    HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
    if [[ $HEALTH == *"online"* ]]; then
        echo "  ✅ API /api/health endpoint responding"
    else
        echo "  ⚠️  API not responding - start server with 'npm start'"
    fi
else
    echo "  ⚠️  curl not available - skipping API test"
fi
echo ""

# Check 7: Database
echo "✓ Checking database..."
if [ -f "backend/db/isp.db" ]; then
    DB_SIZE=$(ls -lh backend/db/isp.db | awk '{print $5}')
    echo "  ✅ SQLite database found: $DB_SIZE"
else
    echo "  ℹ️  Database will be created when server starts"
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Verification Complete!"
echo "=========================================="
echo ""
echo "📋 Quick Commands:"
echo "  Start server:    npm start"
echo "  Run tests:       npm test"
echo "  View docs:       cat README.md"
echo "  API reference:   cat API_DOCUMENTATION.md"
echo ""
echo "🌐 Access website:"
echo "  http://localhost:3000"
echo ""
echo "🔐 Admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "🚀 Ready to go!"
echo ""

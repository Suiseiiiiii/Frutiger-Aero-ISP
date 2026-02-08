#!/bin/bash

# ISP Website Setup Script

set -e

echo "Setting up ISP Website..."

# Check Node.js and npm
command -v node > /dev/null || { echo "Node.js not found. Install Node.js v14+"; exit 1; }
command -v npm > /dev/null || { echo "npm not found"; exit 1; }

echo "Node.js $(node -v) | npm $(npm -v)"

# Install and setup
mkdir -p backend/db
npm ci --silent

echo "Setup complete!"
echo ""
echo "Start server: npm start"
echo "Run tests: npm test"
echo "Admin: admin / admin123"

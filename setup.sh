#!/bin/bash

# ISP Website Quick Start Script

echo "Premium ISP Website - Quick Start"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed."
    exit 1
fi

echo "npm version: $(npm --version)"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
fi

echo "Dependencies installed"
echo ""

# Verify database directory exists
if [ ! -d "backend/db" ]; then
    mkdir -p backend/db
    echo "Created database directory"
fi

echo ""
echo "Setup Complete!"
echo "===================================="
echo ""
echo "Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Remember to change these in production!"
echo ""
echo "Website available at:"
echo "   http://localhost:3000"
echo ""
echo "To start the server:"
echo "   npm start"
echo ""
echo "To run tests:"
echo "   npm test"

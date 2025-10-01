#!/bin/bash

# 🏗️ Production Build Script for Digital Ocean
# Handles Puppeteer Chrome installation and builds the application

echo "🏗️ Building for production deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Install backend dependencies
print_status "Installing backend dependencies..."
npm ci --only=production
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Install Puppeteer Chrome for production
print_status "Installing Puppeteer Chrome for production..."
npx puppeteer browsers install chrome
if [ $? -eq 0 ]; then
    print_success "Puppeteer Chrome installed"
else
    print_warning "Failed to install Puppeteer Chrome - web scraping may not work"
fi

# Build frontend
if [ -d "frontend" ]; then
    print_status "Building frontend..."
    cd frontend
    
    # Install frontend dependencies
    npm ci
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    # Build frontend
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
else
    print_warning "Frontend directory not found, skipping frontend build"
fi

print_success "Production build completed! 🎉"
echo ""
echo "📦 Build Summary:"
echo "   ✅ Backend dependencies installed"
echo "   ✅ Puppeteer Chrome installed"
echo "   ✅ Frontend built successfully"
echo ""
echo "🚀 Ready for Digital Ocean deployment!"

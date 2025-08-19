#!/bin/bash

echo "🚀 Setting up Skipify MCP Server and Test Chat Application"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Setup MCP Server
print_status "Setting up MCP Server..."

cd mcp-server

# Install dependencies
print_status "Installing MCP Server dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install MCP Server dependencies"
    exit 1
fi

# Build the project
print_status "Building MCP Server..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Failed to build MCP Server"
    exit 1
fi

print_success "MCP Server setup completed!"

# Setup Test Chat App
print_status "Setting up Test Chat Application..."

cd ../test-chat-app

# Install dependencies
print_status "Installing Test Chat App dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install Test Chat App dependencies"
    exit 1
fi

print_success "Test Chat App setup completed!"

# Create environment file for MCP server
cd ../mcp-server
if [ ! -f .env ]; then
    print_status "Creating environment file..."
    cp env.example .env
    print_success "Environment file created. You can edit .env to customize settings."
fi

# Return to root directory
cd ..

print_success "Setup completed successfully!"
echo ""
print_status "Next steps:"
echo "1. Start the MCP Server:"
echo "   cd mcp-server && npm start"
echo ""
echo "2. In another terminal, start the Test Chat App:"
echo "   cd test-chat-app && npm run dev"
echo ""
echo "3. Access the applications:"
echo "   - MCP Server: http://localhost:3000"
echo "   - Test Page: http://localhost:3000/test"
echo "   - Test Chat App: http://localhost:3001"
echo ""
print_warning "Make sure to start the MCP Server first before the Test Chat App!"
echo ""
print_status "For more information, see the README files in each directory." 
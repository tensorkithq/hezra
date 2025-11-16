#!/bin/bash

# Integration Test Runner for Paystack Server
# This script starts the server, runs integration tests, and cleans up

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Paystack Server Integration Tests ===${NC}\n"

# Check if PAYSTACK_SECRET_KEY is set
if [ -z "$PAYSTACK_SECRET_KEY" ]; then
    echo -e "${RED}Error: PAYSTACK_SECRET_KEY environment variable is not set${NC}"
    echo "Please set it with: export PAYSTACK_SECRET_KEY=your_test_key"
    exit 1
fi

# Build the server
echo -e "${YELLOW}Building server...${NC}"
go build -o bin/paystack-server cmd/server/main.go
echo -e "${GREEN}✓ Server built${NC}\n"

# Start the server in the background with environment variable
echo -e "${YELLOW}Starting server on port 4000...${NC}"
# Explicitly pass the environment variable to the server process
PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET_KEY ./bin/paystack-server > server.log 2>&1 &
SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    if kill -0 $SERVER_PID 2>/dev/null; then
        kill $SERVER_PID
        echo -e "${GREEN}✓ Server stopped${NC}"
    fi
    rm -f server.log
}

# Register cleanup function
trap cleanup EXIT INT TERM

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 3

# Check if server is running
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Run the integration tests
echo -e "${YELLOW}Running integration tests...${NC}\n"
go test -v ./tests/integration/... -timeout 30s

# Check test result
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}=== All tests passed! ===${NC}"
else
    echo -e "\n${RED}=== Tests failed ===${NC}"
    exit 1
fi

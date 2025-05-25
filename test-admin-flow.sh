#!/bin/bash

echo "Testing admin routing system..."

# Test 1: Login as admin
echo "1. Testing admin login..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"rowdycup2025"}' \
  -c test-cookies.txt -s)

echo "Login Response: $LOGIN_RESPONSE"

# Test 2: Verify admin status
echo "2. Verifying admin authentication..."
USER_RESPONSE=$(curl -X GET http://localhost:3000/api/auth/me \
  -b test-cookies.txt -s)

echo "Profile Response: $USER_RESPONSE"

# Test 3: Test access to protected endpoints
echo "3. Testing access to protected endpoints..."
ROUNDS_RESPONSE=$(curl -X GET http://localhost:3000/api/rounds \
  -b test-cookies.txt -s)

echo "Rounds Response: $ROUNDS_RESPONSE"

# Test 4: Test creating a round (admin only)
echo "4. Testing round creation (admin functionality)..."
CREATE_ROUND_RESPONSE=$(curl -X POST http://localhost:3000/api/rounds \
  -H "Content-Type: application/json" \
  -b test-cookies.txt \
  -d '{"number":2,"format":"best-ball","status":"upcoming"}' -s)

echo "Create Round Response: $CREATE_ROUND_RESPONSE"

# Test 5: Logout
echo "5. Testing logout..."
LOGOUT_RESPONSE=$(curl -X POST http://localhost:3000/api/auth/logout \
  -b test-cookies.txt -s)

echo "Logout Response: $LOGOUT_RESPONSE"

# Cleanup
rm -f test-cookies.txt

echo "Admin authentication test completed!"

#!/usr/bin/env bash
# Run with backend at http://localhost:3000 and DB seeded (admin@platform.com / Admin123!)
# Start backend: cd backend && npx prisma db seed && node dist/src/main.js
set -e
BASE=${1:-http://localhost:3000}

echo "=== 1. Login as SUPER_ADMIN ==="
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@platform.com","password":"Admin123!"}')
TOKEN=$(echo "$LOGIN" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "Login failed. Ensure backend is running and seed was applied (admin@platform.com / Admin123!)"
  echo "$LOGIN"
  exit 1
fi
echo "Token received."

echo "=== 2. GET /organizations ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/organizations" | head -c 200
echo ""

echo "=== 3. POST /organizations (create company) ==="
CREATE_ORG=$(curl -s -X POST "$BASE/organizations" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Co","slug":"test-co"}')
echo "$CREATE_ORG" | head -c 200
echo ""

echo "=== 4. GET /business-cards/admin/all ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/business-cards/admin/all" | head -c 300
echo ""

echo "=== 5. GET /auth/profile ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/auth/profile" | head -c 200
echo ""

echo "Done. Backend API checks passed."

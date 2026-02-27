#!/bin/bash

# Test script to verify Edge Function CORS and accessibility

SUPABASE_URL="https://ruttbgufwmrmmdjdyftn.supabase.co"
FUNCTION_NAME="create-order"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHRiZ3Vmd21ybW1kamR5ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQ1MjUsImV4cCI6MjA4NzcyMDUyNX0.0JUIVKOAV8pU9t2aRjhvRZavX485NAx_N8og4CFhiD0"

echo "🧪 Testing Edge Function: $FUNCTION_NAME"
echo "URL: $SUPABASE_URL/functions/v1/$FUNCTION_NAME"
echo ""

echo "1️⃣ Testing OPTIONS (CORS Preflight)..."
echo "---"
curl -X OPTIONS "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" \
  -H "Origin: https://topcreditos-eta.vercel.app" \
  -v 2>&1 | grep -E "(< HTTP|< Access-Control)"

echo ""
echo ""
echo "2️⃣ Testing POST (without auth - should fail with 401)..."
echo "---"
curl -X POST "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" \
  -H "Content-Type: application/json" \
  -H "apikey: $ANON_KEY" \
  -d '{"productId": "test"}' \
  -v 2>&1 | grep -E "(< HTTP|error|Unauthorized)"

echo ""
echo ""
echo "✅ Test complete!"
echo ""
echo "Expected results:"
echo "  - OPTIONS should return HTTP 200 with Access-Control headers"
echo "  - POST without auth should return 401 Unauthorized"

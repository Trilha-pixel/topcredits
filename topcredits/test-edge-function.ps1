# Test script to verify Edge Function CORS and accessibility

$SUPABASE_URL = "https://ruttbgufwmrmmdjdyftn.supabase.co"
$FUNCTION_NAME = "create-order"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dHRiZ3Vmd21ybW1kamR5ZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDQ1MjUsImV4cCI6MjA4NzcyMDUyNX0.0JUIVKOAV8pU9t2aRjhvRZavX485NAx_N8og4CFhiD0"

Write-Host "🧪 Testing Edge Function: $FUNCTION_NAME" -ForegroundColor Cyan
Write-Host "URL: $SUPABASE_URL/functions/v1/$FUNCTION_NAME"
Write-Host ""

Write-Host "1️⃣ Testing OPTIONS (CORS Preflight)..." -ForegroundColor Yellow
Write-Host "---"

try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" `
        -Method Options `
        -Headers @{
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "authorization,content-type"
            "Origin" = "https://topcreditos-eta.vercel.app"
        } `
        -UseBasicParsing

    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:"
    $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host ""
Write-Host "2️⃣ Testing POST (without auth - should fail with 401)..." -ForegroundColor Yellow
Write-Host "---"

try {
    $body = @{
        productId = "test"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/functions/v1/$FUNCTION_NAME" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $ANON_KEY
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor $(if ($statusCode -eq 401) { "Green" } else { "Red" })
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}

Write-Host ""
Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Expected results:"
Write-Host "  - OPTIONS should return HTTP 200 with Access-Control headers"
Write-Host "  - POST without auth should return 401 Unauthorized"

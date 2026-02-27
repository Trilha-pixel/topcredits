# Deploy all Supabase Edge Functions
# Run this script after making changes to any function

Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Deploy each function
Write-Host "📦 Deploying create-order..." -ForegroundColor Yellow
supabase functions deploy create-order

Write-Host ""
Write-Host "📦 Deploying create-payment-pix..." -ForegroundColor Yellow
supabase functions deploy create-payment-pix

Write-Host ""
Write-Host "📦 Deploying buy-credits..." -ForegroundColor Yellow
supabase functions deploy buy-credits

Write-Host ""
Write-Host "📦 Deploying cancel-order..." -ForegroundColor Yellow
supabase functions deploy cancel-order

Write-Host ""
Write-Host "📦 Deploying get-order-details..." -ForegroundColor Yellow
supabase functions deploy get-order-details

Write-Host ""
Write-Host "📦 Deploying update-order-delivery..." -ForegroundColor Yellow
supabase functions deploy update-order-delivery

Write-Host ""
Write-Host "📦 Deploying invite-user..." -ForegroundColor Yellow
supabase functions deploy invite-user

Write-Host ""
Write-Host "📦 Deploying asaas-webhook..." -ForegroundColor Yellow
supabase functions deploy asaas-webhook

Write-Host ""
Write-Host "✅ All functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To verify deployment, check the Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/ruttbgufwmrmmdjdyftn/functions"

#!/bin/bash

# Deploy all Supabase Edge Functions
# Run this script after making changes to any function

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Deploy each function
echo "📦 Deploying create-order..."
supabase functions deploy create-order

echo ""
echo "📦 Deploying create-payment-pix..."
supabase functions deploy create-payment-pix

echo ""
echo "📦 Deploying buy-credits..."
supabase functions deploy buy-credits

echo ""
echo "📦 Deploying cancel-order..."
supabase functions deploy cancel-order

echo ""
echo "📦 Deploying get-order-details..."
supabase functions deploy get-order-details

echo ""
echo "📦 Deploying update-order-delivery..."
supabase functions deploy update-order-delivery

echo ""
echo "📦 Deploying invite-user..."
supabase functions deploy invite-user

echo ""
echo "📦 Deploying asaas-webhook..."
supabase functions deploy asaas-webhook

echo ""
echo "✅ All functions deployed successfully!"
echo ""
echo "🔍 To verify deployment, check the Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/ruttbgufwmrmmdjdyftn/functions"

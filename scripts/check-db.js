
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    const key = parts[0];
    const val = parts.slice(1).join('='); // Handle values with =
    if (key && val) {
        env[key.trim()] = val.trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL;
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log(`Checking connection to: ${supabaseUrl}`);

    // 1. Check if we can reach Supabase at all (public table)
    // Trying products table
    const { data: products, error: productError } = await supabase
        .from('products')
        .select('count')
        .limit(1);

    if (productError) {
        console.error('❌ Error accessing "products" table:', productError);
        if (productError.code === '42P01') {
            console.error('   -> Table "products" does not exist. You likely need to run the supabase_schema.sql script.');
        }
    } else {
        console.log('✅ "products" table is accessible.');
    }

    // 2. Check profiles (will likely fail due to RLS if no session, but checking for 42P01 vs 401/500)
    const { error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

    if (profileError) {
        // 42P01 = undefined_table (Postgres error code)
        if (profileError.code === '42P01') {
            console.error('❌ "profiles" table does not exist.');
        } else {
            console.log(`ℹ️ "profiles" table access check: ${profileError.message} (Expected due to RLS if unauthenticated)`);
        }
    }

    // 3. Simple Auth Check - NOT logging in, but checking if Auth service responds
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.error('❌ Auth service error:', authError);
    } else {
        console.log('✅ Auth service is reachable.');
    }
}

check();

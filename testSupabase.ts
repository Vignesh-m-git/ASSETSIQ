import { supabase } from './services/supabaseClient';

// Test Supabase Connection
async function testSupabaseConnection() {
    console.log('=== Testing Supabase Connection ===');

    // Check if env vars are loaded
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✓ Set' : '✗ Missing');

    try {
        // Test 1: Check if we can reach Supabase
        const { data, error } = await supabase.auth.getSession();
        console.log('Session check:', error ? '✗ Error' : '✓ Success');
        if (error) console.error('Session error:', error);

        // Test 2: Try to get user (will be null if not logged in, but shouldn't error)
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('User check:', userError ? '✗ Error' : '✓ Success');
        if (userError) console.error('User error:', userError);

    } catch (err) {
        console.error('Connection test failed:', err);
    }
}

// Run test on page load
testSupabaseConnection();

export default testSupabaseConnection;

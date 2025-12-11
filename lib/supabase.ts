import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
// Using Publishable (anon) and Secret (service_role) API keys
// Get these from: Supabase Dashboard > Settings > API

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Publishable (anon) key
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Secret (service_role) key

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabasePublishableKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (Publishable key) environment variable')
}
if (!supabaseSecretKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (Secret key) environment variable')
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. URL should start with https://`)
}

// Client for client-side operations
// Uses Publishable (anon) key - safe to expose, protected by RLS (Row Level Security)
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Admin client for server-side operations
// Uses Secret (service_role) key - bypasses RLS, must be kept secure
// ⚠️ WARNING: This key has full access to your database. Never expose it to the client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})


import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'am-dashboard-auth',
    autoRefreshToken: true,
    detectSessionInUrl: false, // Changed to false to prevent URL-based session detection
    flowType: 'pkce', // Use PKCE flow for better session handling
    debug: true, // Set to true temporarily if you need to debug auth issues

  },
  global: {
    headers: {
      'X-Client-Info': 'am-dashboard'
    }
  },
  // Add realtime configuration to prevent unnecessary connections
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

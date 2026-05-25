import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Браузерный клиент (client components) ────────────────────
// Использует anon ключ — ограниченные права, безопасно отдавать на фронт
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Серверный клиент (API routes, Server Actions) ────────────
// Использует service_role — полные права, ТОЛЬКО на сервере!
// Никогда не импортируй supabaseAdmin в client components
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

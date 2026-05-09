'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function GoogleCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
        const email = user.email ?? ''
        if (name) localStorage.setItem('voter_name', name)
        if (email) localStorage.setItem('voter_email', email)
        // Sign out after capturing info — voter doesn't need a session
        await supabase.auth.signOut()
      }

      router.replace('/votar')
    }
    handle()
  }, [])

  return (
    <div className="min-h-screen bg-ocean-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

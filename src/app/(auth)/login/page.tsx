'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link!',
      })
    }

    setLoading(false)
  }

  return (
    <div className="bg-black-card border-2 border-border-subtle p-8">
      <h2 className="text-xl font-bold text-orange-accent uppercase tracking-wide mb-6">
        Sign In
      </h2>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-xs uppercase tracking-wider text-white-muted mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white-dim" />
            <Input
              id="email"
              type="email"
              placeholder="you@altshift.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending Link...' : 'Send Magic Link'}
        </Button>
      </form>

      {message && (
        <div
          className={`mt-6 p-4 border-2 flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-black-deep border-green-success'
              : 'bg-black-deep border-red-hot'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-success flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-hot flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-success' : 'text-red-hot'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-white-dim text-xs">
        We&apos;ll send you a magic link to sign in.
        <br />
        No password required.
      </p>
    </div>
  )
}

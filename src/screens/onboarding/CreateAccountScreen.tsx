import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { supabase } from '@/lib/supabase'
import OnboardingLayout, { OnboardingHeadline, OnboardingSubtext } from '@/components/OnboardingLayout'

export default function CreateAccountScreen() {
  const { state, next } = useOnboarding()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSignIn, setShowSignIn] = useState(() => {
    const flag = localStorage.getItem('loti_signin_mode')
    if (flag) {
      localStorage.removeItem('loti_signin_mode')
      return true
    }
    return false
  })
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  const canSubmit = email.includes('@') && password.length >= 8

  const handleEmailSignup = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) {
        setError(authError.message)
        return
      }

      // Save profile to Supabase
      if (data.user) {
        await saveProfile(data.user.id)
      }

      next()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'apple' | 'google') => {
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/onboarding` },
      })
      if (authError) setError(authError.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })
      if (authError) {
        setError(authError.message)
        return
      }
      // Returning user — skip summary, go straight to dashboard
      localStorage.setItem('loti_onboarding_complete', 'true')
      nav('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (userId: string) => {
    const { greenMax, yellowMax } = await import('@/contexts/OnboardingContext').then(m => m.computeThresholds(state))

    await supabase.from('user_profiles').upsert({
      user_id: userId,
      health_state: state.healthState ?? 'healthy',
      goal: state.goal ?? 'learn',
      diagnosis_duration: state.diagnosisDuration,
      a1c_value: state.a1cValue,
      medications: state.medications,
      age: state.age,
      sex: state.sex ?? 'not_specified',
      activity_level: state.activityLevel,
      dietary_restrictions: state.dietaryRestrictions,
      meal_struggles: state.mealStruggles,
      gl_threshold_green: greenMax,
      gl_threshold_yellow: yellowMax,
      onboarding_screens_completed: state.screensCompleted,
      onboarding_completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }

  return (
    <OnboardingLayout>
      <OnboardingHeadline>{showSignIn ? 'Welcome back' : 'Save your profile'}</OnboardingHeadline>
      <OnboardingSubtext>{showSignIn ? 'Sign in to your existing account' : 'Create an account to keep your personalized results'}</OnboardingSubtext>

      <div className="mt-6 flex flex-col gap-3">
        {showSignIn ? (
          /* Sign-In Mode */
          <>
            {/* Google Sign In */}
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3.5 text-base font-medium text-text-primary min-h-[48px] hover:bg-surface disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            {/* Apple Sign In */}
            <button
              onClick={() => handleOAuthSignIn('apple')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-base font-medium text-white min-h-[48px] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Sign in with Apple
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-text-tertiary">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={signInEmail}
                onChange={e => setSignInEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-text-primary focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={signInPassword}
                onChange={e => setSignInPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-text-primary focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>
            <button
              onClick={handleSignIn}
              disabled={!signInEmail.includes('@') || signInPassword.length < 8 || loading}
              className="w-full rounded-3xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-dark disabled:opacity-40 min-h-[48px] transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            {error && (
              <div className="rounded-xl bg-error/10 px-4 py-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            <button
              onClick={() => setShowSignIn(false)}
              className="mt-2 text-sm text-text-tertiary min-h-[44px]"
            >
              Don't have an account? Create one
            </button>
          </>
        ) : (
          /* Create Account Mode */
          <>
            {/* Apple Sign In */}
            <button
              onClick={() => handleOAuthSignIn('apple')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3.5 text-base font-medium text-white min-h-[48px] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </button>

            {/* Google Sign In */}
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3.5 text-base font-medium text-text-primary min-h-[48px] hover:bg-surface disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-text-tertiary">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Email/password */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-text-primary focus:border-primary focus:outline-none min-h-[48px]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 pr-12 text-base text-text-primary focus:border-primary focus:outline-none min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary hover:text-text-secondary min-h-[44px] px-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              onClick={handleEmailSignup}
              disabled={!canSubmit || loading}
              className="w-full rounded-3xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-dark disabled:opacity-40 min-h-[48px] transition-colors"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {error && (
              <div className="rounded-xl bg-error/10 px-4 py-3">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <p className="text-center text-xs text-text-tertiary">
              By creating an account, you agree to our{' '}
              <button onClick={() => nav('/terms')} className="underline">Terms of Service</button> and{' '}
              <button onClick={() => nav('/privacy')} className="underline">Privacy Policy</button>
            </p>

            <button
              onClick={() => setShowSignIn(true)}
              className="mt-2 w-full text-center text-sm font-medium text-primary min-h-[44px]"
            >
              Already have an account? Sign in
            </button>
          </>
        )}
      </div>
    </OnboardingLayout>
  )
}

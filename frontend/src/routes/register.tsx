import * as React from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '../auth'
import { Link } from '@tanstack/react-router'

const fallback = '/dashboard' as const

export const Route = createFileRoute('/register')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback })
    }
  },
  component: RegisterComponent,
})

interface RegisterResponse {
  message: string;
  error?: string;
}

function RegisterComponent() {
    const auth = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')

  const onFormSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true)
    setError('')
    try {
      evt.preventDefault()
      const data = new FormData(evt.currentTarget)
      const username = data.get('username')?.toString()
      const password = data.get('password')?.toString()
      const confirmPassword = data.get('confirmPassword')?.toString()

      if (!username || !password || !confirmPassword) return

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const result = await auth.register(username, password)

        if (!result.success || result.error) {
            setError(result.error || 'Registration failed. Please try again')
            return
        }

    await router.invalidate()
      // Redirect to login page after successful registration
      await router.navigate({ to: '/' })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
      console.error('Error registering: ', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <h1 className="auth-title">Create an Account</h1>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Join BookTrackr and start tracking your reading progress
        </p>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <form className="space-y-5" onSubmit={onFormSubmit}>
          <fieldset disabled={isSubmitting}>
            <div className="form-group">
              <label htmlFor="username-input" className="form-label">
                Username
              </label>
              <input
                id="username-input"
                name="username"
                placeholder="Choose a username"
                type="text"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
              <input
                id="password-input"
                name="password"
                placeholder="Choose a password"
                type="password"
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm-password-input" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirm-password-input"
                name="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                className="form-input"
                required
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full mt-6"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : 'Create Account'}
            </button>
          </fieldset>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
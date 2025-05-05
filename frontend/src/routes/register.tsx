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
    <div className="p-2 grid gap-2 place-items-center">
      <h3 className="text-xl">Register</h3>
      <p>Create a new account</p>
      {error && <p className="text-red-500">{error}</p>}
      <form className="mt-4 max-w-lg" onSubmit={onFormSubmit}>
        <fieldset disabled={isSubmitting} className="w-full grid gap-2">
          <div className="grid gap-2 items-center min-w-[300px]">
            <label htmlFor="username-input" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username-input"
              name="username"
              placeholder="Choose a username"
              type="text"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>
          <div className="grid gap-2 items-center">
            <label htmlFor="password-input" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password-input"
              name="password"
              placeholder="Choose a password"
              type="password"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>
          <div className="grid gap-2 items-center">
            <label htmlFor="confirm-password-input" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirm-password-input"
              name="confirmPassword"
              placeholder="Confirm your password"
              type="password"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-md w-full disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </fieldset>
      </form>
      <p className="mt-4">
        Already have an account?{' '}
        <Link to="/" className="text-blue-500 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  )
}
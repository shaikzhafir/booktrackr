import * as React from 'react'
import { createFileRoute, redirect, useRouter, useRouterState } from '@tanstack/react-router'
import { z } from 'zod'
import { useAuth } from '../auth'
import { Link } from '@tanstack/react-router'

const fallback = '/dashboard' as const

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(''),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback })
    }
  },
  component: LoginComponent,
})

function LoginComponent() {
  const auth = useAuth()
  const router = useRouter()
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const navigate = Route.useNavigate()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')

  const search = Route.useSearch()

  const onFormSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault() // Move this to the top before any state changes
    setIsSubmitting(true)
    setError('')
    
    try {
      const data = new FormData(evt.currentTarget)
      const username = data.get('username')?.toString().trim() // Add trim()
      const password = data.get('password')?.toString()
  
      if (!username || !password) {
        setError('Username and password are required')
        return
      }
  
      const result = await auth.login(username, password)
      
      if (!result.success || result.error) {
        setError(result.error || 'Login failed. Please try again.')
        return
      }
  
      await router.invalidate()
      await navigate({ to: search.redirect || fallback })
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      console.error('Error logging in: ', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  

  const isLoggingIn = isLoading || isSubmitting

  return (
    <div className="p-2 grid gap-2 place-items-center">
      <h3 className="text-xl">Login page</h3>
      {search.redirect ? (
        <p className="text-red-500">You need to login to access this page.</p>
      ) : (
        <p>Login to see all the cool content in here.</p>
      )}
      {error && <p className="text-red-500">{error}</p>}
      <form className="mt-4 max-w-lg" onSubmit={onFormSubmit}>
        <fieldset disabled={isLoggingIn} className="w-full grid gap-2">
          <div className="grid gap-2 items-center min-w-[300px]">
            <label htmlFor="username-input" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username-input"
              name="username"
              placeholder="Enter your username"
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
              placeholder="Enter your password"
              type="password"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-md w-full disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isLoggingIn ? 'Loading...' : 'Login'}
          </button>
        </fieldset>
      </form>
      <p className="mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:underline">
          Register here
        </Link>
      </p>
    </div>
  )
}

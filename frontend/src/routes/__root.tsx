import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import type { AuthContext } from '../auth'
import { ThemeToggle } from '../components/ThemeToggle'

interface MyRouterContext {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  ),
})

// this is the parent route for authenticated users
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";

import { useAuth } from "../auth";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const auth = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      auth.logout().then(() => {
        router.invalidate().finally(() => {
          navigate({ to: "/" });
        });
      });
    }
  };

  return (
    <div className="container-custom min-h-screen">
      <header className="py-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link to="/">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                BookTrackr
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your reading progress
              </p>
            </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`nav-link ${pathname.includes("/dashboard") ? "nav-link-active" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              to="/books"
              className={`nav-link ${pathname.includes("/books") ? "nav-link-active" : ""}`}
            >
              Books
            </Link>
            <div className="mx-2 h-6 border-r border-gray-300 dark:border-gray-700"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{auth.user}</span>
              <button
                type="button"
                className="btn btn-ghost text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

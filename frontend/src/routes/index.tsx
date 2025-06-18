import * as React from "react";
import {
  createFileRoute,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "../auth";
import { Link } from "@tanstack/react-router";

const fallback = "/dashboard" as const;

export const Route = createFileRoute("/")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const auth = useAuth();
  const router = useRouter();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const navigate = Route.useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const search = Route.useSearch();

  const onFormSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault(); // Move this to the top before any state changes
    setIsSubmitting(true);
    setError("");

    try {
      const data = new FormData(evt.currentTarget);
      const username = data.get("username")?.toString().trim(); // Add trim()
      const password = data.get("password")?.toString();

      if (!username || !password) {
        setError("Username and password are required");
        return;
      }

      const result = await auth.login(username, password);

      if (!result.success || result.error) {
        setError(result.error || "Login failed. Please try again.");
        return;
      }

      await router.invalidate();
      await navigate({ to: search.redirect || fallback });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      console.error("Error logging in: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = (e : React.MouseEvent) => {
    e.preventDefault();
    window.location.assign("http://localhost:8080/google/login");
  }

  const isLoggingIn = isLoading || isSubmitting;

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <h1 className="auth-title">Welcome to BookTrackr</h1>

        {search.redirect ? (
          <div className="alert alert-warning mb-6">
            You need to login to access this page.
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Track your reading journey and manage your book collection
          </p>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form className="space-y-5" onSubmit={onFormSubmit}>
          <fieldset disabled={isLoggingIn}>
            <div className="form-group">
              <label htmlFor="username-input" className="form-label">
                Username
              </label>
              <input
                id="username-input"
                name="username"
                placeholder="Enter your username"
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
                placeholder="Enter your password"
                type="password"
                className="form-input"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full mt-6">
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="loading-spinner"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </fieldset>
        </form>
        <button onClick={handleGoogleLogin} className="btn btn-secondary w-full mt-4">
              google login
        </button>
        

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

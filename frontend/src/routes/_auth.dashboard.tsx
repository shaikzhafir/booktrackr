import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../auth";
import { useEffect, useState } from "react";
import type { Book } from "../types/books.types";
import { createApiUrl } from "../config/api";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const auth = useAuth();
  const [stats, setStats] = useState({
    completed: { count: 0, percentage: 0 },
    inProgress: { count: 0, percentage: 0 },
    total: 0
  });

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Function to fetch books from API
  const fetchBooks = async () => {
    console.log("fetchBooks called");
    try {
      console.log("Fetching books for user:", auth.user);

      const response = await fetch(createApiUrl("/user/books"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user}`, // Using user ID as token
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error fetching books:", errorData);

        throw new Error(errorData.error || "Failed to fetch books");
      }

      const res = await response.json();
      console.log("Fetched books:", res);
      const fetchedBooks: Book[] = res.data || [];

       // Calculate stats immediately after setting books
       const totalBooks = fetchedBooks.length;
       const completedBooks = fetchedBooks.filter(book => book.progress === 100).length;
       const inProgressBooks = fetchedBooks.filter(book => book.progress > 0 && book.progress < 100).length;
       
       setStats({
         completed: {
           count: completedBooks,
           percentage: totalBooks ? (completedBooks / totalBooks) * 100 : 0
         },
         inProgress: {
           count: inProgressBooks,
           percentage: totalBooks ? (inProgressBooks / totalBooks) * 100 : 0
         },
         total: totalBooks
       });

    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      console.log("Finished fetching books");
    }
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stats Card */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welcome Back!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hi, {auth.user}! Track your reading progress, add new books, and
            manage your collection.
          </p>
        </div>

        {/* Quick Actions Card */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            <Link
              to="/books"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg
                className="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New Book
            </Link>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              <svg
                className="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sort Books
            </button>
          </div>
        </div>

        {/* Reading Stats Card */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Reading Stats
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Books In Progress
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stats.inProgress.count}/{stats.total}
                </p>
              </div>
              <div className="progress-container">
                <div className="progress-bar"  style={{ width: `${stats.inProgress.percentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Books Completed
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stats.completed.count}/{stats.total}
                </p>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${stats.completed.percentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Suggestions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Reading Suggestions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="card p-4 flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Add Your First Book
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get started by adding books to your collection
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Track Your Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update reading progress to stay motivated
              </p>
            </div>
          </div>

          <div className="card p-4 flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-amber-600 dark:text-amber-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Rate Your Books
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keep track of your favorites
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

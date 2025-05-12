import { createFileRoute } from "@tanstack/react-router";
import { useBooks } from "@/hooks/useBooks";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
}

export const Route = createFileRoute("/_auth/detail/$bookId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { bookId } = Route.useParams();
  const { getBookById, isLoading, error } = useBooks();
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) {
        console.error("Book ID is not defined");
        return;
      }

      try {
        const bookResponse = await getBookById(bookId);
        setBook(bookResponse.data);
      } catch (error) {
        console.error("Error fetching book data:", error);
      }
    };

    loadBook();
  }, [bookId, getBookById]);

  if (isLoading('fetchOne', bookId)) {
    return (
      <div className="p-4">
        <div>Loading book details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div>Error: {error.message}</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-4">
        <div>Book not found</div>
      </div>
    );
  }

  console.log("Book data:", book);
  

  return (
    <div className="container-custom p-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Book Detail Page</h1>
        
        {/* Book details */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">{book.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">by {book.author}</p>
          <p className="text-gray-600 dark:text-gray-400">ISBN: {book.isbn}</p>
          <p className="text-gray-600 dark:text-gray-400">Published: {book.publishedYear}</p>
        </div>

        <div className="mt-4">
          <Link to="/books" className="btn btn-primary">
            Back to Books
          </Link>
        </div>
      </div>
    </div>
  );
}

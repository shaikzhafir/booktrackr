import { createFileRoute } from "@tanstack/react-router";
import { useBooks } from "@/hooks/useBooks";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  image_url: string;
  user_id?: string;
  book_id?: string;
  progress?: number;
  start_date?: string;
  finish_date?: string;
  rating?: number;
  review?: string;
}

export const Route = createFileRoute("/_auth/detail/$bookId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { bookId } = Route.useParams();
  const { getBookById, updateBook, isLoading, error } = useBooks();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>("");
  const [finishDate, setFinishDate] = useState<string>("");
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) {
        console.error("Book ID is not defined");
        return;
      }

      try {
        const bookResponse = await getBookById(bookId);
        console.log("Book response:", bookResponse);
        setBook(bookResponse.data);
        // Initialize form values with existing data
        if (bookResponse.data.progress) {
          setProgress(bookResponse.data.progress);
        }
        if (bookResponse.data.rating) {
          setRating(bookResponse.data.rating);
        }
        if (bookResponse.data.review) {
          setReview(bookResponse.data.review);
        }
        if (bookResponse.data.finish_date) {
          // Format date for input if needed
          setFinishDate(bookResponse.data.finish_date.split(' ')[0]);
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
      }
    };

    loadBook();
  }, [bookId, getBookById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateSuccess(false);
    setUpdateError(null);

    if (!bookId || !book) return;

    try {
      const bookUpdate = {
        id: bookId,
        progress: progress,
        rating: rating,
        review: review,
        finishDate: finishDate ? new Date(finishDate).toISOString() : undefined
      };

      const response = await updateBook(bookId, bookUpdate);
      console.log('Update response:', response);
      setUpdateSuccess(true);

      // Update the local book state with new values
      setBook(prev => {
        if (!prev) return null;
        return {
          ...prev,
          progress: progress,
          rating: rating,
          review: review,
          finish_date: finishDate
        };
      });
    } catch (error) {
      console.error('Error updating book:', error);
      setUpdateError('Failed to update book. Please try again.');
    }
  };

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

  return (
    <div className="container-custom p-6">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">Book Detail Page</h1>

        {/* Book details */}
        <div className="mb-4 flex">
          {book.image_url && (
            <div className="mr-6">
              <img src={book.image_url} alt={book.title} className="w-32 h-auto rounded" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold">{book.title}</h2>
            <p className="text-gray-600 dark:text-gray-400">by {book.author}</p>
            <p className="text-gray-600 dark:text-gray-400">ISBN: {book.isbn}</p>
            {book.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{book.description}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Link to="/books" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Back to Books
          </Link>
        </div>
      </div>

      {/* Update Book Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Update Reading Progress</h2>

        {updateSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Book updated successfully!
          </div>
        )}

        {updateError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {updateError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reading Progress */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Reading Progress (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center">{progress}%</div>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Rating (1-5)
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Finish Date */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Finish Date
            </label>
            <input
              type="date"
              value={finishDate}
              onChange={(e) => setFinishDate(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Review */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Review
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="w-full p-2 border rounded h-32 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Write your review here..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            disabled={isLoading('update', bookId)}
          >
            {isLoading('update', bookId) ? 'Updating...' : 'Update Book'}
          </button>
        </form>
      </div>
    </div>
  );
}

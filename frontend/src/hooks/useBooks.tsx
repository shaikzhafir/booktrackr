// hooks/useBooks.ts
import { useState, useCallback } from 'react';
import { useAuth } from '../auth'; // Assuming you have an auth context


interface BookResponse {
    data: Book;
    message: string;
    error?: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
}

// Separate loading states for different operations
interface LoadingState {
  fetchAll: boolean;
  create: boolean;
  update: Record<string, boolean>; // Track by book ID
  delete: Record<string, boolean>; // Track by book ID
  fetchOne: Record<string, boolean>; // Track by book ID
}

interface UseBookReturn {
  // Data states
  books: Book[];
  loadingState: LoadingState;
  error: Error | null;
  
  // CRUD operations
  fetchBooks: () => Promise<void>;
  getBookById: (id: string) => Promise<BookResponse>;
  createBook: (book: Omit<Book, 'id'>) => Promise<Book>;
  updateBook: (id: string, book: Partial<Book>) => Promise<Book>;
  deleteBook: (id: string) => Promise<void>;
  
  // Helper methods
  isLoading: (operation: 'fetchAll' | 'create' | 'update' | 'delete' | 'fetchOne', id?: string) => boolean;
}

const API_BASE_URL = 'http://localhost:8080/user/books';

const initialLoadingState: LoadingState = {
  fetchAll: false,
  create: false,
  update: {},
  delete: {},
  fetchOne: {},
};

export const useBooks = (): UseBookReturn => {
     const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(initialLoadingState);
  const [error, setError] = useState<Error | null>(null);

  // Helper to update loading state
  const setOperationLoading = (
    operation: keyof LoadingState,
    loading: boolean,
    id?: string
  ) => {
    setLoadingState(prev => {
      if (typeof prev[operation] === 'boolean') {
        return { ...prev, [operation]: loading };
      }
      return {
        ...prev,
        [operation]: {
          ...(prev[operation] as Record<string, boolean>),
          [id!]: loading,
        },
      };
    });
  };

  // Helper to check loading state
  const isLoading = (
    operation: keyof LoadingState,
    id?: string
  ): boolean => {
    if (typeof loadingState[operation] === 'boolean') {
      return loadingState[operation] as boolean;
    }
    return id ? (loadingState[operation] as Record<string, boolean>)[id] : false;
  };

  // Fetch all books
  const fetchBooks = useCallback(async () => {
    try {
      setOperationLoading('fetchAll', true);
      setError(null);
      
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch books');
      
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setOperationLoading('fetchAll', false);
    }
  }, []);

  // Get a single book by ID
  const getBookById = useCallback(async (id: string): Promise<BookResponse> => {
    try {
      setOperationLoading('fetchOne', true, id);
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user}`, // Assuming you have a token
        },
      });
      if (!response.ok) throw new Error('Book not found');
      
      return await response.json();
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    } finally {
      setOperationLoading('fetchOne', false, id);
    }
  }, []);

  // Create a new book
  const createBook = useCallback(async (book: Omit<Book, 'id'>): Promise<Book> => {
    try {
      setOperationLoading('create', true);
      
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });
      
      if (!response.ok) throw new Error('Failed to create book');
      
      const newBook = await response.json();
      setBooks(prev => [...prev, newBook]);
      return newBook;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    } finally {
      setOperationLoading('create', false);
    }
  }, []);

  // Update an existing book
  const updateBook = useCallback(async (id: string, bookUpdate: Partial<Book>): Promise<Book> => {
    try {
      setOperationLoading('update', true, id);
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookUpdate),
      });
      
      if (!response.ok) throw new Error('Failed to update book');
      
      const updatedBook = await response.json();
      setBooks(prev => prev.map(book => 
        book.id === id ? updatedBook : book
      ));
      return updatedBook;
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    } finally {
      setOperationLoading('update', false, id);
    }
  }, []);

  // Delete a book
  const deleteBook = useCallback(async (id: string): Promise<void> => {
    try {
      setOperationLoading('delete', true, id);
      
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete book');
      
      setBooks(prev => prev.filter(book => book.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    } finally {
      setOperationLoading('delete', false, id);
    }
  }, []);

  return {
    books,
    loadingState,
    error,
    fetchBooks,
    getBookById,
    createBook,
    updateBook,
    deleteBook,
    isLoading,
  };
};

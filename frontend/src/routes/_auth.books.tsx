import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth'

// Book interface matching the backend model
interface Book {
  id: number
  user_id: number
  title: string
  author: string
 progress: number
    isbn: string
    description: string
    image_url: string
}

// Form data for creating a new book
interface BookFormData {
  title: string
  isbn: string
  description: string
  author: string
  image_url: string
    progress: number
}

export const Route = createFileRoute('/_auth/books')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    description: '',
    image_url: '',
    progress : 0,
  })
  const [formVisible, setFormVisible] = useState(false)

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks()
  }, [])

  // Function to fetch books from API
  const fetchBooks = async () => {
    console.log('fetchBooks called');
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching books for user:', user);
      
      
      const response = await fetch('http://localhost:8080/books', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user}` // Using user ID as token
        }
      })
      

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error fetching books:', errorData);
        
        throw new Error(errorData.error || 'Failed to fetch books')
      }

      const res = await response.json()
      console.log('Fetched books:', res);
      
      setBooks(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching books')
      console.error('Error fetching books:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to add a new book
  const addBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      const response = await fetch('http://localhost:8080/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user}` // Using user ID as token
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
            description: formData.description,
            image_url: formData.image_url
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add book')
      }

      // API returns updated book list after adding
      const data = await response.json()
      setBooks(data)
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        image_url: '',
        progress: 0,
      })
      setFormVisible(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding book')
      console.error('Error adding book:', err)
    }
  }

  // Update form data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_pages' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className="container-custom">
      <div className="page-header">
        <h1 className="page-title">My Books</h1>
        <button 
          onClick={() => setFormVisible(!formVisible)}
          className={`btn ${formVisible ? 'btn-danger' : 'btn-primary'}`}
        >
          {formVisible ? (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancel
            </span>
          ) : (
            <span className="flex items-center">
              <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Book
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {formVisible && (
        <div className="card mb-8 fade-in">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Book</h2>
          </div>
          <div className="card-body">
            <form onSubmit={addBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group md:col-span-2">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter book title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter author name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter ISBN number"
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Description</label>
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter book description"
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Enter book cover image URL"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : books.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mb-4 text-gray-400 dark:text-gray-500">
            <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books in your collection</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Add your first book to start tracking your reading progress</p>
          <button 
            onClick={() => setFormVisible(true)}
            className="btn btn-primary mx-auto"
          >
            Add Your First Book
          </button>
        </div>
      ) : (
        <div className="book-grid">
          {books.map(book => (
            <div key={book.id} className="card card-hover book-card">
              {book.image_url ? (
                <div className="book-image-container">
                  <img 
                    src={book.image_url} 
                    alt={book.title}
                    className="book-image"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/200x300/e2e8f0/64748b?text=No+Image';
                    }}
                  />
                </div>
              ) : (
                <div className="book-image-container flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">By {book.author}</p>
                {book.description && (
                  <p className="book-description">{book.description}</p>
                )}
                <div className="mt-auto pt-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Reading Progress</span>
                    <span className="font-medium">{book.progress}%</span>
                  </div>
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${book.progress}%` }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}